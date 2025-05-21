/**
 * Data services for loading and processing static data files
 * These files are updated daily by GitHub Actions from MongoDB
 */

/**
 * Load PDS grid data - GPS movement data aggregated in 1km grid cells
 * @returns {Promise<Array|null>} Array of grid cell data or null if error
 */
export const loadPdsGridsData = async () => {
  try {
    const response = await fetch('/data/pds_grids.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading PDS grids data:', error);
    return null;
  }
};

/**
 * Load WIO summaries geo data - Fisheries data in GeoJSON format
 * @returns {Promise<Object|null>} GeoJSON object or null if error
 */
export const loadWioSummariesGeoData = async () => {
  try {
    const response = await fetch('/data/wio_summaries_geo.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading WIO summaries geo data:', error);
    return null;
  }
};

/**
 * Get the latest date from WIO summaries data
 * @param {Object} wioData - The WIO summaries geo data
 * @returns {string|null} Latest date string or null if no data
 */
export const getLatestWioDate = (wioData) => {
  if (!wioData || !wioData.features || wioData.features.length === 0) {
    return null;
  }

  return wioData.features
    .map(feature => feature.properties.date)
    .sort((a, b) => new Date(b) - new Date(a))[0];
};

/**
 * Filter WIO data by a specific date
 * @param {Object} wioData - The WIO summaries geo data
 * @param {string} date - Date string to filter by
 * @returns {Object|null} Filtered GeoJSON object or null
 */
export const filterWioDataByDate = (wioData, date) => {
  if (!wioData || !date) return null;

  const features = wioData.features.filter(feature => 
    feature.properties.date === date
  );

  return {
    type: 'FeatureCollection',
    features
  };
};

/**
 * Get unique countries from WIO data
 * @param {Object} wioData - The WIO summaries geo data
 * @returns {Array<string>} Array of unique countries
 */
export const getUniqueCountries = (wioData) => {
  if (!wioData || !wioData.features || wioData.features.length === 0) {
    return [];
  }

  const countries = wioData.features
    .map(feature => feature.properties.country)
    .filter(Boolean);
  
  return [...new Set(countries)];
};

/**
 * Get unique regions from WIO data, optionally filtered by country
 * @param {Object} wioData - The WIO summaries geo data
 * @param {string} [country] - Optional country to filter by
 * @returns {Array<string>} Array of unique regions
 */
export const getUniqueRegions = (wioData, country = null) => {
  if (!wioData || !wioData.features || wioData.features.length === 0) {
    return [];
  }

  let features = wioData.features;
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
 * @param {string} valueField - Field to use for values (e.g., 'avg_time_mins', 'total_visits')
 * @returns {Array} Formatted data for heatmap visualization
 */
export const formatPdsGridsForHeatmap = (pdsGrids, valueField = 'total_visits') => {
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
export const getPdsGridsMinMax = (pdsGrids, field) => {
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