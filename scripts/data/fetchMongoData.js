import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'portal-dev';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');

/** GAUL metric columns - pass through if present, default to null if missing */
const METRIC_COLUMNS = ['mean_cpue', 'mean_cpua', 'mean_rpue', 'mean_rpua', 'mean_price_kg'];

/** ISO3 code -> country name (lowercase) for wio_map features */
const ISO3_TO_COUNTRY = {
  KEN: 'kenya',
  TZA: 'tanzania',
  MOZ: 'mozambique',
  MDG: 'madagascar',
  COM: 'comoros',
  SYC: 'seychelles',
  MUS: 'mauritius',
  ZAF: 'south africa'
};

/** Country name -> canonical key country so map and time series join (e.g. Zanzibar polygons use TZA → tanzania) */
const COUNTRY_KEY_ALIASES = { zanzibar: 'tanzania' };
const countryForKey = (country) =>
  COUNTRY_KEY_ALIASES[country?.toLowerCase()] ?? country;

/**
 * Normalize GAUL fields: map gaul_2_name -> gaul2_name, iso3_code -> country
 * @param {Object} obj - Object with potential gaul_2_name or iso3_code
 * @returns {Object} Object with gaul2_name and country set
 */
const normalizeGaulFields = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const normalized = { ...obj };
  if (normalized.gaul_2_name !== undefined && normalized.gaul2_name === undefined) {
    normalized.gaul2_name = normalized.gaul_2_name;
  }
  if (!normalized.country && normalized.iso3_code) {
    const c = ISO3_TO_COUNTRY[normalized.iso3_code?.toUpperCase?.()];
    if (c) normalized.country = c;
  }
  return normalized;
};

/**
 * Build canonical GAUL key
 */
const gaulKey = (country, gaul1Name, gaul2Name) =>
  `${country}_${gaul1Name}_${gaul2Name}`;

/**
 * Extract metric value from record, with optional fallback
 */
const getMetric = (record, name) => {
  const val = record[name];
  return typeof val === 'number' && !isNaN(val) ? val : null;
};

/**
 * Get the most recent time series entry that has at least one metric value.
 * Future/placeholder rows with null metrics are skipped.
 */
const getLatestMetricsFromSeries = (series) => {
  if (!Array.isArray(series) || series.length === 0) return {};
  const sorted = [...series].sort((a, b) => new Date(b.date) - new Date(a.date));
  const withMetrics = sorted.find((entry) =>
    METRIC_COLUMNS.some((col) => getMetric(entry, col) != null)
  );
  return withMetrics ?? sorted[0] ?? {};
};

/**
 * Validate map feature structure (GAUL schema)
 * @param {Object} feature - The feature to validate (may have gaul_2_name)
 * @returns {boolean} Whether the feature is valid
 */
const validateMapFeature = (feature) => {
  if (!feature || typeof feature !== 'object') return false;
  const f = normalizeGaulFields(feature);
  if (!f.country || !f.gaul1_name || !f.gaul2_name) return false;
  if (!f.geometry || !f.geometry.type || !f.geometry.coordinates) return false;
  return true;
};

/**
 * Validate time series record structure (GAUL schema)
 * @param {Object} record - The record to validate (may have gaul_2_name)
 * @returns {boolean} Whether the record is valid
 */
const validateTimeSeriesRecord = (record) => {
  if (!record || typeof record !== 'object') return false;
  const r = normalizeGaulFields(record);
  if (!r.country || !r.gaul1_name || !r.gaul2_name || !r.date) return false;
  return true;
};

/**
 * Validate PDS grid record structure
 * @param {Object} grid - The grid to validate
 * @returns {boolean} Whether the grid is valid
 */
const validatePdsGrid = (grid) => {
  if (!grid || typeof grid !== 'object') return false;
  if (typeof grid.lat_grid_1km !== 'number' || typeof grid.lng_grid_1km !== 'number') return false;
  return true;
};

