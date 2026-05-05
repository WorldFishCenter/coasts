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

export const LAYER_METADATA = Object.freeze({
  'wio-regions': {
    id: 'wio-regions',
    label: 'GAUL boundary choropleth',
    source: 'public/data/map_gaul1.json + map_gaul2.json with ts_gaul1/ts_gaul2 enrichment',
    encoding: 'Quantile color ramp on selected fisheries metric'
  },
  'pds-h3-effort-layer': {
    id: 'pds-h3-effort-layer',
    label: 'PDS H3 activity cells',
    source: 'public/data/pds-h3-effort-r9.json',
    encoding: 'Quantile color + optional extrusion in column mode; pre-filtered to unique_trips ≥ 3',
    notes: 'avg_hours_per_day = fishing_hours / n_active_days (intensity per active day). constancy = n_active_days / n_total_days (fraction of study period).'
  },
  'pds-fishing-grounds-layer': {
    id: 'pds-fishing-grounds-layer',
    label: 'PDS designated fishing grounds',
    source: 'public/data/pds-fishing-grounds.geojson',
    encoding: 'Quantile polygon fill on selected activity metric'
  },
  bathymetry: {
    id: 'bathymetry',
    label: 'Bathymetry contours',
    source: 'public/data/bathymetry_contours_wio.geojson',
    encoding: 'Depth-classed line color with labeled contour intervals'
  }
});

export const TOOLTIP_FIELD_ORDER = Object.freeze({
  'wio-regions': ['region', 'country', 'metric'],
  'pds-h3-effort-layer': ['fishing_hours', 'unique_trips', 'n_active_days'],
  'pds-fishing-grounds-layer': ['area_km2', 'fishing_hours', 'unique_trips', 'n_active_days']
});

export const GLOSSARY_TERMS = Object.freeze([
  { term: 'GAUL1', definition: 'Administrative level 1 coastal boundary (province/state).' },
  { term: 'GAUL2', definition: 'Administrative level 2 coastal boundary (district).' },
  { term: 'CPUE', definition: 'Catch per unit effort, in kilograms per fisher-day.' },
  { term: 'RPUE', definition: 'Revenue per unit effort, in USD per fisher-day.' },
  { term: 'PDS Grounds', definition: 'Designated fishing-ground polygons from PeskAAS movement data.' },
  { term: 'H3 Activity Cells', definition: 'Hexagonal bins showing movement-derived activity intensity.' },
  { term: 'Quantile scale', definition: 'Color classes split into equally sized ranked groups.' },
  { term: 'Avg Hrs / Active Day', definition: 'fishing_hours ÷ n_active_days. Measures fishing intensity on days when this cell was actually visited. Typical range 0.04–17 h/day.' },
  { term: 'Constancy', definition: 'n_active_days ÷ n_total_days (study period ≈ 2023–present). Fraction of all days in the study window on which this cell was active. A cell active every day for one year scores ≈ 0.41.' },
  { term: 'Unique Trips', definition: 'Number of distinct vessel trips that passed through this H3 cell or fishing ground.' },
  { term: 'Active Days', definition: 'Number of distinct calendar days on which at least one fishing trip was recorded in this cell.' }
]);

export const DATA_DICTIONARY_ROWS = Object.freeze([
  { uiLabel: 'Local Fishing Activity', sourceField: 'fishing_hours | unique_trips | n_active_days | avg_hours_per_day (= fishing_hours / n_active_days) | constancy (= n_active_days / n_total_days)', transform: 'Pre-filtered unique_trips ≥ 3; quantile thresholds over remaining H3 rows' },
  { uiLabel: 'Fishing Grounds', sourceField: 'feature.properties.* in pds-fishing-grounds.geojson', transform: 'Unique-trips filter then quantile thresholds by selected metric' },
  { uiLabel: 'Bathymetry (Depth m)', sourceField: 'depth_m, depth_label', transform: 'Mapbox interpolate depth classes + label filter for key contours' },
  { uiLabel: 'Global Map metric legend', sourceField: 'mean_cpue / mean_rpue / mean_price_kg / fishers_* / boats_total', transform: 'Averaged per selected year range and color-binned by grades' }
]);

export const ACTIVITY_METRIC_METADATA = Object.freeze(
  ACTIVITY_METRICS.reduce((acc, metric) => {
    acc[metric.id] = {
      id: metric.id,
      label: metric.label,
      format: metric.format
    };
    return acc;
  }, {})
);

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
