import { ACTIVITY_METRICS } from './gridLayerConfig.js';

const nullableNumber = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return Number(value).toFixed(digits);
};

const integerWithUnit = (value, unitLabel) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return `${Math.round(Number(value)).toLocaleString()} ${unitLabel}`;
};

export const METRIC_METADATA = Object.freeze({
  mean_cpue: {
    id: 'mean_cpue',
    shortLabel: 'CPUE',
    displayLabel: 'Catch per unit effort',
    unit: 'kg/fisher/day',
    sourceField: 'mean_cpue',
    formula: 'Average catch weight per fisher-day over selected period',
    cadence: 'Monthly (time series)',
    format: (value) => `${nullableNumber(value, 2)} kg/fisher/day`
  },
  mean_cpua: {
    id: 'mean_cpua',
    shortLabel: 'CPUA',
    displayLabel: 'Catch per unit area',
    unit: 'kg/fisher/area',
    sourceField: 'mean_cpua',
    formula: 'Average catch weight normalized by fishing area',
    cadence: 'Monthly (time series)',
    format: (value) => `${nullableNumber(value, 2)} kg/fisher/area`
  },
  mean_rpue: {
    id: 'mean_rpue',
    shortLabel: 'RPUE',
    displayLabel: 'Revenue per unit effort',
    unit: '$/fisher/day',
    sourceField: 'mean_rpue',
    formula: 'Average landed value per fisher-day',
    cadence: 'Monthly (time series)',
    format: (value) => value === null || value === undefined || Number.isNaN(Number(value))
      ? 'N/A'
      : `$${Number(value).toFixed(2)}/fisher/day`
  },
  mean_rpua: {
    id: 'mean_rpua',
    shortLabel: 'RPUA',
    displayLabel: 'Revenue per unit area',
    unit: '$/fisher/area',
    sourceField: 'mean_rpua',
    formula: 'Average landed value normalized by area',
    cadence: 'Monthly (time series)',
    format: (value) => value === null || value === undefined || Number.isNaN(Number(value))
      ? 'N/A'
      : `$${Number(value).toFixed(2)}/fisher/area`
  },
  mean_price_kg: {
    id: 'mean_price_kg',
    shortLabel: 'Price',
    displayLabel: 'Price per kilogram',
    unit: '$/kg',
    sourceField: 'mean_price_kg',
    formula: 'Average observed fish sale price',
    cadence: 'Monthly (time series)',
    format: (value) => value === null || value === undefined || Number.isNaN(Number(value))
      ? 'N/A'
      : `$${Number(value).toFixed(2)}/kg`
  },
  fishers_total: {
    id: 'fishers_total',
    shortLabel: 'Fishers (Total)',
    displayLabel: 'Total fishers',
    unit: 'fishers',
    sourceField: 'fishers_total',
    formula: 'fishers_male + fishers_female from frame-gears aggregates',
    cadence: 'Static census snapshot',
    format: (value) => integerWithUnit(value, 'fishers')
  },
  fishers_male: {
    id: 'fishers_male',
    shortLabel: 'Fishers (Male)',
    displayLabel: 'Male fishers',
    unit: 'fishers',
    sourceField: 'fishers_male',
    formula: 'Male fisher count from frame-gears aggregates',
    cadence: 'Static census snapshot',
    format: (value) => integerWithUnit(value, 'fishers')
  },
  fishers_female: {
    id: 'fishers_female',
    shortLabel: 'Fishers (Female)',
    displayLabel: 'Female fishers',
    unit: 'fishers',
    sourceField: 'fishers_female',
    formula: 'Female fisher count from frame-gears aggregates',
    cadence: 'Static census snapshot',
    format: (value) => integerWithUnit(value, 'fishers')
  },
  boats_total: {
    id: 'boats_total',
    shortLabel: 'Boats',
    displayLabel: 'Total boats',
    unit: 'boats',
    sourceField: 'boats_total',
    formula: 'Summed n_boats from frame-gears aggregates',
    cadence: 'Static census snapshot',
    format: (value) => integerWithUnit(value, 'boats')
  }
});

export const SELECTABLE_METRIC_IDS = Object.freeze(['mean_cpue', 'mean_rpue', 'mean_price_kg', 'fishers', 'boats']);

