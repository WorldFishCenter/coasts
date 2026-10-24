---
name: Peskas Coasts
description: Small-scale fisheries figures for the coast from Kenya to Maputo and Timor-Leste, drawn as species identification sheets.
colors:
  ink-navy: "#0b2233"
  plate-white: "#ffffff"
  survey-teal: "#006d77"
  teal-wash: "#eef6f6"
  mist: "#f3f7f7"
  slate-note: "#4b6170"
  hairline: "#d5dfe1"
  input-stroke: "#b6c6ca"
  callout-coral: "#d96c50"
  coral-ink: "#a8452c"
  chart-sea: "#e9f3f4"
  alarm-red: "#b42318"
  selection-teal: "#a9d1d4"
  night-page: "#121819"
  night-plate: "#192122"
  night-wash: "#202a2c"
  night-ink: "#f1f4f4"
  night-teal: "#8ccbd0"
  night-note: "#a4b1b3"
  night-hairline: "#2e3a3c"
  night-input: "#47565a"
  night-rule: "#d9e1e2"
  night-coral: "#e69f8d"
  night-sea: "#0d1416"
typography:
  display:
    fontFamily: "Source Serif 4, ui-serif, Georgia, serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Source Serif 4, ui-serif, Georgia, serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Source Serif 4, ui-serif, Georgia, serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Source Serif 4, ui-serif, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  figure:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "\"tnum\""
  body:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\""
  label:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
    fontFeature: "\"tnum\""
  note:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "\"tnum\""
  micro:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.33
    fontFeature: "\"tnum\""
rounded:
  none: "0px"
  control: "4px"
  pill: "9999px"
spacing:
  hair: "6px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  header: "56px"
  column: "420px"
components:
  plate:
    backgroundColor: "{colors.plate-white}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.none}"
    padding: "10px 14px 12px"
  pill:
    backgroundColor: "transparent"
    textColor: "{colors.slate-note}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  pill-pressed:
    backgroundColor: "{colors.survey-teal}"
    textColor: "{colors.plate-white}"
    rounded: "{rounded.pill}"
  map-button:
    backgroundColor: "{colors.plate-white}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.none}"
    size: "36px"
  map-button-hover:
    backgroundColor: "{colors.teal-wash}"
  map-button-pressed:
    backgroundColor: "{colors.survey-teal}"
    textColor: "{colors.plate-white}"
  period-switch:
    textColor: "{colors.slate-note}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "4px 12px"
  period-switch-pressed:
    backgroundColor: "{colors.teal-wash}"
    textColor: "{colors.ink-navy}"
  rank-bar:
    backgroundColor: "{colors.survey-teal}"
    height: "10px"
  tab-active:
    textColor: "{colors.ink-navy}"
    typography: "{typography.body}"
  sheet-bar:
    backgroundColor: "{colors.survey-teal}"
    textColor: "{colors.plate-white}"
    typography: "{typography.label}"
    padding: "6px 12px"
  go-mark:
    backgroundColor: "transparent"
    textColor: "{colors.survey-teal}"
    rounded: "{rounded.pill}"
    size: "28px"
  go-mark-hover:
    backgroundColor: "{colors.survey-teal}"
    textColor: "{colors.plate-white}"
  go-chip:
    backgroundColor: "{colors.survey-teal}"
    textColor: "{colors.plate-white}"
    rounded: "{rounded.control}"
    padding: "4px 10px"
---

# Design System: Peskas Coasts

## Overview

**Creative North Star: "The Species Sheet"**

Every district reads like an FAO species identification sheet: a drawn outline, its measured figures pinned to it with leader lines, and the source of every measurement written underneath. The light plate is white paper ruled in navy ink. Districts are shaded in a teal ramp, GPS effort is drawn in navy ink, and coral is reserved for what is measured and where a click will take you: callouts, the selected district (its ring on the map, its line against the country average), fishing grounds, the country preview. Names and captions are set in a serif, places in italic, and every number in a sans with tabular figures.

Density is that of a reference plate, not a dashboard. Information sits in ruled rows and tables separated by hairlines, never in floating cards. Panels laid on the map are solid flat sheets with an ink rule across the top. Nothing glows, blurs or casts a shadow. The portal opens in the dark theme, the same sheet printed on charcoal with a faint sea-teal tint: near-white ink, light teal figures, softened coral. The light theme, one click away in the header, is the white plate ruled in navy; navy stays the brand colour.

This world refuses the dark mission-control map (neon, glass, glow, console words) and the grey card dashboard.

