import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'portal';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');

/** GAUL metric columns - pass through if present, default to null if missing */
const METRIC_COLUMNS = ['mean_cpue', 'mean_cpua', 'mean_rpue', 'mean_rpua', 'mean_price_kg'];

/** Minimum fraction of the previous record count an output must retain to be written */
const MIN_RETENTION_RATIO = 0.5;

/** ISO3 code -> country name (lowercase) for GAUL features */
const ISO3_TO_COUNTRY = {
  KEN: 'kenya',
  TZA: 'tanzania',
  MOZ: 'mozambique',
  TLS: 'timor',
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
 * Build canonical GAUL key (GAUL2: country_gaul1_gaul2)
 */
const gaulKey = (country, gaul1Name, gaul2Name) =>
  `${country}_${gaul1Name}_${gaul2Name}`;

/**
 * Build canonical GAUL1 key (country_gaul1_name only)
 */
const gaul1Key = (country, gaul1Name) => `${country}_${gaul1Name}`;

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
 * Validate GAUL1 map feature (country, gaul1_name, geometry; no gaul2_name)
 * @param {Object} feature - The feature to validate (may have iso3_code)
 * @returns {boolean} Whether the feature is valid
 */
const validateMapFeatureGaul1 = (feature) => {
  if (!feature || typeof feature !== 'object') return false;
  const f = normalizeGaulFields(feature);
  if (!f.country || !f.gaul1_name) return false;
  if (!f.geometry || !f.geometry.type || !f.geometry.coordinates) return false;
  return true;
};

/**
 * Validate GAUL1 time series record (country, gaul1_name, date; no gaul2_name)
 * @param {Object} record - The record to validate
 * @returns {boolean} Whether the record is valid
 */
const validateTimeSeriesRecordGaul1 = (record) => {
  if (!record || typeof record !== 'object') return false;
  const r = normalizeGaulFields(record);
  if (!r.country || !r.gaul1_name || !r.date) return false;
  return true;
};

/**
 * Count records in an output payload (GeoJSON, keyed region object, or array)
 * @param {Object|Array} payload - The payload about to be written
 * @returns {number} Number of records the payload carries
 */
const countRecords = (payload) => {
  if (Array.isArray(payload)) return payload.length;
  if (payload && Array.isArray(payload.features)) return payload.features.length;
  if (payload && typeof payload === 'object') return Object.keys(payload).length;
  return 0;
};

/**
 * Read the record count of an already-written output file.
 * @param {string} filePath - Absolute path to the existing output file
 * @returns {Promise<number|null>} Count, or null when absent/unreadable (first run, fresh clone)
 */
const readExistingCount = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return countRecords(JSON.parse(raw));
  } catch {
    return null;
  }
};

/**
 * Find outputs that would truncate the file already on disk.
 * A transient MongoDB read (e.g. a collection caught mid-rewrite by the upstream
 * pipeline) yields an empty or partial payload; writing it silently wipes the
 * previous run's data and the CI job commits the loss.
 * @param {Array<{fileName: string, payload: Object|Array}>} outputs - Pending writes
 * @returns {Promise<Array<{fileName: string, previous: number, current: number}>>} Offending outputs
 */
