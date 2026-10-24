---
version: 1
slug: "src-components-map-jsx"
primary_target: "src/components/Map.jsx"
related_targets: ["src/components/CountryView.jsx","src/components/DocsHub.jsx"]
---

# Map, Country insights and Methods

Scope: the whole portal (map `/`, Country insights `/country`, Methods `/docs`, About dialog). Mode: Operate (map, Country insights); Methods is Read inside the same world.

Audience and job: see PRODUCT.md. First job of a visit: see Peskas' reach across four countries, then compare districts and follow figures to their method. Often projected in meetings.

Pinned by the user (2026-10-23): Peskas brand colours, sidebar + map layout, 3D effort columns, dark/light switch. Avoid: sci-fi control room, generic corporate dashboard, old government GIS viewer, too plain to show in a meeting.

## Direction contract

THESIS: Each district reads like a species identification sheet: its drawn outline, its measured figures, and the source of every measurement. Refuses the dark mission-control map (neon, glass, glow, console words) and the grey card dashboard.

OWN-WORLD: White plate paper, navy ink #0b2233 text and 2px rules, hairline coastlines. Districts in a teal ramp ending at #006d77; GPS effort in navy ink; fishing grounds and measurement callouts in coral #d96c50. Source Serif 4 for names and captions, italic for places; Source Sans 3 with tabular figures for controls and numbers. Rules, not cards; 4px corners; no glow. Dark theme: charcoal with a faint sea-teal tint (#121819, plates #192122), off-white ink, light teal; changed from navy at the user's request on 2026-10-24.

STORY: The visitor sees the coast from Kenya to Maputo plus Timor-Leste, learns how many districts Peskas measures and since when, shades the map by one figure, opens a district's sheet, and follows any figure to its method.

FIRST VIEWPORT: 56px white bar ruled navy: logo, tabs Map / Country insights / Methods, About and theme right. Left 420px column: metric, year and area pills, then the coverage sheet (districts and first year per country) or a clicked district's sheet: serif name, italic province, line outline with coral dimension callouts to catch, price and revenue, sources, census counts, comparison figure. Right: light map fitted Kenya to Maputo, legend plate bottom right, Timor-Leste locator top right, controls top left.

FORM: Species Sheet (FAO species identification sheets), position 1 of my ordered list, shown as IMPECCABLE'S PICK and chosen by the user; seed:b862394f8306b46a

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- About dialog copy: keep its content, drop emoji and marketing headings; correct "updated every 2 days" to daily (flagged to the user).
- Timor-Leste locator flies the one map there; no second map instance (Mapbox bills per map load).