**Key Characteristics:**
- White plate paper, navy ink text and 2px top rules; hairline dividers between rows.
- Teal for survey figures, active choices and the parts that invite a click; navy for GPS effort; coral only for measurements and click destinations.
- Serif for names, headings and figure captions, italic for places; sans with tabular figures for controls and numbers.
- Square plates, 4px corners on form controls, fully round pills for segmented choices.
- Flat throughout: no drop shadows, no blur, no glow.
- Charts carry an italic serif title saying what they show, and every number links to its method.

## Colors

A cold, printed palette: navy ink on white, one teal family for the survey data, and a single warm coral that only ever marks a measurement or the place a click will take you. The dark theme swaps the paper for tinted charcoal.

### Primary
- **Survey Teal** (`survey-teal`): active pills, pressed map controls, the active tab underline, the district sheet's back bar, the invitations to click (country silhouettes and round go marks on coverage rows, the "Choose a country" line, the locator's "Show on the map" chip), figure numbers in callouts and tooltips, links ("Definition", "How these are measured"). It is the darkest step of the district ramp, so a teal number and a dark-teal district mean the same thing. Dark theme: **Night Teal** (`night-teal`).

### Secondary
- **Callout Coral** (`callout-coral`): measurements and click destinations only. The leader lines and anchor dots of the district outline callouts, the coral locator ring around the selected district on the map, the chosen district's monthly line against the teal country average on Country insights, the fishing-ground ramp, the country preview drawn on the map while a coverage row is hovered or focused (2.5px coral outline over a coral fill at 70 alpha), and the pointer icon on the first-visit hint that sends the visitor to the map. **Coral Ink** (`coral-ink`) is the deepest grounds step. Dark theme: **Night Coral** (`night-coral`).

### Neutral
- **Ink Navy** (`ink-navy`): all text, the 2px rule on top of plates and the header, the outline stroke of drawn districts, the hover edge on the map, the coastline hairline, and the top of the GPS effort ramp. In the dark theme ink is **Night Ink** (`night-ink`). Navy is the brand colour and does not appear in the dark theme's surfaces.
- **Plate White** (`plate-white`): page, sidebar, plates, land on the basemap. Dark theme: page **Night Page** (`night-page`), a charcoal with a faint sea-teal tint, and plates **Night Plate** (`night-plate`).
- **Teal Wash** (`teal-wash`): hover fill on map controls, coverage rows and the locator plate, the track behind inline bars, the pressed period switch, the fill inside the district outline drawing, the lightest district class. Dark: **Night Wash** (`night-wash`).
- **Mist** (`mist`): muted surfaces; landuse and parks on the basemap.
- **Slate Note** (`slate-note`): secondary text, notes, source lines, unpressed pill text, the hatch stroke for districts without data. Dark: **Night Note** (`night-note`).
- **Hairline** (`hairline`): 1px row dividers and plate sides. Dark: **Night Hairline** (`night-hairline`).
- **Input Stroke** (`input-stroke`): pill and period-switch borders, the theme toggle border, scrollbars. Dark: **Night Input** (`night-input`).
- **Chart Sea** (`chart-sea`): the sea on the basemap. Dark: **Night Sea** (`night-sea`). Dark rules use **Night Rule** (`night-rule`).
- **Alarm Red** (`alarm-red`): destructive and error states only.
- **Selection Teal** (`selection-teal`): text selection (dark: `#3f8a93` with white text).

### Map ramps (src/utils/mapPalette.js)
- **Districts:** eight teal classes, `#eef6f6` to `#006d77` (dark: teal-greys `#223638` to `#c1e2e4`, lightest is highest).
- **GPS effort:** four navy steps, `#a3b3bf` to `#0b2233` (dark: greys `#5e6e71` to `#ffffff`).
- **Fishing grounds:** four coral steps, `#f4d6cc` to `#a8452c` (dark: `#6e3a2d` to `#f7d3c9`).
- **Depth contours:** six pale teal lines, darkest near the coast and fading with depth, like a chart's soundings (dark: teal-greys `#3f7378` to `#233c40`).
- **Satellite counts as a dark ground:** over satellite imagery the GPS effort and fishing-ground ramps, the hover and selection outlines (white ink) and the coral (light coral `night-coral`) switch to their dark versions, in the map and in the legend. Districts keep the current theme's ramp.
- **No data:** a diagonal hatch over a pale slate fill (dark: `rgb(164,177,179)`), never a ramp colour.
- **Basemap:** `paintBasemap()` in Map.jsx repaints the Mapbox vector style: land white (dark `#182022`), sea `#e9f3f4` (dark `#0d1416`), landuse and parks mist (dark `#1b2426`), plus a 0.7px coastline hairline in navy at 55% (dark: teal at 50%). This is recorded from code only; it has not been seen on a rendered map, because local captures cannot load the Mapbox tiles.

