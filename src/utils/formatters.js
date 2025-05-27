// Metric definitions with units and display names
export const METRIC_CONFIG = {
  mean_cpue: {
    label: 'CPUE',
    unit: 'kg/fisher/day',
    description: 'Catch Per Unit Effort',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return value === 0 ? '0.00 kg/fisher/day' : `${value.toFixed(2)} kg/fisher/day`;
    }
  },
  mean_cpua: {
    label: 'CPUA',
    unit: 'kg/fisher/area',
    description: 'Catch Per Unit Area',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return value === 0 ? '0.00 kg/fisher/area' : `${value.toFixed(2)} kg/fisher/area`;
    }
  },
  mean_rpue: {
    label: 'RPUE',
    unit: '$/fisher/day',
    description: 'Revenue Per Unit Effort',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return value === 0 ? '$0.00/fisher/day' : `$${value.toFixed(2)}/fisher/day`;
    }
  },
  mean_rpua: {
    label: 'RPUA',
    unit: '$/fisher/area',
    description: 'Revenue Per Unit Area',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return value === 0 ? '$0.00/fisher/area' : `$${value.toFixed(2)}/fisher/area`;
    }
  },
  mean_price_kg: {
    label: 'Price',
    unit: '$/kg',
    description: 'Price per Kilogram',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return value === 0 ? '$0.00/kg' : `$${value.toFixed(2)}/kg`;
    }
  }
};

// Get metric info with fallback
export const getMetricInfo = (metricId) => {
  return METRIC_CONFIG[metricId] || {
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

// Format region name (handle different property names)
export const formatRegionName = (properties) => {
  const name = properties.region || properties.ADM2_PT || properties.ADM2_EN || 'Unknown';
  return capitalizeWords(name);
};

// Format country name
export const formatCountryName = (country) => {
  if (!country) return '';
  // Special cases for country names
  const specialCases = {
    'tanzania': 'Tanzania',
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