/**
 * GAUL schema constants for data pipelines
 * FAO GAUL: Global Administrative Unit Layers
 */

/** Required GAUL fields for map features and time series records */
export const GAUL_REQUIRED_FIELDS = ['country', 'gaul1_name', 'gaul2_name'];

/** Metric column names for pass-through from MongoDB */
export const METRIC_COLUMNS = [
  'mean_cpue',
  'mean_cpua',
  'mean_rpue',
  'mean_rpua',
  'mean_price_kg'
];

/**
 * Build canonical GAUL key for lookups
 * Format: country_gaul1_name_gaul2_name
 */
export const gaulKey = (country, gaul1Name, gaul2Name) =>
  `${country}_${gaul1Name}_${gaul2Name}`;
