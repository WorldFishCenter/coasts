/**
 * Configuration for PDS Grid Layer visualization
 */

export const ACTIVITY_METRICS = [
  { id: 'fishing_hours', label: 'Total Hours', format: (v) => v > 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0) },
  { id: 'avg_hours_per_day', label: 'Avg Hrs/Day', format: (v) => v.toFixed(2) },
  { id: 'unique_trips', label: 'Unique Trips', format: (v) => v > 1000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString() },
  { id: 'constancy', label: 'Constancy', format: (v) => v.toFixed(3) }
];

// Color range for the grid layer (from light to dark)
// RdPu-6 palette from https://loading.io/color/feature/RdPu-6/
export const COLOR_RANGE = [
  [254, 235, 226],  // #feebe2 - lightest
  [252, 197, 192],  // #fcc5c0
  [250, 159, 181],  // #fa9fb5
  [247, 104, 161],  // #f768a1
  [221, 52, 151],   // #dd3497
  [174, 1, 126]     // #ae017e - darkest
];

// Initial view state for the map
export const INITIAL_VIEW_STATE = {
  longitude: 40.0,
  latitude: -8.0,
  zoom: 6,
  pitch: 40,
  bearing: 0
};

// Grid layer settings
export const GRID_LAYER_SETTINGS = {
  cellSize: 1000, // 1km grid cells - FIXED SIZE
  elevationScale: 50,
  elevationRange: [0, 3000],
  extruded: true,
  coverage: 0.8,
  pickable: true,
  autoHighlight: true,
  highlightColor: [255, 255, 255, 100],
  // Add aggregation settings
  getPosition: d => d.position,
  getWeight: d => d.avgTimeHours,
  aggregation: 'SUM'
};

// Shared styles for UI components
export const SHARED_STYLES = {
  glassPanel: (isDark) => ({
    backgroundColor: isDark ? 'rgba(28, 28, 28, 0.5)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    borderRadius: '8px',
    boxShadow: isDark 
      ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)' 
      : '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
  }),
  text: {
    heading: (isDark) => ({
      fontSize: '18px',
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1a202c'
    }),
    subheading: (isDark) => ({
      fontSize: '14px',
      fontWeight: '600',
      color: isDark ? '#e2e8f0' : '#2d3748'
    }),
    label: (isDark) => ({
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
    }),
    body: (isDark) => ({
      fontSize: '14px',
      fontWeight: '400',
      color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'
    }),
    muted: (isDark) => ({
      fontSize: '12px',
      fontWeight: '400',
      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
    })
  },
  button: {
    primary: (isDark, active = false) => ({
      backgroundColor: active ? '#3182ce' : 'transparent',
      color: active ? '#ffffff' : (isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'),
      border: active 
        ? '1px solid #3182ce' 
        : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
      fontSize: '13px',
      fontWeight: '500',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    }),
    secondary: (isDark) => ({
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      border: 'none',
      fontSize: '13px',
      fontWeight: '500',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    })
  },
  card: (isDark) => ({
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: '6px',
    padding: '12px',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
  }),
  transitions: {
    default: 'all 0.2s ease-in-out'
  }
};



// Calculate statistics from H3 Effort data
export const calculateH3Stats = (h3Data) => {
  if (!h3Data || h3Data.length === 0) {
    return {
      activeCells: 0,
      totalFishingHours: 0,
      totalUniqueTrips: 0,
      avgVisitsPerDay: 0,
      maxFishingHours: 0,
    };
  }
  
  const totalFishingHours = h3Data.reduce((sum, d) => sum + (Number(d.fishing_hours) || 0), 0);
  const totalUniqueTrips = h3Data.reduce((sum, d) => sum + (Number(d.unique_trips) || 0), 0);
  const avgVisitsPerDay = h3Data.reduce((sum, d) => sum + (Number(d.avg_visits_per_day) || 0), 0) / h3Data.length;
  const maxFishingHours = Math.max(...h3Data.map(d => Number(d.fishing_hours) || 0));
  
  return {
    activeCells: h3Data.length,
    totalFishingHours,
    totalUniqueTrips,
    avgVisitsPerDay,
    maxFishingHours
  };
};

// Calculate statistics from Fishing Grounds data
export const calculateGroundsStats = (groundsData) => {
  if (!groundsData || !groundsData.features || groundsData.features.length === 0) {
    return {
      totalGrounds: 0,
      totalArea: 0,
      totalFishingHours: 0
    };
  }
  
  const features = groundsData.features;
  const totalArea = features.reduce((sum, f) => sum + (Number(f.properties?.area_km2) || 0), 0);
  const totalFishingHours = features.reduce((sum, f) => sum + (Number(f.properties?.fishing_hours) || 0), 0);
  
  return {
    totalGrounds: features.length,
    totalArea,
    totalFishingHours
  };
}; 