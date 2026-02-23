# MongoDB Data Fetching Process

This directory contains scripts to fetch data from MongoDB and store it as static JSON files in the repository.

## Process Overview

1. A GitHub Actions workflow runs daily at midnight UTC
2. The workflow connects to the MongoDB database using the connection string from GitHub Secrets
3. Data is fetched from the `wio_map`, `regional_metrics`, `pds_grids`, `wio_gaul1`, `wio_gaul2`, `metrics_gaul1`, and `metrics_gaul2` collections
4. The data is saved as JSON files in the `public/data` directory
5. Changes are committed back to the repository

## Manual Execution

If you need to fetch data manually:

1. Make sure your `.env` file is set up with the `MONGODB_URI` variable
2. Run the command: `npm run fetch-data`

## Data Files

The script generates these files:

- `/public/data/pds_grids.json` - GPS movement data summarized in 1km grid cells
- `/public/data/wio_map.json` - Fisheries data in GeoJSON format (GAUL2-level, from `wio_map`)
- `/public/data/time_series.json` - Time series data for each region (from `regional_metrics`)
- `/public/data/map_gaul1.json` - GAUL1 boundaries GeoJSON (from `wio_gaul1`), for future map layers
- `/public/data/map_gaul2.json` - GAUL2 boundaries GeoJSON (from `wio_gaul2`)
- `/public/data/ts_gaul1.json` - Time series keyed by GAUL1 region (from `metrics_gaul1`)
- `/public/data/ts_gaul2.json` - Time series keyed by GAUL2 region (from `metrics_gaul2`)

## Data Structure

### PDS Grids
Contains spatially aggregated GPS movement data with time, speed, and visitation patterns.

### WIO Map
Contains fisheries data from coastal regions in Kenya and Zanzibar in GeoJSON format with MultiPolygon geometries.

### Time Series
Contains monthly metrics for each region including CPUE, RPUE, and price per kg. 