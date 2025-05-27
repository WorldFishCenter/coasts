# MongoDB Data Fetching Process

This directory contains scripts to fetch data from MongoDB and store it as static JSON files in the repository.

## Process Overview

1. A GitHub Actions workflow runs daily at midnight UTC
2. The workflow connects to the MongoDB database using the connection string from GitHub Secrets
3. Data is fetched from the `wio_map`, `regional_metrics`, and `pds_grids` collections
4. The data is saved as JSON files in the `public/data` directory
5. Changes are committed back to the repository

## Manual Execution

If you need to fetch data manually:

1. Make sure your `.env` file is set up with the `MONGODB_URI` variable
2. Run the command: `npm run fetch-data`

## Data Files

The script generates these files:

- `/public/data/pds_grids.json` - GPS movement data summarized in 1km grid cells
- `/public/data/wio_map.json` - Fisheries data in GeoJSON format
- `/public/data/time_series.json` - Time series data for each region

## Data Structure

### PDS Grids
Contains spatially aggregated GPS movement data with time, speed, and visitation patterns.

### WIO Map
Contains fisheries data from coastal regions in Kenya and Zanzibar in GeoJSON format with MultiPolygon geometries.

### Time Series
Contains monthly metrics for each region including CPUE, RPUE, and price per kg. 