### Named Rules
**The Coral Measures Rule.** Coral marks what is measured and where a click will take you, nothing else: outline callouts, the selected district (ring on the map, line on Country insights), fishing grounds, the country preview on the map, the first-visit hint's pointer to the map. Never use it to fill buttons or for alerts or decoration.

**The Hatched Absence Rule.** A district without survey data is hatched. It is never drawn as a low value or folded into the lightest class.

**The Labelled Class Rule.** Quantile breaks are computed only from districts with data, the top class holds the top eighth, and the legend labels the start of every class, with "+" on the last.

## Typography

**Display Font:** Source Serif 4 (with ui-serif, Georgia)
**Body Font:** Source Sans 3 (with ui-sans-serif, system-ui)

**Character:** A reference-book pairing. The serif names things (districts, countries, sections, figures), with italic for places and captions; the sans counts things, always with tabular figures so columns of numbers line up.

### Hierarchy
- **Display** (600, 36px, 1.1): page titles on Methods and the country name on Country insights.
- **Headline** (600, 28px, 1.25): the district name on its sheet and the coverage title ("64 districts in 4 countries"); 24px for section heads on Methods and Country insights and the About dialog.
- **Title** (600, 15 to 18px): tooltip names and the mobile sidebar title at 18px; plate titles (legend, Timor-Leste locator) at 15 to 16px. Serif, because all headings are.
- **Caption** (400 italic serif, 15 to 16px): chart titles ("Monthly … in {district}, against all other districts" on the district sheet; "Monthly …, {country}" and "Monthly …, {district} against the {country} average" on Country insights), provinces beside district names in the ranked table, the province and country under a district name, the "Coasts" word beside the logo.
- **Figure** (700 sans, 22px; unit at 13 to 14px 600): callout numbers on the district outline and the figure in map tooltips, in teal. The Country insights figure strip sets its figures larger, 28px bold teal with the unit inline.
- **Body** (400, 15px): sheet rows, tables, descriptions; dialogs cap prose at 65ch.
- **Label** (600, 14 to 15px): pills, tabs, row labels ("Shade by", "Years"), plate buttons. Sentence case.
- **Note** (400, 13px): source lines, census notes, legend sublines, all in slate.
- **Micro** (400, 12px): legend class labels (with tight tracking), ramp end values, the legend footer, the sidebar footer and short source notes. The smallest step; nothing is set below it.

### Named Rules
**The Names and Numbers Rule.** Serif for names and captions, italic for places; sans with tabular figures for every control and number. Headings get `-0.005em` tracking and balanced wrapping.

**The Sentence Case Rule.** Labels and controls are sentence case at normal tracking. There are no uppercase, letter-spaced labels above headings.

## Layout

A fixed app frame. A 56px header ruled 2px in ink holds the logo with the italic serif "Coasts", the tabs Map / Country insights / Methods, then About and the theme toggle on the right. Dark is the default; the visitor's choice is saved (localStorage `coasts-theme`). The browser theme colour follows the page (white, dark `#121819`). Below it, a 420px left column (white, 1px hairline on its right, 24px side padding, scrolls on its own) sits beside a full-bleed map.

On the map, plates and controls keep a 24px inset (16px below 640px): a single column of square controls top left (zoom, 3D, satellite, depth contours, map notes), the first-visit hint plate just right of them at the same 24px top, the locator plate (whichever region is off screen) top right, the legend plate bottom right. Below 768px the left column becomes a full-screen sheet opened from a map control, the legend starts minimised, the locator is hidden, and the hint plate moves to the bottom left. The map opens in 3D (columns, 50° pitch, already tilted in the first fit); every move to a country or back to the region keeps the pitch the visitor chose, and the flat view lays it back to 0°. Country insights is a single centred column (max 1400px, 16 / 24 / 40px side padding): the country name, then a Districts / Provinces switch to the left of the figure pills, country tabs on a 2px ink rule, then the figure strip top-aligned beside a compact 150px trend chart (side by side from 1280px), the ranked district table as the main element, and the country gears in two columns below. The table drops latest month, fishers and boats below 768px, and sparkline and months below 1024px.

