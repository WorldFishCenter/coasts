# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
npm run dev

# Build for production  
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview

# Manual data fetch from MongoDB
node scripts/data/fetchMongoData.js
```

## Architecture Overview

This is a React-based interactive map application for visualizing coastal fisheries data, built with Vite and deployed on Vercel.

### Core Technologies
- **Frontend**: React 18 + Vite
- **Maps**: Mapbox GL JS + deck.gl for 3D visualizations
- **UI**: Tailwind CSS + Radix UI components
- **Data**: Static JSON files updated daily from MongoDB via GitHub Actions

### Data Architecture
The application uses three main data sources:
1. **WIO Map Data** (`public/data/wio_map.json`) - GeoJSON features for coastal regions in Kenya/Zanzibar
2. **Time Series Data** (`public/data/time_series.json`) - Historical fisheries metrics by region
3. **PDS Grids Data** (`public/data/pds_grids.json`) - GPS movement data in 1km grid cells

### Key Components Structure
- **Map.jsx** - Main map container with state management for all visualizations
- **Sidebar.jsx** - Left panel with controls, filters, and analysis panels
- **dataService.js** - All data loading, validation, and processing functions
- **hooks/** - Custom hooks for map data, layers, and tooltips
- **components/map/** - Map-specific components (legends, overlays, histograms)

### Data Flow
1. Data is fetched daily from MongoDB collections (`wio_map`, `regional_metrics`, `pds_grids`)
2. GitHub Actions workflow transforms and saves as static JSON files
3. Frontend loads static files and processes them for visualization
4. State management handles date ranges, country/region filters, and metric selection

### Environment Variables
Required for development:
```
VITE_MAPBOX_TOKEN=your_mapbox_token
MONGODB_URI=your_mongodb_connection_string
```

### Automated Data Updates
- GitHub Actions workflow runs daily at midnight UTC
- Fetches data from MongoDB and commits updated JSON files
- Manual trigger available via workflow_dispatch
- Requires `MONGODB_URI` and `VITE_MAPBOX_TOKEN` repository secrets

### Key State Management Patterns
- Date range filtering uses start/end indices into sorted date arrays
- Metrics are averaged over selected date ranges using `getAverageMetricsInRange()`
- PDS grid data is transformed based on time range filters
- All data processing uses memoization for performance

### Testing and Linting
- ESLint configuration in `eslint.config.js`
- No specific test framework configured - check with maintainer before adding tests