const findTruncatedOutputs = async (outputs) => {
  const checks = await Promise.all(
    outputs.map(async ({ fileName, payload }) => {
      const previous = await readExistingCount(path.join(OUTPUT_DIR, fileName));
      const current = countRecords(payload);
      if (previous === null || previous === 0) return null;
      if (current >= previous * MIN_RETENTION_RATIO) return null;
      return { fileName, previous, current };
    })
  );
  return checks.filter(Boolean);
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
    
    // Fetch GAUL1/GAUL2 collections
    const [
      mapGaul1Data,
      mapGaul2Data,
      metricsGaul1Data,
      metricsGaul2Data
    ] = await Promise.all([
      db.collection('wio_gaul1').find({}).toArray(),
      db.collection('wio_gaul2').find({}).toArray(),
      db.collection('metrics_gaul1').find({}).toArray(),
      db.collection('metrics_gaul2').find({}).toArray()
    ]);

    console.log(`Fetched ${mapGaul1Data.length} GAUL1 map features`);
    console.log(`Fetched ${mapGaul2Data.length} GAUL2 map features`);
    console.log(`Fetched ${metricsGaul1Data.length} GAUL1 metrics records`);
    console.log(`Fetched ${metricsGaul2Data.length} GAUL2 metrics records`);

    // Normalize and validate GAUL1/GAUL2 data
    const normalizedMapGaul1 = mapGaul1Data.map(normalizeGaulFields);
    const normalizedMapGaul2 = mapGaul2Data.map(normalizeGaulFields);
    const normalizedMetricsGaul1 = metricsGaul1Data.map(normalizeGaulFields);
    const normalizedMetricsGaul2 = metricsGaul2Data.map(normalizeGaulFields);
    const invalidMapGaul1 = normalizedMapGaul1.filter((f) => !validateMapFeatureGaul1(f));
    const invalidMapGaul2 = normalizedMapGaul2.filter((f) => !validateMapFeature(f));
    const invalidMetricsGaul1 = normalizedMetricsGaul1.filter(
      (r) => !validateTimeSeriesRecordGaul1(r)
    );
    const invalidMetricsGaul2 = normalizedMetricsGaul2.filter(
      (r) => !validateTimeSeriesRecord(r)
    );
    if (invalidMapGaul1.length > 0) {
      console.error(`Found ${invalidMapGaul1.length} invalid GAUL1 map features`);
    }
    if (invalidMapGaul2.length > 0) {
      console.error(`Found ${invalidMapGaul2.length} invalid GAUL2 map features`);
    }
    if (invalidMetricsGaul1.length > 0) {
      console.error(`Found ${invalidMetricsGaul1.length} invalid GAUL1 metrics records`);
    }
    if (invalidMetricsGaul2.length > 0) {
      console.error(`Found ${invalidMetricsGaul2.length} invalid GAUL2 metrics records`);
    }
    const validMapGaul1 = normalizedMapGaul1.filter(validateMapFeatureGaul1);
    const validMapGaul2 = normalizedMapGaul2.filter(validateMapFeature);
    const validMetricsGaul1 = normalizedMetricsGaul1.filter(validateTimeSeriesRecordGaul1);
    const validMetricsGaul2 = normalizedMetricsGaul2.filter(validateTimeSeriesRecord);

    // --- GAUL1 map: GeoJSON FeatureCollection (no gaul2_name, no time_series) ---
    const geojsonGaul1 = {
      type: 'FeatureCollection',
      features: validMapGaul1.map((feature) => ({
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
          country: feature.country,
          gaul1_name: feature.gaul1_name
        }
      }))
    };

    // --- GAUL1 time series: keyed by country_gaul1_name ---
    const timeSeriesByRegionGaul1 = {};
    validMetricsGaul1.forEach((record) => {
      const keyCountry = countryForKey(record.country);
      const key = gaul1Key(keyCountry, record.gaul1_name);
      if (!timeSeriesByRegionGaul1[key]) {
        timeSeriesByRegionGaul1[key] = {
          country: record.country,
          gaul1_name: record.gaul1_name,
          data: []
        };
      }
      timeSeriesByRegionGaul1[key].data.push({
        date: record.date,
        ...Object.fromEntries(
          METRIC_COLUMNS.map((col) => [col, getMetric(record, col)])
        )
      });
    });

    // --- GAUL2 map: features with time_series from metrics_gaul2 ---
    const timeSeriesMapGaul2 = new Map();
    validMetricsGaul2.forEach((record) => {
      const keyCountry = countryForKey(record.country);
      const key = gaulKey(keyCountry, record.gaul1_name, record.gaul2_name);
      if (!timeSeriesMapGaul2.has(key)) {
        timeSeriesMapGaul2.set(key, []);
      }
      timeSeriesMapGaul2.get(key).push(record);
    });
    const processedFeaturesGaul2 = validMapGaul2.map((feature) => {
      const keyCountry = countryForKey(feature.country);
      const key = gaulKey(keyCountry, feature.gaul1_name, feature.gaul2_name);
      const timeSeries = timeSeriesMapGaul2.get(key) || [];
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
    const geojsonGaul2 = {
      type: 'FeatureCollection',
      features: processedFeaturesGaul2
    };

    // --- GAUL2 time series: keyed by country_gaul1_gaul2 ---
    const timeSeriesByRegionGaul2 = {};
    validMetricsGaul2.forEach((record) => {
      const keyCountry = countryForKey(record.country);
      const key = gaulKey(keyCountry, record.gaul1_name, record.gaul2_name);
      if (!timeSeriesByRegionGaul2[key]) {
        timeSeriesByRegionGaul2[key] = {
          country: record.country,
          gaul1_name: record.gaul1_name,
          gaul2_name: record.gaul2_name,
          data: []
        };
      }
      timeSeriesByRegionGaul2[key].data.push({
        date: record.date,
        ...Object.fromEntries(
          METRIC_COLUMNS.map((col) => [col, getMetric(record, col)])
        )
      });
    });

    const outputs = [
      { fileName: 'map_gaul1.json', payload: geojsonGaul1 },
      { fileName: 'map_gaul2.json', payload: geojsonGaul2 },
      { fileName: 'ts_gaul1.json', payload: timeSeriesByRegionGaul1 },
      { fileName: 'ts_gaul2.json', payload: timeSeriesByRegionGaul2 }
    ];

    outputs.forEach(({ fileName, payload }) => {
      console.log(`Prepared ${fileName}: ${countRecords(payload)} records`);
    });

    // Refuse to overwrite good data with a truncated fetch - nothing is written
    const truncated = await findTruncatedOutputs(outputs);
    if (truncated.length > 0) {
      console.error(
        `Aborting: ${truncated.length} output(s) would drop below ` +
          `${MIN_RETENTION_RATIO * 100}% of the records already on disk.`
      );
      truncated.forEach(({ fileName, previous, current }) => {
        console.error(`  ${fileName}: ${previous} -> ${current} records`);
      });
      console.error(
        'A source collection was likely read mid-rewrite. No files written; re-run the fetch.'
      );
      throw new Error('Truncated fetch - refusing to write output files');
    }

    await Promise.all(
      outputs.map(({ fileName, payload }) =>
        fs.writeFile(path.join(OUTPUT_DIR, fileName), JSON.stringify(payload, null, 2))
      )
    );

    console.log('Data saved successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main().catch(console.error); 