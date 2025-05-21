import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'portal';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');

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
    
    // Fetch and save pds_grids collection
    console.log('Fetching pds_grids data...');
    const pdsGrids = await db.collection('pds_grids').find({}).toArray();
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'pds_grids.json'),
      JSON.stringify(pdsGrids, null, 2)
    );
    console.log(`Saved pds_grids data: ${pdsGrids.length} records`);
    
    // Fetch and save wio_summaries_geo collection
    console.log('Fetching wio_summaries_geo data...');
    const wioSummaries = await db.collection('wio_summaries_geo').find({}).toArray();
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'wio_summaries_geo.json'),
      JSON.stringify(wioSummaries, null, 2)
    );
    console.log(`Saved wio_summaries_geo data: ${wioSummaries.length} records`);
    
    console.log('Data fetch completed successfully');
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error); 