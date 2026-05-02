# coasts 0.4.0

## New Features

- **Whole-app clarity system**: Added shared metadata in `src/utils/metricMetadata.js` to define glossary terms, metric definitions, layer semantics, tooltip field standards, and data dictionary mappings from UI labels to source fields/transforms.
- **In-app docs hub**: Added `/docs` route with anchored sections (Data Sources, Metric Definitions, Layer Interpretation, Methodology, Limitations, Glossary) and direct links from map UI.
- **Map inline understanding panel**: Added `MapClarityPanel` with “What am I seeing?” context, layer encoding summaries, and deep links to docs.

## Improvements

- **Map help control redesign**: Replaced the persistent “What am I seeing?” panel with a compact help icon and dismissible popover to prevent map occlusion.
- **Metric naming consistency hardening**: Normalized metadata display aliases so map/sidebar/country/docs consistently render human-readable metric labels and descriptions.
- **Docs readability polish**: Updated docs hub data-source formatting and included metric cadence in definitions.
- **Legend clarity upgrade**: Enhanced legend now explains quantile semantics for map and activity layers, exposes docs guide links, and shows a `Data as of` freshness label.
- **Tooltip standardization**: H3 and grounds tooltips now consistently display selected activity metric first with unified formatting and clearer ordering.
- **Naming consistency refactor**: Migrated metric formatter source-of-truth to shared metadata and aligned label/unit/formula usage across map, legend, and docs.

## Trust and Validation

- **QA guardrails command**: Added `npm run qa:clarity` (`scripts/qa/checkClarityGuardrails.js`) to verify metric unit metadata, tooltip-field coverage, required docs anchors, and docs-link integrity from map UI.
- **Developer dictionary artifact**: Added `docs/data-dictionary.md` for human-readable glossary + source mapping reference.

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
