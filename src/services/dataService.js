// Function to load GeoJSON data
export const loadBoundaries = async () => {
  try {
    const [mozambiqueResponse, kenyaResponse, zanzibarResponse] = await Promise.all([
      fetch('/data/palma_area.geojson'),
      fetch('/data/kenya_coast.geojson'),
      fetch('/data/zanzibar_coast.geojson')
    ]);
    
    const mozambiqueData = await mozambiqueResponse.json();
    const kenyaData = await kenyaResponse.json();
    const zanzibarData = await zanzibarResponse.json();

    // Combine all feature collections
    return {
      type: 'FeatureCollection',
      features: [...mozambiqueData.features, ...kenyaData.features, ...zanzibarData.features]
    };
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
      'MZ0106': 350, // Macomia
      // Kenya districts will use the same data structure with KE prefix
      'KE001001': 750,
      'KE003011': 650,
      'KE001006': 450,
      'KE005022': 550,
      'KE003017': 350,
      'KE003016': 550,
      'KE002009': 1000,
      'KE001004': 550,
      'KE001003': 250,
      // Zanzibar districts 
      'TZ5402': 750,
      'TZ5401': 650,
      'TZ5302': 450,
      'TZ5101': 550,
      'TZ5201': 1000,
      'TZ5502': 550,
      'TZ5501': 250
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