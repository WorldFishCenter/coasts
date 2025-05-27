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

async function fetchData() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('portal');

    // Fetch data from all collections
    const [mapData, timeSeriesData, pdsGridsData] = await Promise.all([
      db.collection('wio_map').find({}).toArray(),
      db.collection('regional_metrics').find({}).toArray(),
      db.collection('pds_grids').find({}).toArray()
    ]);

    console.log(`Fetched ${mapData.length} map features`);
    console.log(`Fetched ${timeSeriesData.length} time series records`);
    console.log(`Fetched ${pdsGridsData.length} pds grids records`);

    // Create a lookup map for time series data
    const timeSeriesMap = new Map();
    timeSeriesData.forEach(record => {
      // Skip records without country or region
      if (!record.country || !record.region) {
        console.warn('Skipping time series record without country or region:', record);
        return;
      }
      const key = `${record.country}_${record.region}`;
      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, []);
      }
      timeSeriesMap.get(key).push(record);
    });

    // Process map data and attach time series
    const processedFeatures = mapData.map(feature => {
      // Handle features where country/region might be at root level or in properties
      const country = feature.country || feature.properties?.country;
      const region = feature.region || feature.properties?.region;
      
      if (!country || !region) {
        console.warn('Skipping feature without country or region:', feature);
        return null;
      }
      
      const key = `${country}_${region}`;
      const timeSeries = timeSeriesMap.get(key) || [];
      
      // Sort time series by date
      timeSeries.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Get the latest metrics
      const latestMetrics = timeSeries[timeSeries.length - 1] || {};
      
      // Create properties object if it doesn't exist
      const properties = feature.properties || {};
      
      return {
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
          ...properties,
          country: country,
          region: region,
          time_series: timeSeries,
          // Don't use || 0 - let undefined values remain undefined
          mean_cpue: latestMetrics.mean_cpue,
          mean_cpua: latestMetrics.mean_cpua,
          mean_rpue: latestMetrics.mean_rpue,
          mean_rpua: latestMetrics.mean_rpua,
          mean_price_kg: latestMetrics.mean_price_kg
        }
      };
    }).filter(feature => feature !== null); // Remove null features

    // Create GeoJSON structure
    const geojson = {
      type: 'FeatureCollection',
      features: processedFeatures
    };

    // Create time series data structure
    const timeSeriesByRegion = {};
    timeSeriesData.forEach(record => {
      // Skip records without country or region
      if (!record.country || !record.region) {
        return;
      }
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