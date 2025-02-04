// Function to load GeoJSON data
export const loadBoundaries = async () => {
  try {
    const response = await fetch('/data/palma_area.geojson');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading boundaries:', error);
    return null;
  }
};

// Function to load fishery catch data
export const loadFisheryData = async () => {
  try {
    // Sample fishery data - replace with actual API endpoint when available
    const sampleData = {
      'MZ0101': 850, // Ancuabe
      'MZ0102': 650, // Balama
      'MZ0103': 450, // Chiure
      'MZ0104': 750, // Cidade De Pemba
      'MZ0105': 550, // Ibo
      'MZ0106': 350  // Macomia
    };
    return sampleData;
  } catch (error) {
    console.error('Error loading fishery data:', error);
    return null;
  }
};

// Function to merge boundary and fishery data
export const mergeBoundaryAndFisheryData = (boundaries, fisheryData) => {
  if (!boundaries || !fisheryData) return null;

  const features = boundaries.features.map(feature => {
    const pcode = feature.properties.ADM2_PCODE;
    const value = fisheryData[pcode] || 0;
    return {
      ...feature,
      properties: {
        ...feature.properties,
        value
      }
    };
  });

  return {
    ...boundaries,
    features
  };
};

// Function to load Palma area GeoJSON data
export const loadPalmaArea = async () => {
  try {
    const response = await fetch('/data/palma_area.geojson');
    return await response.json();
  } catch (error) {
    console.error('Error loading Palma area data:', error);
    return null;
  }
};

// Sample district values - replace this with your actual data loading logic
const districtValues = {
  'MZ0101': 850,  // Ancuabe
  'MZ0102': 650,  // Balama
  'MZ0103': 450,  // Chiure
  'MZ0104': 950,  // Cidade De Pemba
  'MZ0105': 550,  // Ibo
  'MZ0106': 750   // Macomia
};

// Function to load district values
export const loadDistrictValues = async () => {
  try {
    // In a real application, you would fetch this data from an API
    // For now, we'll return the sample data
    return districtValues;
  } catch (error) {
    console.error('Error loading district values:', error);
    return null;
  }
};

// Function to merge Palma area GeoJSON with district values
export const mergePalmaWithDistrictValues = (palmaArea, districtValues) => {
  if (!palmaArea || !districtValues) return null;

  const mergedFeatures = palmaArea.features.map(feature => {
    const districtId = feature.properties.ADM2_PCODE;
    const value = districtValues[districtId] || 0;
    
    return {
      ...feature,
      properties: {
        ...feature.properties,
        value
      }
    };
  });

  return {
    type: 'FeatureCollection',
    features: mergedFeatures
  };
}; 