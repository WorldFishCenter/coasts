# coasts 0.3.0

## New Features

- **Frame-gears ingestion pipeline**: Added Google Cloud latest-file retrieval for `frame-gears__*` and automatic write/commit to `public/data/frame-gears.json` via `scripts/data/fetchGcpPdsData.js` and `.github/workflows/fetch-gcp-pds-data.yml`.
- **Static census metrics on map**: Integrated frame-gears aggregates into GAUL1/GAUL2 boundaries with new analysis metrics for fishers and boats.
- **Fishers split controls**: Added switchable Fishers sub-metrics (`Total`, `Male`, `Female`) with synchronized map coloring, legend, and tooltip output.

## Improvements

- **Analysis metric UX redesign**: Refactored sidebar layout to clearly separate time-series fisheries metrics from static census metrics and reduce vertical space.
- **Section clarity refresh**: Improved visual grouping and borders for sidebar sections while keeping a minimal style.
- **Tooltip enrichment**: Added fishers/boats detail display in region tooltips when those metrics are selected.

## Stability and Quality

- **Canonical GAUL keying for frame data**: Switched to service key helpers for frame-gears lookups to avoid country alias mismatches.
- **Static metric behavior hardening**: Disabled time-series histogram panel for non-time-based fishers/boats metrics.
- **Security hardening**: Escaped user/data-driven strings in tooltip HTML rendering.
- **Lint command compatibility**: Updated lint script/config for flat-config compatible CLI usage.

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
