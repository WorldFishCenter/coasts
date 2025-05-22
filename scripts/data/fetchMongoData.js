import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'portal';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');

/**
 * Validate map feature structure
 * @param {Object} feature - The feature to validate
 * @returns {boolean} Whether the feature is valid
 */
const validateMapFeature = (feature) => {
  if (!feature || typeof feature !== 'object') return false;
  if (!feature.country || !feature.region) return false;
  if (!feature.geometry || !feature.geometry.type || !feature.geometry.coordinates) return false;
  return true;
};

/**
 * Validate time series record structure
 * @param {Object} record - The record to validate
 * @returns {boolean} Whether the record is valid
 */
const validateTimeSeriesRecord = (record) => {
  if (!record || typeof record !== 'object') return false;
  if (!record.country || !record.region || !record.date) return false;
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

    // Validate data
    const invalidMapFeatures = mapData.filter(feature => !validateMapFeature(feature));
    const invalidTimeSeriesRecords = timeSeriesData.filter(record => !validateTimeSeriesRecord(record));
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

    // Filter out invalid data
    const validMapData = mapData.filter(validateMapFeature);
    const validTimeSeriesData = timeSeriesData.filter(validateTimeSeriesRecord);
    const validPdsGridsData = pdsGridsData.filter(validatePdsGrid);

    // Create a lookup map for time series data
    const timeSeriesMap = new Map();
    validTimeSeriesData.forEach(record => {
      const key = `${record.country}_${record.region}`;
      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, []);
      }
      timeSeriesMap.get(key).push(record);
    });

    // Process map data and attach time series
    const processedFeatures = validMapData.map(feature => {
      // Create proper GeoJSON feature structure
      const key = `${feature.country}_${feature.region}`;
      const timeSeries = timeSeriesMap.get(key) || [];
      
      // Sort time series by date
      timeSeries.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Get the latest metrics
      const latestMetrics = timeSeries[timeSeries.length - 1] || {};
      
      return {
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
          country: feature.country,
          region: feature.region,
          time_series: timeSeries,
          mean_cpue: latestMetrics.mean_cpue || 0,
          mean_cpua: latestMetrics.mean_cpua || 0,
          mean_rpue: latestMetrics.mean_rpue || 0,
          mean_rpua: latestMetrics.mean_rpua || 0,
          mean_price_kg: latestMetrics.mean_price_kg || 0
        }
      };
    });

    // Create GeoJSON structure
    const geojson = {
      type: 'FeatureCollection',
      features: processedFeatures
    };

    // Create time series data structure
    const timeSeriesByRegion = {};
    validTimeSeriesData.forEach(record => {
      const key = `${record.country}_${record.region}`;
      if (!timeSeriesByRegion[key]) {
        timeSeriesByRegion[key] = {
          country: record.country,
          region: record.region,
          data: []
        };
      }
      timeSeriesByRegion[key].data.push({
        date: record.date,
        mean_cpue: record.mean_cpue,
        mean_cpua: record.mean_cpua,
        mean_rpue: record.mean_rpue,
        mean_rpua: record.mean_rpua,
        mean_price_kg: record.mean_price_kg
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