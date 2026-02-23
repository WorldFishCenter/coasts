import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection string
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

/** GAUL metric columns - pass through if present, default to null if missing */
const METRIC_COLUMNS = ['mean_cpue', 'mean_cpua', 'mean_rpue', 'mean_rpua', 'mean_price_kg'];

const ISO3_TO_COUNTRY = {
  KEN: 'kenya', TZA: 'tanzania', MOZ: 'mozambique', MDG: 'madagascar',
  COM: 'comoros', SYC: 'seychelles', MUS: 'mauritius', ZAF: 'south africa'
};

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

const gaulKey = (country, gaul1Name, gaul2Name) =>
  `${country}_${gaul1Name}_${gaul2Name}`;

const COUNTRY_KEY_ALIASES = { zanzibar: 'tanzania' };
const countryForKey = (country) =>
  COUNTRY_KEY_ALIASES[country?.toLowerCase()] ?? country;

const getMetric = (record, name) => {
  const val = record[name];
  return typeof val === 'number' && !isNaN(val) ? val : null;
};

const getLatestMetricsFromSeries = (series) => {
  if (!Array.isArray(series) || series.length === 0) return {};
  const sorted = [...series].sort((a, b) => new Date(b.date) - new Date(a.date));
  const withMetrics = sorted.find((entry) =>
    METRIC_COLUMNS.some((col) => getMetric(entry, col) != null)
  );
  return withMetrics ?? sorted[0] ?? {};
};

const validateMapFeature = (feature) => {
  if (!feature || typeof feature !== 'object') return false;
  if (!feature.country || !feature.gaul1_name || !feature.gaul2_name) return false;
  if (!feature.geometry || !feature.geometry.type || !feature.geometry.coordinates) return false;
  return true;
};

const validateTimeSeriesRecord = (record) => {
  if (!record || typeof record !== 'object') return false;
  const r = normalizeGaulFields(record);
  if (!r.country || !r.gaul1_name || !r.gaul2_name || !r.date) return false;
  return true;
};

async function fetchData() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('portal');

    const [mapData, timeSeriesData, pdsGridsData] = await Promise.all([
      db.collection('wio_map').find({}).toArray(),
      db.collection('regional_metrics').find({}).toArray(),
      db.collection('pds_grids').find({}).toArray()
    ]);

    console.log(`Fetched ${mapData.length} map features`);
    console.log(`Fetched ${timeSeriesData.length} time series records`);
    console.log(`Fetched ${pdsGridsData.length} pds grids records`);

    const normalizedMapData = mapData.map((f) => {
      const n = normalizeGaulFields(f);
      const country = n.country || n.properties?.country || (n.iso3_code && ISO3_TO_COUNTRY[n.iso3_code?.toUpperCase?.()]);
      const gaul1 = n.gaul1_name || n.properties?.gaul1_name;
      const gaul2 = n.gaul2_name || n.gaul_2_name || n.properties?.gaul2_name || n.properties?.gaul_2_name;
      return { ...n, country, gaul1_name: gaul1, gaul2_name: gaul2 };
    });
    const normalizedTimeSeriesData = timeSeriesData.map(normalizeGaulFields);
    const validMapData = normalizedMapData.filter(validateMapFeature);
    const validTimeSeriesData = normalizedTimeSeriesData.filter(validateTimeSeriesRecord);

    const invalidMap = normalizedMapData.filter((f) => !validateMapFeature(f));
    const invalidTimeSeries = normalizedTimeSeriesData.filter((r) => !validateTimeSeriesRecord(r));
    if (invalidMap.length > 0) {
      console.warn(`Skipping ${invalidMap.length} map features without GAUL fields`);
    }
    if (invalidTimeSeries.length > 0) {
      console.warn(`Skipping ${invalidTimeSeries.length} time series records without GAUL fields`);
    }

    const timeSeriesMap = new Map();
    validTimeSeriesData.forEach((record) => {
      const keyCountry = countryForKey(record.country);
      const key = gaulKey(keyCountry, record.gaul1_name, record.gaul2_name);
      if (!timeSeriesMap.has(key)) timeSeriesMap.set(key, []);
      timeSeriesMap.get(key).push(record);
    });

    const processedFeatures = validMapData
      .map((feature) => {
        const keyCountry = countryForKey(feature.country);
        const key = gaulKey(keyCountry, feature.gaul1_name, feature.gaul2_name);
        const timeSeries = timeSeriesMap.get(key) || [];
        timeSeries.sort((a, b) => new Date(a.date) - new Date(b.date));
        const latestMetrics = getLatestMetricsFromSeries(timeSeries);
        const properties = feature.properties || {};
        return {
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            ...properties,
            country: feature.country,
            gaul1_name: feature.gaul1_name,
            gaul2_name: feature.gaul2_name,
            time_series: timeSeries,
            ...Object.fromEntries(
              METRIC_COLUMNS.map((col) => [col, getMetric(latestMetrics, col)])
            )
          }
        };
      })
      .filter(Boolean);

    const geojson = { type: 'FeatureCollection', features: processedFeatures };

    const timeSeriesByRegion = {};
    validTimeSeriesData.forEach((record) => {
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
        ...Object.fromEntries(METRIC_COLUMNS.map((col) => [col, getMetric(record, col)]))
      });
    });

    // Ensure the data directory exists
    const dataDir = path.join(__dirname, '..', '..', 'public', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save all files
    fs.writeFileSync(
      path.join(dataDir, 'wio_map.json'),
      JSON.stringify(geojson, null, 2)
    );

    fs.writeFileSync(
      path.join(dataDir, 'time_series.json'),
      JSON.stringify(timeSeriesByRegion, null, 2)
    );

    fs.writeFileSync(
      path.join(dataDir, 'pds_grids.json'),
      JSON.stringify(pdsGridsData, null, 2)
    );

    console.log('Data saved successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fetchData(); 