export const getDistrictColor = (value) => {
  return value > 900 ? '#08519c' :
         value > 700 ? '#3182bd' :
         value > 500 ? '#6baed6' :
         value > 300 ? '#9ecae1' :
         value > 100 ? '#c6dbef' :
                      '#eff3ff';
};

export const getElevation = (value) => {
  return value * 100;
};

export const getDistrictStyle = (feature, { isDarkTheme, opacity, selectedDistricts }) => {
  const value = feature.properties.value || 0;
  const elevation = getElevation(value);
  const isSelected = selectedDistricts.some(d => d.properties.ADM2_PCODE === feature.properties.ADM2_PCODE);
  
  return {
    fillColor: isSelected ? '#ff4757' : getDistrictColor(value),
    weight: isSelected ? 3 : 2,
    opacity: 1,
    color: isSelected ? '#ff6b81' : 'white',
    dashArray: isSelected ? '' : '3',
    fillOpacity: isSelected ? 0.8 : opacity,
    className: 'district-polygon',
    style: {
      filter: `drop-shadow(${elevation/1000}px ${elevation/1000}px ${elevation/500}px rgba(0,0,0,0.5))`
    }
  };
};

export const getColor = (d) => {
  return d > 1000 ? '#800026' :
         d > 500  ? '#BD0026' :
         d > 200  ? '#E31A1C' :
         d > 100  ? '#FC4E2A' :
         d > 50   ? '#FD8D3C' :
         d > 20   ? '#FEB24C' :
         d > 10   ? '#FED976' :
                    '#FFEDA0';
};

export const getMapStyles = (isDarkTheme) => {
  return isDarkTheme 
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';
};

// Mapbox layer styles
export const getDistrictLayer = (selectedDistricts, isDarkTheme, opacity = 0.7, coverage = 75) => ({
  id: 'districts',
  type: 'fill',
  paint: {
    'fill-color': [
      'case',
      ['in', ['get', 'ADM2_PCODE'], ['literal', selectedDistricts.map(d => d.properties.ADM2_PCODE)]],
      isDarkTheme ? '#3498db' : '#2980b9',
      [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        0, '#eff3ff',
        coverage * 1, '#c6dbef',
        coverage * 3, '#9ecae1',
        coverage * 5, '#6baed6',
        coverage * 7, '#3182bd',
        coverage * 9, '#08519c'
      ]
    ],
    'fill-opacity': [
      'case',
      ['in', ['get', 'ADM2_PCODE'], ['literal', selectedDistricts.map(d => d.properties.ADM2_PCODE)]],
      0.8,
      opacity
    ],
    'fill-outline-color': isDarkTheme ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
  }
});

export const getHoverLayer = (isDarkTheme, radius = 2) => ({
  id: 'districts-hover',
  type: 'line',
  paint: {
    'line-color': isDarkTheme ? '#ffffff' : '#000000',
    'line-width': radius / 10
  }
});

export const containerStyles = (isDarkTheme) => ({
  container: {
    position: 'relative',
    height: '100vh',
    width: '100%',
    backgroundColor: isDarkTheme ? '#1a1a1a' : '#f8f9fa',
    display: 'flex',
    flexDirection: 'column'
  },
  contentWrapper: {
    position: 'relative',
    flexGrow: 1,
    marginTop: '60px'
  },
  panelsContainer: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: 'calc(100vh - 100px)',
    width: '300px',
    zIndex: 1000
  },
  legend: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    padding: '15px',
    backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    color: isDarkTheme ? '#fff' : '#2c3e50',
    borderRadius: '8px',
    boxShadow: isDarkTheme ? '0 4px 6px rgba(255,255,255,0.1)' : '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: 1000,
    maxWidth: '200px',
    backdropFilter: 'blur(10px)'
  },
  popup: {
    backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    color: isDarkTheme ? '#fff' : '#2c3e50',
    borderRadius: '8px',
    padding: '10px',
    boxShadow: isDarkTheme ? '0 4px 6px rgba(255,255,255,0.1)' : '0 4px 6px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)'
  }
}); 