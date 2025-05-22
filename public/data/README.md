# Static Data Directory

This directory contains static data files that are updated daily via GitHub Actions.

Files in this directory:

1. `pds_grids.json` - GPS movement data summarized in 1km grid cells
2. `wio_map.json` - Fisheries data in GeoJSON format
3. `time_series.json` - Time series data for each region

These files are automatically updated by the GitHub Actions workflow in `.github/workflows/fetch-mongodb-data.yml` which runs daily at midnight UTC.

**Do not modify these files manually** as your changes will be overwritten by the automated process. 