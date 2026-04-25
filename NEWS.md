# coasts 0.2.0

## New Features

- **GCP PDS data pipeline**: Added versioned Google Cloud Storage fetch flow for fishing grounds and H3 effort datasets (`scripts/data/fetchGcpPdsData.js`) with automated daily sync workflow (`.github/workflows/fetch-gcp-pds-data.yml`).
- **New PDS overlays**: Integrated `pds-fishing-grounds.geojson` and `pds-h3-effort-r9.json` into map data loading and rendering, including H3 effort extrusion mode and grounds choropleth.
- **Kepler-config adapter**: Added centralized overlay configuration mapping from `kepler_style.json` via `src/utils/pdsOverlayConfig.js` for color ramps, opacity, metrics, elevation scale, coverage, filters, and initial camera state.

## Improvements

- **Mapbox/deck integration hardening**: Switched to `MapboxOverlay` interleaved rendering for better 3D alignment and stable map interactions.
- **Interaction stability**: Disabled auto bearing snap (`bearingSnap=0`) and touch rotation to avoid unintended post-zoom map rotation while preserving command/drag rotate behavior.
- **Country chart completeness**: Fixed district time-series rendering so “All Districts” includes series that start later in time (keys now computed across all timestamps).
- **Workflow reliability**: Improved GCP fetch workflow concurrency behavior and no-op commit handling; strengthened latest-version file selection logic in GCP fetch script.
- **Data validation consistency**: Tightened H3 effort payload validation to require array format (matching downstream use).

## Bug Fixes

- **Header continuity regression**: Removed duplicate top offset in map container that introduced a blank strip below the navbar after merge.
- **Code cleanup**: Removed dead debug/runtime contract logging and deleted unused `AppLayout` component.

## Previous Release: 0.1.0

- GAUL admin level switch and GAUL1/GAUL2 data service support.
- Selectable metric refinement and related documentation updates.
