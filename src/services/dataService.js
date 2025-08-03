/**
 * Data services for loading and processing static data files
 * These files are updated daily by GitHub Actions from MongoDB
 */

/**
 * Validate GeoJSON structure
 * @param {Object} data - The data to validate
 * @returns {boolean} Whether the data is valid
 */
const validateGeoJSON = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (data.type !== 'FeatureCollection') return false;
  if (!Array.isArray(data.features)) return false;
  
  return data.features.every(feature => {
    if (!feature || typeof feature !== 'object') return false;
    if (feature.type !== 'Feature') return false;
    if (!feature.geometry || !feature.properties) return false;
    if (!feature.properties.country || !feature.properties.region) return false;
    return true;
  });
};

/**
 * Validate time series data structure
 * @param {Object} data - The data to validate
 * @returns {boolean} Whether the data is valid
 */
const validateTimeSeries = (data) => {
  if (!data || typeof data !== 'object') return false;
  
  return Object.entries(data).every(([key, regionData]) => {
    if (!regionData || typeof regionData !== 'object') return false;
    if (!Array.isArray(regionData.data)) return false;
    
    return regionData.data.every(entry => {
      if (!entry || typeof entry !== 'object') return false;
      if (!entry.date) return false;
      return true;
    });
  });
};

/**
 * Load PDS grid data - GPS movement data aggregated in 1km grid cells
 * @returns {Promise<Array|null>} Array of grid cell data or null if error
 */
const loadPdsGridsData = async () => {
  try {
    console.log('Loading PDS grids data...');
    const response = await fetch('/data/pds_grids.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid PDS grids data format');
    }
    console.log(`Successfully loaded ${data.length} PDS grid cells`);
    return data;
  } catch (error) {
    console.error('Error loading PDS grids data:', error);
    return null;
  }
};

/**
 * Load WIO map data - Fisheries data in GeoJSON format
 * @returns {Promise<Object|null>} GeoJSON object or null if error
 */
const loadWioMapData = async () => {
  try {
    const response = await fetch('/data/wio_map.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!validateGeoJSON(data)) {
      throw new Error('Invalid GeoJSON data format');
    }
    return data;
  } catch (error) {
    console.error('Error loading WIO map data:', error);
    return null;
  }
};

/**
 * Load time series data for regions
 * @returns {Promise<Object|null>} Time series data object or null if error
 */
const loadTimeSeriesData = async () => {
  try {
    const response = await fetch('/data/time_series.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!validateTimeSeries(data)) {
      throw new Error('Invalid time series data format');
    }
    return data;
  } catch (error) {
    console.error('Error loading time series data:', error);
    return null;
  }
};

/**
 * Get the latest date from time series data
 * @param {Object} timeSeriesData - The time series data
 * @returns {string|null} Latest date string or null if no data
 */
const getLatestDate = (timeSeriesData) => {
  if (!timeSeriesData) {
    console.error('Invalid time series data structure:', timeSeriesData);
    return null;
  }

  // Get all dates from all regions
  const dates = Object.values(timeSeriesData)
    .flatMap(region => region.data.map(d => d.date))
    .filter(Boolean);

  if (dates.length === 0) {
    console.error('No valid dates found in time series data');
    return null;
  }

  // Sort dates in descending order and return the latest
  const latestDate = dates.sort((a, b) => new Date(b) - new Date(a))[0];
  console.log('Latest date found:', latestDate);
  return latestDate;
};

/**
 * Get unique countries from WIO map data
 * @param {Object} mapData - The WIO map data
 * @returns {Array<string>} Array of unique countries
 */
const getUniqueCountries = (mapData) => {
  if (!mapData || !mapData.features || mapData.features.length === 0) {
    return [];
  }

  const countries = mapData.features
    .map(feature => feature.properties.country)
    .filter(Boolean);
  
  return [...new Set(countries)];
};

/**
 * Get unique regions from WIO map data, optionally filtered by country
 * @param {Object} mapData - The WIO map data
 * @param {string} [country] - Optional country to filter by
 * @returns {Array<string>} Array of unique regions
 */
const getUniqueRegions = (mapData, country = null) => {
  if (!mapData || !mapData.features || mapData.features.length === 0) {
    return [];
  }

  let features = mapData.features;
  if (country) {
    features = features.filter(feature => 
      feature.properties.country === country
    );
  }

  const regions = features
    .map(feature => feature.properties.region)
    .filter(Boolean);
  
  return [...new Set(regions)];
};

/**
 * Format PDS grid data for heatmap visualization
 * @param {Array} pdsGrids - The PDS grids data
 * @param {string} valueField - Field to use for values (e.g., 'avg_time_hours', 'total_visits')
 * @returns {Array} Formatted data for heatmap visualization
 */
