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
  },
  fishers_total: {
    label: 'Fishers (Total)',
    unit: 'fishers',
    description: 'Total fishers (male + female)',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return `${Math.round(value).toLocaleString()} fishers`;
    }
  },
  fishers_male: {
    label: 'Fishers (Male)',
    unit: 'fishers',
    description: 'Male fishers',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return `${Math.round(value).toLocaleString()} fishers`;
    }
  },
  fishers_female: {
    label: 'Fishers (Female)',
    unit: 'fishers',
    description: 'Female fishers',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return `${Math.round(value).toLocaleString()} fishers`;
    }
  },
  boats_total: {
    label: 'Boats',
    unit: 'number of boats',
    description: 'Total boats',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return `${Math.round(value).toLocaleString()} boats`;
    }
  },
  fishers: {
    label: 'Fishers',
    unit: 'number of fishers',
    description: 'Fishers by sex and total',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return `${Math.round(value).toLocaleString()} fishers`;
    }
  },
  boats: {
    label: 'Boats',
    unit: 'number of boats',
    description: 'Number of boats',
    format: (value) => {
      if (value === null || value === undefined) return 'N/A';
      return `${Math.round(value).toLocaleString()} boats`;
    }
  }
};

/** Metric IDs shown in the metric selector (CPUA and RPUA are hidden from selection) */
export const SELECTABLE_METRIC_IDS = ['mean_cpue', 'mean_rpue', 'mean_price_kg', 'fishers', 'boats'];

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