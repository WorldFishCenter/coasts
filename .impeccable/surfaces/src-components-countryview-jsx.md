---
version: 1
slug: "src-components-countryview-jsx"
primary_target: "src/components/CountryView.jsx"
related_targets: ["src/components/CountryTimeSeriesChart.jsx"]
---

# Country insights

Scope: `/country` (CountryView.jsx, CountryTimeSeriesChart.jsx). Mode: Operate. Inherits the Species Sheet world in DESIGN.md (dark default); no new palette, type or material.

Job (confirmed 2026-10-24): country first, then districts; recent years by default with the full record one click away; a single district's details open on this page, on demand.

Problems it replaces: a country average that spans 1995–2026 while most districts start in 2024; a page centred on an arbitrary first district; comparison given as one percentile sentence; gears only per district; smoothed curves inventing values.

## Chosen structure

Ranked district table, dealt card 2 of 3 in the surface roll (my list position 4); seed:2533b1192929d970.

- Country tabs with coastline silhouettes replace the country select; Catch / Revenue / Price pills sit with the title.
- A figure strip for the country (average, districts with data, fishers, boats, surveys since) beside a compact trend chart with a "Since <year> / Full record" switch; recent years by default.
- The main element: every district in one ranked table: rank, name and province, an inline bar against the country median, value, latest month, a 12-month sparkline, months with data, fishers, boats. Sortable headers.
- Memorable moment: rows re-rank in place, animated, when the figure or the sort changes (borrowed discipline: a departure board that reranks rather than reloads).
- A row opens in place: the district's monthly line against the country, its gears and census counts.
- Country gears below the table. Lines are drawn straight between months; nothing is smoothed.

## Unresolved

- None at build start.
