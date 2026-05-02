# Coasts Data Dictionary and Glossary

## Glossary

- **GAUL1**: Administrative level 1 coastal boundary (province/state).
- **GAUL2**: Administrative level 2 coastal boundary (district).
- **CPUE**: Catch per unit effort in `kg/fisher/day`.
- **RPUE**: Revenue per unit effort in `$/fisher/day`.
- **PDS Fishing Grounds**: Designated movement-derived fishing polygons.
- **H3 Activity Cells**: Hexagonal bins from vessel/fisher movement traces.
- **Quantile Color Scale**: Color classes split by ranked value buckets.

## UI Label to Source Mapping

| UI label | Source dataset | Source field(s) | Transformation |
|---|---|---|---|
| Global map metric legend | `ts_gaul1.json` / `ts_gaul2.json` | `mean_cpue`, `mean_rpue`, `mean_price_kg`, `fishers_*`, `boats_total` | Date-range average per selected GAUL region, then grade binning |
| Local Fishing Activity | `pds-h3-effort-r9.json` | `fishing_hours`, `unique_trips`, `n_active_days`, `avg_hours_per_day` | Quantile thresholds over active H3 rows |
| Fishing Grounds | `pds-fishing-grounds.geojson` | `properties.*` | `unique_trips` filter, then quantile fill by selected metric |
| Bathymetry (Depth m) | `bathymetry_contours_wio.geojson` | `depth_m`, `depth_label` | Styled depth interpolation and contour label filtering |

## Metric Definitions

| Metric ID | Label | Unit | Source field | Formula |
|---|---|---|---|---|
| `mean_cpue` | CPUE | `kg/fisher/day` | `mean_cpue` | Average catch weight per fisher-day |
| `mean_rpue` | RPUE | `$/fisher/day` | `mean_rpue` | Average landed value per fisher-day |
| `mean_price_kg` | Price | `$/kg` | `mean_price_kg` | Average observed sale price per kilogram |
| `fishers_total` | Fishers (Total) | `fishers` | `fishers_total` | `fishers_male + fishers_female` |
| `boats_total` | Boats | `boats` | `boats_total` | Summed `n_boats` in frame-gears aggregates |
