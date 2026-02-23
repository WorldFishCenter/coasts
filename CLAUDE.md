# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Cursor users:** Use `.cursor/` and root `AGENTS.md` for the same setup (rules, agents, commands, skills, memory). Same depth and accuracy as this Claude Code setup.

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
The application loads GAUL-level data and lets users switch between Admin 1 (provinces) and Admin 2 (districts). Primary data sources:
1. **Map data**: `map_gaul1.json` (Admin 1), `map_gaul2.json` (Admin 2) — GeoJSON features for coastal regions
2. **Time series**: `ts_gaul1.json` (Admin 1), `ts_gaul2.json` (Admin 2) — Historical fisheries metrics by region
3. **PDS Grids** (`public/data/pds_grids.json`) — GPS movement data in 1km grid cells

The fetch script also writes `wio_map.json` and `time_series.json` (legacy). See `.cursor/memory/data-models.md` for formats and dataService GAUL1/GAUL2 API.

### GAUL Schema
The app uses FAO GAUL (Global Administrative Unit Layers) for region identity:
- **country** - Country name (lowercase, e.g. `kenya`, `tanzania`)
- **gaul1_name** - Admin level 1 (state/province, e.g. `Tana River`, `Kilifi`)
- **gaul2_name** - Admin level 2 (district, e.g. `Garsen`, `Kilifi North`)

**Lookup key format**: `country_gaul1_name_gaul2_name` (e.g. `kenya_Tana River_Garsen`)

MongoDB may use `gaul_2_name` (underscore before 2); fetch scripts normalize to `gaul2_name`. Map features may have `iso3_code` (e.g. KEN) instead of `country`; scripts map ISO3 to country.

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
- Region lookups use `getTimeSeriesForGaul(timeSeriesData, country, gaul1_name, gaul2_name)`
- PDS grid data is transformed based on time range filters
- All data processing uses memoization for performance

### Testing and Linting
- ESLint configuration in `eslint.config.js`
- No specific test framework configured - check with maintainer before adding tests

## Claude Code setup

This project includes a Claude Code configuration in `.claude/` for consistent AI-assisted development.

- **Quick start**: Read [.claude/QUICK_START.md](.claude/QUICK_START.md) for commands, paths, and workflow.
- **Implementation guide**: See [.claude/FEATURE_IMPLEMENTATION_GUIDE.md](.claude/FEATURE_IMPLEMENTATION_GUIDE.md) for pre-edit checklist and where to put code.
- **Commands**: `/plan` (implementation plan), `/code-review` (quality review), `/build-fix` (ESLint/build), `/document` (update architecture and context).
- **Token optimization**: Check `.claude/memory/session-context.json` and `.claude/skills/` for patterns instead of re-reading the codebase.