async function main() {
  console.log('Starting MongoDB data fetch...');
  
  // Create MongoDB client
  const client = new MongoClient(MONGODB_URI);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Fetch data from all collections
    const [mapData, timeSeriesData, pdsGridsData] = await Promise.all([
      db.collection('wio_map').find({}).toArray(),
      db.collection('regional_metrics').find({}).toArray(),
      db.collection('pds_grids').find({}).toArray()
    ]);

    console.log(`Fetched ${mapData.length} map features`);
    console.log(`Fetched ${timeSeriesData.length} time series records`);
    console.log(`Fetched ${pdsGridsData.length} pds grids records`);

    // Normalize GAUL fields for validation
    const normalizedMapForValidation = mapData.map(normalizeGaulFields);
    const normalizedTimeSeriesForValidation = timeSeriesData.map(normalizeGaulFields);

    // Validate data
    const invalidMapFeatures = normalizedMapForValidation.filter((f) => !validateMapFeature(f));
    const invalidTimeSeriesRecords = normalizedTimeSeriesForValidation.filter(
      (r) => !validateTimeSeriesRecord(r)
    );
    const invalidPdsGrids = pdsGridsData.filter(grid => !validatePdsGrid(grid));

    if (invalidMapFeatures.length > 0) {
      console.error(`Found ${invalidMapFeatures.length} invalid map features`);
      console.error('First invalid feature:', JSON.stringify(invalidMapFeatures[0], null, 2));
    }

    if (invalidTimeSeriesRecords.length > 0) {
      console.error(`Found ${invalidTimeSeriesRecords.length} invalid time series records`);
      console.error('First invalid record:', JSON.stringify(invalidTimeSeriesRecords[0], null, 2));
    }

    if (invalidPdsGrids.length > 0) {
      console.error(`Found ${invalidPdsGrids.length} invalid PDS grids`);
      console.error('First invalid grid:', JSON.stringify(invalidPdsGrids[0], null, 2));
    }

    // Normalize GAUL fields and filter invalid data
    const normalizedMapData = mapData.map(normalizeGaulFields);
    const normalizedTimeSeriesData = timeSeriesData.map(normalizeGaulFields);
    const validMapData = normalizedMapData.filter(validateMapFeature);
    const validTimeSeriesData = normalizedTimeSeriesData.filter(validateTimeSeriesRecord);
    const validPdsGridsData = pdsGridsData.filter(validatePdsGrid);

    // Create a lookup map for time series data (key: country_gaul1_gaul2)
    const timeSeriesMap = new Map();
    validTimeSeriesData.forEach(record => {
      const keyCountry = countryForKey(record.country);
      const key = gaulKey(keyCountry, record.gaul1_name, record.gaul2_name);
      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, []);
      }
      timeSeriesMap.get(key).push(record);
    });

    // Process map data and attach time series
    const processedFeatures = validMapData.map(feature => {
      const keyCountry = countryForKey(feature.country);
      const key = gaulKey(keyCountry, feature.gaul1_name, feature.gaul2_name);
      const timeSeries = timeSeriesMap.get(key) || [];

      timeSeries.sort((a, b) => new Date(a.date) - new Date(b.date));
      const latestMetrics = getLatestMetricsFromSeries(timeSeries);

      const props = {
        country: feature.country,
        gaul1_name: feature.gaul1_name,
        gaul2_name: feature.gaul2_name,
        time_series: timeSeries,
        ...Object.fromEntries(
          METRIC_COLUMNS.map((col) => [col, getMetric(latestMetrics, col) ?? 0])
        )
      };
      return {
        type: 'Feature',
        geometry: feature.geometry,
        properties: props
      };
    });

    const geojson = {
      type: 'FeatureCollection',
      features: processedFeatures
    };

    // Create time series data structure (key: country_gaul1_gaul2)
    const timeSeriesByRegion = {};
    validTimeSeriesData.forEach(record => {
      const keyCountry = countryForKey(record.country);
      const key = gaulKey(keyCountry, record.gaul1_name, record.gaul2_name);
      if (!timeSeriesByRegion[key]) {
        timeSeriesByRegion[key] = {
          country: record.country,
          gaul1_name: record.gaul1_name,
          gaul2_name: record.gaul2_name,
          data: []
        };
      }
      timeSeriesByRegion[key].data.push({
        date: record.date,
        ...Object.fromEntries(
          METRIC_COLUMNS.map((col) => [col, getMetric(record, col)])
        )
      });
    });

    // Save all files
    await Promise.all([
      fs.writeFile(
        path.join(OUTPUT_DIR, 'wio_map.json'),
        JSON.stringify(geojson, null, 2)
      ),
      fs.writeFile(
        path.join(OUTPUT_DIR, 'time_series.json'),
        JSON.stringify(timeSeriesByRegion, null, 2)
      ),
      fs.writeFile(
        path.join(OUTPUT_DIR, 'pds_grids.json'),
        JSON.stringify(validPdsGridsData, null, 2)
      )
    ]);

    console.log('Data saved successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error); 