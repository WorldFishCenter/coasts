import { METRIC_METADATA, SELECTABLE_METRIC_IDS, getMetricDisplayInfo } from './metricMetadata';
export { SELECTABLE_METRIC_IDS };

// Metric definitions with units and display names
const METRIC_METADATA_WITH_ALIASES = Object.fromEntries(
  Object.entries(METRIC_METADATA).map(([id, metric]) => ([
    id,
    {
      ...metric,
      label: metric.shortLabel ?? metric.displayLabel ?? id,
      description: metric.displayLabel ?? metric.shortLabel ?? id
    }
  ]))
);

export const METRIC_CONFIG = {
  ...METRIC_METADATA_WITH_ALIASES,
  fishers: {
    label: 'Fishers',
    pillLabel: 'Fishers',
    plainLabel: 'Fishers',
    unit: 'number of fishers',
    description: 'Fishers by sex and total',
    format: METRIC_METADATA.fishers_total.format
  },
  boats: {
    label: 'Boats',
    pillLabel: 'Boats',
    plainLabel: 'Boats',
    unit: 'number of boats',
    description: 'Number of boats',
    format: METRIC_METADATA.boats_total.format
  }
};

// Get metric info with fallback
export const getMetricInfo = (metricId) => {
  const displayInfo = getMetricDisplayInfo(metricId);
  if (displayInfo) {
    return displayInfo;
  }
  const metric = METRIC_CONFIG[metricId];
  if (metric) return metric;
  return {
    label: metricId,
    unit: '',
    description: metricId,
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return value.toFixed(2);
    }
  };
};

// Capitalize first letter of each word
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format region name (GAUL: prefer gaul2_name, fallback to gaul1_name or legacy)
export const formatRegionName = (properties) => {
  const name = properties.gaul2_name || properties.gaul1_name || properties.region || properties.ADM2_PT || properties.ADM2_EN || 'Unknown';
  return capitalizeWords(name);
};

// Format country name
export const formatCountryName = (country) => {
  if (!country) return '';
  // Special cases for country names
  const specialCases = {
    // The Tanzania features are Zanzibar's islands only.
    'tanzania': 'Zanzibar',
    'zanzibar': 'Zanzibar',
    'timor': 'Timor-Leste',
    'kenya': 'Kenya',
    'mozambique': 'Mozambique',
    'madagascar': 'Madagascar',
    'comoros': 'Comoros',
    'seychelles': 'Seychelles',
    'mauritius': 'Mauritius',
    'south africa': 'South Africa'
  };
  
  const lower = country.toLowerCase();
  return specialCases[lower] || capitalizeWords(country);
}; 
// A figure split for display: the number, its unit, and what it is per ("10.3", "kg", "per fisher per day").
const FIGURE_PARTS = {
  mean_cpue: { digits: 1, unit: 'kg', per: 'per fisher per day' },
  mean_cpua: { digits: 1, unit: 'kg', per: 'per fisher per unit area' },
  mean_rpue: { digits: 2, unit: 'USD', per: 'per fisher per day' },
  mean_rpua: { digits: 2, unit: 'USD', per: 'per fisher per unit area' },
  mean_price_kg: { digits: 2, unit: 'USD', per: 'per kg' },
  fishers_total: { digits: 0, unit: 'fishers', per: '' },
  fishers_male: { digits: 0, unit: 'men', per: '' },
  fishers_female: { digits: 0, unit: 'women', per: '' },
  boats_total: { digits: 0, unit: 'boats', per: '' }
};

export const formatFigure = (metricId, value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  const parts = FIGURE_PARTS[metricId] ?? { digits: 2, unit: '', per: '' };
  const number = parts.digits === 0
    ? Math.round(Number(value)).toLocaleString('en-US')
    : Number(value).toLocaleString('en-US', { minimumFractionDigits: parts.digits, maximumFractionDigits: parts.digits });
  return { number, unit: parts.unit, per: parts.per };
};

// Census metrics come from frame surveys and ignore the year filter.
export const isCensusMetric = (metricId) => metricId.startsWith('fishers_') || metricId === 'boats_total';