// Everything below describes the GPS-derived effort layers. The authority for these
// definitions is docs/PDS-data-dictionary.md, which is deliberately not committed —
// ask the data team for a copy before changing any wording or formula here.

/**
 * Geometry of the effort grid. Resolution 9 H3 cells average ~0.105 km²
 * (~0.12 km² at WIO latitudes), roughly 350–370 m across.
 */
export const H3_EFFORT_GRID = Object.freeze({
  resolution: 9,
  cellAreaKm2: 0.105,
  areaLabel: '≈0.1 km²',
  widthLabel: '350–370 m across'
});

export const LAYER_METADATA = Object.freeze({
  'wio-regions': {
    id: 'wio-regions',
    label: 'Administrative regions',
    summary: 'Coastal provinces and districts shaded by the selected fisheries survey metric.',
    encoding: 'Colour is a quantile class of the selected metric, averaged over the selected years.',
    source: 'map_gaul1.json / map_gaul2.json, enriched from ts_gaul1.json / ts_gaul2.json'
  },
  'pds-h3-effort-layer': {
    id: 'pds-h3-effort-layer',
    label: 'Fishing effort grid',
    summary: `Where boats actually fished, binned into hexagonal cells of ${H3_EFFORT_GRID.areaLabel}. Built from GPS tracks, counting only pings classified as fishing — steaming and time in port are already excluded.`,
    encoding: 'Colour is a quantile class of the selected metric; in 3D mode column height shows the same value.',
    source: 'pds-h3-effort-r9.json'
  },
  'pds-fishing-grounds-layer': {
    id: 'pds-fishing-grounds-layer',
    label: 'Fishing grounds',
    summary: 'Contiguous areas of sustained fishing, formed by merging neighbouring grid cells that clear a minimum trip count and fishing time. Pooled across all years.',
    encoding: 'Colour is a quantile class of the selected metric. Ratio metrics are averages across the ground’s cells, not totals for the ground.',
    source: 'pds-fishing-grounds.geojson'
  },
  bathymetry: {
    id: 'bathymetry',
    label: 'Bathymetry',
    summary: 'Sea-floor depth contours, for reading effort against the shelf edge and drop-offs.',
    encoding: 'Line colour is a depth class; labels appear at higher zoom only.',
    source: 'bathymetry_contours_wio.geojson'
  }
});

/**
 * Plain-language documentation for the four selectable activity metrics.
 * `short` is sized for the legend and sidebar; `definition` for docs and panels.
 */
const ACTIVITY_METRIC_DOCS = Object.freeze({
  fishing_hours: {
    unit: 'vessel-hours',
    short: 'Total time spent fishing in the cell.',
    definition: 'Time between consecutive fishing pings, summed over every trip that fished the cell. Summed across boats, so two vessels fishing the same hour contribute two vessel-hours.'
  },
  avg_hours_per_day: {
    unit: 'vessel-hours / active day',
    short: 'Fishing intensity on days the cell was used.',
    definition: 'Fishing hours ÷ active days. Separates hard-worked cells from ones that are merely visited often. Can exceed 24 because it sums across boats: ten vessels fishing four hours in one day gives 40.'
  },
  unique_trips: {
    unit: 'trips',
    short: 'Distinct trips that worked the cell.',
    definition: 'Number of distinct trips with at least one fishing ping in the cell. Duplicate PDS records for the same physical track are collapsed first, so this counts trips rather than trip identifiers.'
  },
  constancy: {
    unit: 'fraction of days (0–1)',
    short: 'How regularly the cell was fished.',
    definition: 'Active days ÷ the number of days available in the period on view. 1.0 means the cell was fished every single day; 0.1 means one day in ten. Low values are normal — most cells are worked occasionally.'
  }
});

/**
 * Fields that are ratios rather than totals. They cannot be summed across cells,
 * and on the grounds layer they are means across a ground's cells rather than
 * values recomputed from the ground's totals.
 */
const RATIO_ACTIVITY_FIELDS = Object.freeze([
  'avg_fidelity',
  'constancy',
  'avg_hours_per_day',
  'avg_visits_per_day',
  'hours_per_trip'
]);

export const isRatioActivityField = (field) => RATIO_ACTIVITY_FIELDS.includes(field);

