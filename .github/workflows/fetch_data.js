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

    const db = client.db('wio_db');

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
      const key = `${record.country}_${record.region}`;
      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, []);
      }
      timeSeriesMap.get(key).push(record);
    });

    // Process map data and attach time series
    const processedFeatures = mapData.map(feature => {
      const key = `${feature.properties.country}_${feature.properties.region}`;
      const timeSeries = timeSeriesMap.get(key) || [];
      
      // Sort time series by date
      timeSeries.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Get the latest metrics
      const latestMetrics = timeSeries[timeSeries.length - 1] || {};
      
      return {
        ...feature,
        properties: {
          ...feature.properties,
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
    timeSeriesData.forEach(record => {
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