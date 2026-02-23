# coasts 0.1.0

## New Features

- **GAUL admin level switch**: Users can switch between Admin 1 (provinces) and Admin 2 (districts). The app loads `map_gaul1.json`, `map_gaul2.json`, `ts_gaul1.json`, and `ts_gaul2.json`; default is Admin 2. Selection and comparison panels are level-aware.
- **Data service GAUL1/GAUL2 API**: New loaders (`loadMapDataGaul1`, `loadMapDataGaul2`, `loadTimeSeriesGaul1`, `loadTimeSeriesGaul2`), validators, and helpers (`getTimeSeriesKeyGaul1`, `getTimeSeriesForGaul1`, `getLatestMetricsGaul1`, `getAverageMetricsInRangeGaul1`, `getRegionKey(props, gaulLevel)`).

## Improvements

- **Selectable metrics**: CPUA and RPUA are hidden from the metric selector; only CPUE, RPUE, and Price are offered. `SELECTABLE_METRIC_IDS` in `formatters.js` controls the list.
- **Documentation**: `data-models.md` and CLAUDE.md/AGENTS.md updated for GAUL-suffixed data and admin level behavior.

## Bug Fixes

- (None in this release.)