/** Full variable dictionary for the effort grid, in file order. */
export const H3_EFFORT_VARIABLES = Object.freeze([
  {
    field: 'h3_index',
    unit: '—',
    definition: `Identifier of the hexagonal cell, at H3 resolution ${H3_EFFORT_GRID.resolution} (${H3_EFFORT_GRID.areaLabel}, ${H3_EFFORT_GRID.widthLabel}).`
  },
  {
    field: 'year',
    unit: 'year',
    definition: 'Calendar year (UTC) of the pings. A trip that fishes across New Year contributes to both years.'
  },
  {
    field: 'fishing_hours',
    unit: 'vessel-hours',
    definition: 'Time between consecutive fishing pings, summed over every trip that fished the cell that year. A sum over boats, not elapsed time.',
    shownAs: 'Fishing Hours'
  },
  {
    field: 'unique_trips',
    unit: 'trips',
    definition: 'Distinct trips with at least one fishing ping in the cell that year.',
    shownAs: 'Unique Trips'
  },
  {
    field: 'n_active_days',
    unit: 'days',
    definition: 'Distinct calendar dates on which at least one fishing ping fell in the cell. A date counts once however many boats fished it.',
    shownAs: 'Active Days (hover)'
  },
  {
    field: 'avg_fidelity',
    unit: '0–1',
    definition: 'For each trip that fished the cell, the share of that trip’s whole fishing time spent here; averaged over those trips. Near 1.0 means contributing trips fished almost nowhere else, so the cell is a destination rather than a waypoint.'
  },
  {
    field: 'constancy',
    unit: '0–1',
    definition: 'Active days ÷ days of that year lying inside the study period. Because the first and last years are only partly covered, each year is measured against the days actually available, keeping years comparable.',
    shownAs: 'Constancy'
  },
  {
    field: 'avg_hours_per_day',
    unit: 'vessel-hours / day',
    definition: 'Fishing hours ÷ active days. May legitimately exceed 24, since it sums across boats.',
    shownAs: 'Avg Hrs / Active Day'
  },
  {
    field: 'avg_visits_per_day',
    unit: 'trips / day',
    definition: 'Unique trips ÷ active days. An overnight trip creates two active days, so a cell visited once overnight reads 0.5.'
  },
  {
    field: 'hours_per_trip',
    unit: 'vessel-hours / trip',
    definition: 'Fishing hours ÷ unique trips. Mean time a contributing trip spent in the cell.'
  }
]);

/** Variable dictionary for the fishing grounds polygons. */
export const GROUNDS_VARIABLES = Object.freeze([
  {
    field: 'ground_id',
    unit: '—',
    definition: 'Label of the form FG_n, numbered by decreasing area. Not stable between data refreshes — do not treat it as a permanent identifier for a place.'
  },
  {
    field: 'country',
    unit: '—',
    definition: 'Dominant country among the ground’s cells. Some grounds are attributed to Zanzibar separately from mainland Tanzania, and a few resolve to “unknown”.'
  },
  { field: 'area_km2', unit: 'km²', definition: 'Area of the merged polygon.' },
  {
    field: 'fishing_hours',
    unit: 'vessel-hours',
    definition: 'Sum over the ground’s constituent cells, across all years.'
  },
  {
    field: 'unique_trips',
    unit: 'cell visits',
    definition: 'Sum of the per-cell trip counts, so a trip crossing several cells of the ground is counted once per cell. Larger than the number of distinct trips that visited the ground.'
  },
  {
    field: 'n_active_days',
    unit: 'days',
    definition: 'Union of the constituent cells’ active dates, so a day fished in several cells of one ground counts once.'
  },
  {
    field: 'avg_fidelity, constancy, avg_hours_per_day, avg_visits_per_day, hours_per_trip',
    unit: 'as in the grid',
    definition: 'The plain mean of the corresponding per-cell values, giving every cell equal weight regardless of how much effort it holds — not recomputed from the ground totals. This is why a ground’s hours-per-day does not equal its hours ÷ its active days.'
  },
  {
    field: 'fishing_hours_per_km2, unique_trips_per_km2',
    unit: 'per km²',
    definition: 'Ground total ÷ area. Density measures that let small intensively used grounds be compared with large diffuse ones.'
  },
  {
    field: 'hours_per_day_per_km2',
    unit: 'vessel-hours / day / km²',
    definition: 'The ground’s mean hours-per-day ÷ its area — a mean across cells divided by an area, not a total divided by an area.'
  }
]);

