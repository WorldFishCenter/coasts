# Static Data Directory

This directory contains static data files that are updated daily via GitHub Actions.

Files in this directory:

1. `map_gaul1.json` - GAUL1 boundaries GeoJSON
2. `map_gaul2.json` - GAUL2 boundaries GeoJSON with time series
3. `ts_gaul1.json` - Time series by GAUL1 region
4. `ts_gaul2.json` - Time series by GAUL2 region
5. `pds-fishing-grounds.geojson` - Latest fishing grounds
6. `pds-h3-effort-r9.json` - Latest H3 fishing effort grid
7. `frame-gears.json` - Latest frame survey gear counts
8. `bathymetry_contours_wio.geojson` - Static bathymetry contours (not updated automatically)

Files 1-4 are updated by `.github/workflows/fetch-mongodb-data.yml` and files 5-7 by `.github/workflows/fetch-gcp-pds-data.yml`, both daily.

**Do not modify these files manually** as your changes will be overwritten by the automated process. 