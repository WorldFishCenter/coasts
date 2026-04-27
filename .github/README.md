# GitHub Actions Workflows

This directory contains GitHub Actions workflows for various automated tasks in the repository.

## Data Fetching Workflows

- `fetch-mongodb-data.yml` fetches GAUL boundaries/time series from MongoDB and writes static JSON into `public/data`.
- `fetch-gcp-pds-data.yml` fetches latest versioned PDS files from Google Cloud Storage and writes static artifacts into `public/data`.

### Workflow Schedule

MongoDB workflow runs:
- Daily at midnight UTC
- On manual trigger (workflow_dispatch)

GCP PDS workflow runs:
- Daily at 00:15 UTC
- On manual trigger (workflow_dispatch)

### Required Secrets

To make workflows function correctly, add these repository secrets:

1. `MONGODB_URI` - MongoDB connection string
2. `VITE_MAPBOX_TOKEN` - Mapbox access token (app build/runtime)
3. `GCP_SA_KEY` - Google Cloud service account JSON
4. `GCP_BUCKET_NAME` - Google Cloud bucket name
5. `GCP_PDS_GROUNDS_PREFIX` - Optional grounds file prefix (default in script)
6. `GCP_PDS_EFFORT_PREFIX` - Optional effort file prefix (default in script)
7. `GCP_PDS_FRAME_GEARS_PREFIX` - Optional frame-gears prefix (default in script)

### How to Add Secrets

1. Go to your GitHub repository
2. Click on "Settings"
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click on "New repository secret"
5. Add each secret with its name and value
   - Name: `MONGODB_URI`
   - Value: Your MongoDB connection string (from your local .env file)
   - Name: `VITE_MAPBOX_TOKEN`
   - Value: Your Mapbox access token (from your local .env file)

### Output Files

Workflows produce/update these files:
- `/public/data/map_gaul1.json`
- `/public/data/map_gaul2.json`
- `/public/data/ts_gaul1.json`
- `/public/data/ts_gaul2.json`
- `/public/data/pds-fishing-grounds.geojson`
- `/public/data/pds-h3-effort-r9.json`
- `/public/data/frame-gears.json`