/** How the effort numbers come to exist, from raw GPS to map. */
export const EFFORT_PIPELINE_STEPS = Object.freeze([
  {
    title: 'GPS tracks',
    detail: 'Vessel tracks are collected per trip by Pelagic Data Systems devices and downloaded trip by trip.'
  },
  {
    title: 'Fishing pings only',
    detail: 'A statistical classifier labels each ping. Only pings classified as fishing, not on land and not near shore are kept, so steaming to the grounds, drifting near port and time ashore never enter the totals.'
  },
  {
    title: 'Duplicate trips removed',
    detail: 'PDS revises trips after we read them, retiring identifiers and re-segmenting tracks, so one physical track can arrive under several trip IDs. Identical trips are dropped and pings shared by overlapping trips are counted once, so trip counts approximate physical trips rather than PDS records.'
  },
  {
    title: 'Time measured between pings',
    detail: 'Each ping carries the interval since the previous ping in its trip, and that interval is credited in full to the cell holding the later ping. Devices normally report every few seconds; where one falls silent, a gap counts for at most 15 minutes.'
  },
  {
    title: 'Binned to hexagons',
    detail: `Pings are assigned to the H3 resolution ${H3_EFFORT_GRID.resolution} cell that contains them — ${H3_EFFORT_GRID.areaLabel}, ${H3_EFFORT_GRID.widthLabel}. All timestamps are UTC, so days and years are UTC days and years.`
  }
]);

/** Caveats a reader needs in order not to misread the effort layers. */
export const EFFORT_READING_NOTES = Object.freeze([
  {
    title: 'Hours are vessel-hours',
    detail: 'Every hours figure sums time across boats. A cell can show more than 24 hours in a day when several vessels fish it, and that is not an error.'
  },
  {
    title: 'Ratios cannot be added up',
    detail: 'Averages, constancy, hours-per-trip and the per-km² columns cannot be summed or averaged across cells to describe a larger area. They have to be recomputed from fishing hours, trips and active days — which is what this app does when you view all years at once.'
  },
  {
    title: 'A silent device still accrues time',
    detail: 'When a device stops reporting, up to 15 minutes is still credited to the cell where it next reported. Cells whose effort rests on a few pings separated by long gaps are the least certain on the map.'
  },
  {
    title: 'Effort is not catch',
    detail: 'These layers show where time was spent, not what was landed. A heavily fished cell is not necessarily a productive one.'
  },
  {
    title: 'Coverage is not a census',
    detail: 'Only vessels carrying a PDS device appear. Blank sea is an absence of tracked fishing, which is not the same as an absence of fishing.'
  },
  {
    title: 'Grounds and cells are not interchangeable',
    detail: 'Grounds discard below-threshold cells, pool every year together, and average their ratio metrics across cells. Ground totals are therefore smaller than grid totals, and a ground’s averages will not match a calculation from its own totals.'
  }
]);

export const TOOLTIP_FIELD_ORDER = Object.freeze({
  'wio-regions': ['region', 'country', 'metric'],
  'pds-h3-effort-layer': ['fishing_hours', 'unique_trips', 'n_active_days'],
  'pds-fishing-grounds-layer': ['area_km2', 'fishing_hours', 'unique_trips', 'n_active_days']
});