const formatPdsGridsForHeatmap = (pdsGrids, valueField = 'total_visits') => {
  if (!pdsGrids || !pdsGrids.length) return [];

  return pdsGrids.map(grid => ({
    latitude: grid.lat_grid_1km,
    longitude: grid.lng_grid_1km,
    value: grid[valueField] || 0
  }));
};

/**
 * Get min and max values for a specific field in PDS grid data
 * @param {Array} pdsGrids - The PDS grids data
 * @param {string} field - Field to get min/max for
 * @returns {Object} Object with min and max values
 */
const getPdsGridsMinMax = (pdsGrids, field) => {
  if (!pdsGrids || !pdsGrids.length) {
    return { min: 0, max: 0 };
  }

  const values = pdsGrids
    .map(grid => grid[field] || 0)
    .filter(value => !isNaN(value));
  
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
};

/**
 * Get time series for a specific region
 * @param {Object} timeSeriesData - The time series data
 * @param {string} country - Country name
 * @param {string} region - Region name
 * @returns {Object|null} Time series data for the region or null if not found
 */
const getTimeSeriesForRegion = (timeSeriesData, country, region) => {
  const key = `${country}_${region}`;
  return timeSeriesData[key] || null;
};

/**
 * Get latest metrics for a region
 * @param {Object} timeSeriesData - The time series data
 * @param {string} country - Country name
 * @param {string} region - Region name
 * @returns {Object|null} Latest metrics for the region or null if not found
 */
const getLatestMetrics = (timeSeriesData, country, region) => {
  const regionData = getTimeSeriesForRegion(timeSeriesData, country, region);
  if (!regionData || !regionData.data || regionData.data.length === 0) {
    return null;
  }
  
  // Sort by date and get the latest
  const sortedData = [...regionData.data].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  return sortedData[0];
};

/**
 * Get color scale for map visualization based on CPUE values
 * @param {number} value - The CPUE value
 * @returns {string} Color in hex format
 */
const getColorScale = (value) => {
  // Define color stops for CPUE values
  const colorStops = [
    { value: 0, color: '#eff3ff' },
    { value: 5, color: '#c6dbef' },
    { value: 10, color: '#9ecae1' },
    { value: 15, color: '#6baed6' },
    { value: 20, color: '#3182bd' },
    { value: 25, color: '#08519c' }
  ];

  // Find the appropriate color for the value
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (value <= colorStops[i + 1].value) {
      return colorStops[i].color;
    }
  }
  return colorStops[colorStops.length - 1].color;
};

/**
 * Get formatted metrics for display
 * @param {Object} metrics - The metrics object
 * @returns {Object} Formatted metrics
 */
const getFormattedMetrics = (metrics) => {
  if (!metrics) return null;
  
  return {
    cpue: metrics.mean_cpue ? metrics.mean_cpue.toFixed(2) : '0.00',
    rpue: metrics.mean_rpue ? metrics.mean_rpue.toFixed(2) : '0.00',
    price: metrics.mean_price_kg ? metrics.mean_price_kg.toFixed(2) : '0.00'
  };
};

/**
 * Get average metrics for a region within a date range
 * @param {Object} timeSeriesData - The time series data
 * @param {string} country - Country name
 * @param {string} region - Region name
 * @param {string} startDate - Start date (inclusive, ISO string)
 * @param {string} endDate - End date (inclusive, ISO string)
 * @returns {Object|null} Average metrics or null if no data in range
 */
const getAverageMetricsInRange = (timeSeriesData, country, region, startDate, endDate) => {
  const regionData = getTimeSeriesForRegion(timeSeriesData, country, region);
  if (!regionData || !regionData.data || regionData.data.length === 0) {
    return null;
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Filter entries within the range
  const filtered = regionData.data.filter(entry => {
    const d = new Date(entry.date);
    return d >= start && d <= end;
  });
  if (filtered.length === 0) return null;
  // Compute averages for each metric
  const metrics = ['mean_cpue', 'mean_cpua', 'mean_rpue', 'mean_rpua', 'mean_price_kg'];
  const avg = {};
  metrics.forEach(metric => {
    const vals = filtered.map(e => e[metric]).filter(v => typeof v === 'number' && !isNaN(v));
    avg[metric] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });
  return avg;
};

export const loadMapData = loadWioMapData;

export {
  loadPdsGridsData,
  loadWioMapData,
  loadTimeSeriesData,
  getLatestDate,
  getUniqueCountries,
  getUniqueRegions,
  formatPdsGridsForHeatmap,
  getPdsGridsMinMax,
  getTimeSeriesForRegion,
  getLatestMetrics,
  getColorScale,
  getFormattedMetrics,
  validateGeoJSON,
  validateTimeSeries,
  getAverageMetricsInRange
}; 