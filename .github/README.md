# GitHub Actions Workflows

This directory contains GitHub Actions workflows for various automated tasks in the repository.

## MongoDB Data Fetching Workflow

The `fetch-mongodb-data.yml` workflow fetches data from MongoDB and stores it as static JSON files in the `public/data` directory.

### Workflow Schedule

The workflow runs:
- Daily at midnight UTC
- On manual trigger (workflow_dispatch)

### Required Secrets

To make this workflow function correctly, you need to add the following secrets to your GitHub repository:

1. `MONGODB_URI` - The MongoDB connection string
2. `VITE_MAPBOX_TOKEN` - Your Mapbox access token

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

The workflow produces the following files:
- `/public/data/pds_grids.json`
- `/public/data/wio_summaries_geo.json` 