**The Recent Window Rule.** The figure strip and the ranking always use the recent window, the last three calendar years with data. The "Since {year} / Full record, from {year}" switch widens only the trend charts.

Rhythm: 6px between pills, 12 to 16px inside plates, 24px between sheet sections; rows separate with hairlines rather than gaps.

## Elevation & Depth

Flat. Depth comes from sheets laid on the map (opaque, ink-ruled on top) and hairline borders, never from shadows, blur or translucency.

### Named Rules
**The Flat Plate Rule.** Plates, dialogs and tooltips carry no drop shadow. A plate is lifted by its 2px ink top rule and solid fill, nothing else.

**The Rules Not Cards Rule.** Group content with rules and hairlines: a 2px ink rule opens a section, 1px hairlines separate rows. Do not wrap content in bordered, rounded, shadowed cards.

## Shapes

Square by default. Plates, dialogs, the sidebar, the district sheet's back bar and the map control stack have 0px corners; stacked zoom buttons share a border. Controls (the theme toggle, the period switch, small icon buttons) take gentle 4px corners. Inline bars, gear bars and their wash tracks are square. Fully round shapes are reserved for choosing and going: segmented pills and the 28px go marks on coverage rows. The locator's "Show on the map" chip has 4px corners. Drawn outlines use 1.25px ink strokes with round joins; leader lines are 1.25px coral ending in a 3px coral dot on the drawing.

## Components

### Pills (segmented choice)
- **Style:** fully round, 1px input-stroke border, transparent fill, slate label text (14px 600), 4px by 12px padding, 6px apart in a wrapping row.
- **Hover:** text to ink, border to ink at 50%.
- **Pressed (`aria-pressed="true"`):** teal fill and border, white text. Used for metric, fishers variant, year, area level and visualisation mode.

### Map controls
- **Style:** 36px square, white fill, hairline border, ink icon (18px Lucide, 1.75 stroke), stacked in one column top left.
- **Hover:** teal wash. **Pressed:** teal fill, white icon (depth contours on, for example).
- **3D:** a text control ("3D", 13px bold) in the same stack, pressed while the columns view is on, kept in sync with the sidebar's 3D columns / Flat pills.

### Plates
- **Style:** solid card fill, 1px hairline sides, 2px ink top rule, square corners, no shadow. Legend (300px), Timor-Leste locator (252px), map clarity panel (340px), map tooltips and the About dialog are all plates.
- **Content:** serif title, slate source line, then ruled sub-sections; a teal "How to read the map" style link closes the plate.
- **Locator plate:** the whole plate is one button: serif title, slate detail, the other region drawn in teal, then a filled teal "Show on the map" chip (4px corners, 13px 600, arrow that nudges right on hover). On hover the plate takes a teal border and the teal wash.
- **First-visit hint plate:** a coral pointer icon, "Click a district to open its sheet" ("Tap" on mobile) in 15px 600, a 13px slate line on what the sheet holds, and a dismiss control. It closes for good after the first district click or a dismissal.

### Period switch
- **Style:** two joined segments in one 4px-cornered input-stroke frame, 14px 600, slate at rest; the pressed segment takes the teal wash and ink text. Quieter than pills because it changes the span or the unit of areas, not the figure.
- **Uses:** the chart period ("Since {year} / Full record, from {year}"), and the areas level on Country insights ("Districts / Provinces", labelled "Areas", Districts by default).
- **Focus (all controls):** 2px ring-coloured outline, 2px offset.

### Navigation
- **Tabs:** 15px 600 sans, slate at rest, ink on hover; the active tab is ink with a 3px teal underline that sits on the header's 2px rule.
- **Country tabs (Country insights):** a `tablist` on the page's 2px ink rule; each tab shows a 40 by 26px teal coastline silhouette beside the country name, with the same 3px teal underline on the active tab.

### District Sheet (signature)
A teal back bar ("All countries", close), the district name in 28px serif, its province and country in italic serif, then the outline drawing: the district's shape filled teal wash with an ink stroke, three coral leader lines pinned inside the shape to catch, price and revenue figures in teal. Below it, ruled two-column rows give the source of each figure (landing surveys with month count and range, frame survey census of fishers, boats and gears), each source line linking to its method, then a small chart comparing this district's monthly figures against all other districts, titled in italic serif.