export const GLOSSARY_TERMS = Object.freeze([
  { term: 'GAUL1', definition: 'Administrative level 1 coastal boundary (province or state).' },
  { term: 'GAUL2', definition: 'Administrative level 2 coastal boundary (district).' },
  { term: 'CPUE', definition: 'Catch per unit effort, in kilograms per fisher-day.' },
  { term: 'RPUE', definition: 'Revenue per unit effort, in USD per fisher-day.' },
  {
    term: 'Effort grid',
    definition: `Hexagonal cells of ${H3_EFFORT_GRID.areaLabel} (H3 resolution ${H3_EFFORT_GRID.resolution}, ${H3_EFFORT_GRID.widthLabel}) holding time that GPS-tracked vessels spent fishing.`
  },
  {
    term: 'Fishing ground',
    definition: 'A contiguous area of sustained fishing, formed by merging neighbouring grid cells that clear a minimum trip count and fishing time. Pooled across all years.'
  },
  {
    term: 'Fishing ping',
    definition: 'A GPS position that a classifier labelled as fishing, rather than steaming, drifting near port or sitting on land. Only these positions contribute to any figure in the effort layers.'
  },
  {
    term: 'Vessel-hours',
    definition: 'The unit of every hours figure here: time summed across boats. Two vessels fishing the same hour contribute two vessel-hours, so a single day can exceed 24.'
  },
  { term: 'Quantile scale', definition: 'Colour classes split into equally sized ranked groups, so each class holds a similar number of cells.' },
  {
    term: 'Fishing Hours',
    definition: 'Time between consecutive fishing pings, summed over every trip that fished a cell. Measured in vessel-hours.'
  },
  {
    term: 'Avg Hrs / Active Day',
    definition: 'Fishing hours ÷ active days — intensity on the days a cell was actually used, which separates hard-worked cells from frequently passed ones.'
  },
  {
    term: 'Constancy',
    definition: 'Active days ÷ the days available in the period on view. 1.0 means fished every single day. Viewing one year measures against that year; viewing all years measures against the whole record.'
  },
  {
    term: 'Unique Trips',
    definition: 'Distinct trips with at least one fishing ping in a cell. On the grounds layer the same field sums per-cell counts, so a trip crossing several cells of a ground is counted once per cell.'
  },
  { term: 'Active Days', definition: 'Distinct calendar days (UTC) on which at least one fishing ping fell in the cell, however many boats were involved.' },
  {
    term: 'Fidelity',
    definition: 'The share of a trip’s whole fishing time spent in one cell, averaged over the trips that fished it. High fidelity marks a destination rather than a waypoint.'
  }
]);

export const DATA_DICTIONARY_ROWS = Object.freeze([
  {
    uiLabel: 'Fishing effort grid',
    sourceField: 'fishing_hours, unique_trips, n_active_days, avg_hours_per_day, constancy',
    transform: 'Cells with fewer than 3 trips are dropped. Selecting one year takes that year’s rows; selecting all years sums hours, trips and active days per cell and recomputes every ratio from those totals. Colour classes are quantiles over whatever remains.'
  },
  {
    uiLabel: 'Fishing grounds',
    sourceField: 'Polygon properties in the fishing grounds file',
    transform: 'Grounds with no attributable trips are dropped, then colour classes are quantiles of the selected metric. Always all-years, regardless of the year filter.'
  },
  {
    uiLabel: 'Bathymetry',
    sourceField: 'depth_m, depth_label',
    transform: 'Depth interpolated into colour classes, with labels shown only for key contours at higher zoom.'
  },
  {
    uiLabel: 'Region choropleth',
    sourceField: 'mean_cpue, mean_rpue, mean_price_kg, fishers_*, boats_total',
    transform: 'Averaged over the selected year range, then binned into colour grades.'
  }
]);

export const ACTIVITY_METRIC_METADATA = Object.freeze(
  ACTIVITY_METRICS.reduce((acc, metric) => {
    const docs = ACTIVITY_METRIC_DOCS[metric.id] ?? {};
    acc[metric.id] = {
      id: metric.id,
      label: metric.label,
      format: metric.format,
      unit: docs.unit ?? '',
      short: docs.short ?? '',
      definition: docs.definition ?? ''
    };
    return acc;
  }, {})
);

export const getActivityMetricMetadata = (metricId) =>
  ACTIVITY_METRIC_METADATA[metricId] ?? null;

export const getMetricMetadata = (metricId) => METRIC_METADATA[metricId] ?? null;

export const getMetricDisplayInfo = (metricId) => {
  const metric = METRIC_METADATA[metricId];
  if (!metric) return null;
  return {
    id: metric.id,
    label: metric.shortLabel ?? metric.displayLabel ?? metric.id,
    description: metric.displayLabel ?? metric.shortLabel ?? metric.id,
    unit: metric.unit ?? '',
    sourceField: metric.sourceField,
    formula: metric.formula,
    cadence: metric.cadence ?? 'Unknown cadence',
    format: metric.format
  };
};
