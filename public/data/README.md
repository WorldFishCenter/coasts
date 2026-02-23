# Static Data Directory

This directory contains static data files that are updated daily via GitHub Actions.

Files in this directory:

1. `pds_grids.json` - GPS movement data summarized in 1km grid cells
2. `wio_map.json` - Fisheries data in GeoJSON format (used by the app)
3. `time_series.json` - Time series data for each region (used by the app)
4. `map_gaul1.json` - GAUL1 boundaries GeoJSON (for future map integration)
5. `map_gaul2.json` - GAUL2 boundaries GeoJSON
6. `ts_gaul1.json` - Time series by GAUL1 region
7. `ts_gaul2.json` - Time series by GAUL2 region

These files are automatically updated by the GitHub Actions workflow in `.github/workflows/fetch-mongodb-data.yml` which runs daily at midnight UTC.

**Do not modify these files manually** as your changes will be overwritten by the automated process. 