### Coverage Sheet
Opened by a 2px ink rule: a 28px serif headline with the district and country counts, a one-line lead, then a teal line with a pointer icon, "Choose a country to take the map there". Below an ink-ruled column head (Country, Districts, Since, Fishers), each country is one full-width button row separated by hairlines: a teal country silhouette (44 by 32px), the name in 600, right-aligned figures, and a round teal go mark (an outlined 28px circle with an arrow that fills teal on hover or focus). Rows take the teal wash on hover or focus and preview the country on the map in coral; the preview clears on click and the map flies there.

### Figure strip (Country insights)
At most three figures: the average for the chosen figure (28px bold teal, unit inline), then fishers and boats from the census, both dropped when the country has no census. Labels are 13px slate above each number. A 12px footnote names the method ("mean of the district averages"), the period and links to the methods page.

### Ranked district table (signature of Country insights)
The page's main element, under "Districts ranked by {figure}" ("Provinces ranked by {figure}" at province level) and the line "Average for {period}, {unit}". Columns: rank, district (600) with its province in italic serif (hidden when it equals the district name), an inline bar, value, latest month, a 12-month sparkline, months, fishers, boats, and an open chevron. Rows separate with hairlines under an ink-ruled head.
- **Areas level:** the Districts / Provinces switch changes every label with it ("{n} provinces with landing surveys", the "Province" column, "Provinces need 6 months…", "Click a province…", "mean of the province averages"). At province level the province is the row name and the italic province line is hidden; Timor-Leste's municipalities sit under the same "Provinces" label, as on the map. Switching level closes any open row.
- **Sorting:** headers are buttons with `aria-sort`; their arrows sit at 40% at rest and full strength on hover, focus or when active.
- **Inline bars:** 10px teal fill on a teal-wash track. A 2px ink line marks the country average, the same number the strip shows. Bars scale to the ranked rows; an unranked value beyond that scale ends in a skewed break mark.
- **Ranking threshold:** six months in the period. Fewer are listed after a divider, "Fewer than 6 months of data in this period, so not ranked", with muted slate bars and "–" as rank. Districts with no surveys come last, reading "No surveys in this period".
- **Sparklines:** 110 by 24px teal lines on each row's own range; gaps stay gaps, an isolated month is a 6px tick, and a row with fewer than 6 of 12 months reads "n of 12 months" instead.
- **Re-rank motion:** when the figure or the sort changes, rows glide to their new places (FLIP, 480ms, `cubic-bezier(0.16, 1, 0.3, 1)`), skipped under `prefers-reduced-motion`.
- **Opened row:** reads as a plate (card fill, 2px ink top rule). It holds the district's monthly line in coral against the dashed teal country average (with a dashed legend swatch), the census counts and gear bars. "Click" a district, or "Tap" on narrow screens.

### Charts
Straight lines between months (linear), no smoothing; missing months stay gaps. Hairline horizontal grid, ink axis line, 12px slate ticks. The country line is teal (2.5px, or 1.5px dashed when it is the reference), the district line coral (2.5px).

### Country gears
Below the table, opened by a 2px ink rule: two columns of gear rows, each with fishers, share and boats in slate and a 6px teal bar on a wash track. With no census, or a census without gears, it is one plain sentence instead.

### Brand asset
`src/components/PeskasLogo.jsx` and `src/components/peskas-logo.css` are generated by the Peskas brand kit (`peskas-context/brand`, `build.py` then `sync.py`). Do not edit them in this repo; change the kit and sync.

## Do's and Don'ts

### Do:
- **Do** open every plate with a 2px ink top rule over a solid fill and hairline sides.
- **Do** hatch districts without survey data and label them "No data" in the legend.
- **Do** compute quantile breaks from districts with data only, keep the top eighth in the top class, and label every class start.
- **Do** keep coral for measurements and click destinations: callouts, the selected district's ring and line, fishing grounds, the country preview.
- **Do** draw time series as straight lines between months and leave missing months as gaps.
- **Do** set every number in Source Sans 3 with tabular figures, and link each figure to its method.
- **Do** keep 4px corners on form controls, square plates, and round shapes only for pills and go marks.
- **Do** make whatever invites a click say where it goes, in teal, and preview the destination in coral.

### Don't:
- **Don't** put drop shadows, blur or glow on plates, dialogs or tooltips.
- **Don't** group content in cards; use rules and hairlines.
- **Don't** fill buttons with coral or use it for alerts or decoration.
- **Don't** draw a missing value as a low value.
- **Don't** add uppercase letter-spaced labels or kickers above headings.
- **Don't** edit the Peskas logo files here; they come from the brand kit.
