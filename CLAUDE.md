# coasts (coasts portal)

Public Western Indian Ocean fisheries map at coasts.peskas.org: a React + Vite single-page app (Mapbox GL, deck.gl, Tailwind, Radix) with no backend. It reads static JSON from `public/data/`, which GitHub Actions refresh daily from the Mongo and GCS outputs of the R package `peskas.coasts` (package name also `coasts`; a different repo) and commit here.
Ecosystem context (other repos, data flow, cross-repo contracts): see PESKAS.md, loaded via CLAUDE.local.md.

## Commands

- `npm install`, then `npm run dev`. Also `npm run build`, `npm run preview`. There is no test framework.
- `npm run lint` (ESLint, `--max-warnings 0`) must pass.
- `npm run qa:clarity` (`scripts/qa/checkClarityGuardrails.js`) checks that `src/utils/metricMetadata.js` is complete, that the `/docs` anchors exist in `DocsHub.jsx`, and that the legend links to `/docs#layer-interpretation` and `MapClarityPanel` to `/docs#effort-grid`. No build step or workflow runs it, so run it yourself after touching metrics, layers, docs or legend links.
- Refresh data by hand: `node scripts/data/fetchMongoData.js` and `npm run fetch-gcp-data`. Both overwrite committed files in `public/data/` and need the script env vars below.
- Releases: `.github/workflows/release.yml` tags `v<version>` from the top `# coasts X.Y.Z` block of `NEWS.md` on every push to `main`.

## Architecture

- Data path: fetch script in CI, then `public/data/*.json` (committed), then the loaders in `src/services/dataService.js`, then `src/hooks/useMapData.js` / `CountryView.jsx`. The browser downloads those files from the static deploy. Nothing queries Mongo or GCS at runtime.
- `.github/workflows/fetch-mongodb-data.yml` runs `scripts/data/fetchMongoData.js`. It reads Mongo database `portal` (hard-coded `DB_NAME`) through `MONGODB_URI`:
  - `wio_gaul1`, `wio_gaul2`, `metrics_gaul1`, `metrics_gaul2` become `map_gaul1.json`, `map_gaul2.json`, `ts_gaul1.json`, `ts_gaul2.json`.
  - All four are written by `peskas.coasts::export_geos()`. `portal` is that package's production database; its default profile writes `portal-dev`, which this portal never reads.
- `.github/workflows/fetch-gcp-pds-data.yml` runs `scripts/data/fetchGcpPdsData.js`. It takes the newest versioned object per prefix from bucket `GCP_BUCKET_NAME` (a repo secret):
  - `pds-fishing-grounds__*` and `pds-h3-effort-r9__*` come from `peskas.coasts::export_pds_spatial()`, which runs in that repo's pipeline.
  - `frame-gears__*` comes from `export_frame_data()`, run by hand when a new census arrives (every few years), so it is deliberately not in a workflow. Before the next run, fix its input: since Aug 2026 the assets snapshot's frame table has no `country` column.
- Both workflows commit to `main`. Vercel builds every push to `main` for production, so each data commit redeploys the site. See the workflow files for schedules.
- Files in the app that no workflow writes: `public/data/bathymetry_contours_wio.geojson` and `kepler_style.json` (repo root).
- Routes (`src/App.jsx`): `/` map, `/country`, `/docs`. All three stay mounted and are toggled with CSS `display`. `vercel.json` rewrites every path to `/`.
- `src/utils/metricMetadata.js` is the single source for metric units and formulas, layer semantics, tooltip field order, the glossary and the `/docs` data dictionary.
- Env vars:
  - The client reads `VITE_MAPBOX_TOKEN`, `VITE_GA_MEASUREMENT_ID` and `VITE_GA_DEBUG` (see `.env.example`; GA setup is under "Analytics" in README).
  - The fetch scripts read `MONGODB_URI`, `GCP_SA_KEY` (one-line JSON), `GCP_BUCKET_NAME` and the optional `GCP_PDS_*_PREFIX` overrides. These are GitHub secrets and are not in `.env.example`.
- Decision history: `docs/decisions.md`. `docs/` is gitignored and exists only on machines that have a local copy.

## Rules

- Load app data through a loader in `dataService.js`. For a new file, add a loader there rather than fetching `/data/...` from a component.
- Build region keys with the dataService helpers (`getRegionKey`, `getTimeSeriesKey`, `getTimeSeriesKeyGaul1`), never by concatenating strings.
- Define a new metric or layer in `metricMetadata.js`, then run `npm run qa:clarity`.
- Leave workflow-written files in `public/data/` alone. Change the fetch script or the upstream producer in `peskas.coasts` instead.
- Keep `MONGODB_URI` and `GCP_*` out of `src/`. Anything prefixed `VITE_` is compiled into the public bundle.
- Bump `version` in `package.json` together with the new `NEWS.md` block.

## Gotchas

- `fetchMongoData.js` writes nothing if any output would keep less than half the records already on disk (`MIN_RETENTION_RATIO`). The job then fails and nothing is committed. The usual cause is a collection read while `peskas.coasts` was rewriting it, so re-run the workflow. A real shrink, such as a country being dropped, needs that guard handled on purpose. Each workflow has a concurrency group, so two runs of the same fetch never overlap.
- The GCS fetch has no such guard. It only checks that the JSON parses, so an empty or wrong upstream file gets committed and deployed.
- Region joins:
  - The GAUL2 key is `country_gaul1_name_gaul2_name`, the GAUL1 key `country_gaul1_name`, with `country` lowercase. GAUL2 selection prefers `ADM2_PCODE` when a feature has one.
  - `zanzibar` is keyed as `tanzania`. The fetch script maps Mongo's `gaul_2_name` and `iso3_code` to `gaul2_name` and `country`.
  - `ISO3_TO_COUNTRY` and `COUNTRY_KEY_ALIASES` are copied in both `scripts/data/fetchMongoData.js` and `src/services/dataService.js`. Change both, or regions lose their metrics without any error.
- RPUE and price per kg arrive already in USD, converted with hard-coded rates in `peskas.coasts::export_geos()`. Do not convert them again here.
- Fishers and boats (from `frame-gears.json`) are static census counts and are meant to ignore the date filter.
- H3 effort cells and fishing grounds are filtered in the client to `unique_trips >= PDS_MIN_UNIQUE_TRIPS` (`src/utils/pdsOverlayConfig.js`). Upstream, `export_pds_spatial(min_trips_grounds = 3)` already filters the grounds.
- If `peskas.coasts` renames a collection, column or GCS prefix, this portal breaks or keeps serving stale data after the next scheduled fetch. Update the fetch scripts in the same piece of work.
- The `installCommand` in `vercel.json` installs the Linux builds of `lightningcss` and `@tailwindcss/oxide` at pinned versions. Update those pins when you upgrade Tailwind.
