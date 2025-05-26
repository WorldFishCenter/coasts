/**
 * Configuration for PDS Grid Layer visualization
 */

// Time range breakpoints for categorizing fishing effort
export const TIME_BREAKS = [
  { min: 0, max: 0.5, label: '< 0.5h' },
  { min: 0.5, max: 1, label: '0.5 - 1h' },
  { min: 1, max: 2, label: '1 - 2h' },
  { min: 2, max: 4, label: '2 - 4h' },
  { min: 4, max: 8, label: '4 - 8h' },
  { min: 8, max: Infinity, label: '> 8h' }
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

// Get color index for a given time value
export const getColorForValue = (value) => {
  for (let i = TIME_BREAKS.length - 1; i >= 0; i--) {
    const range = TIME_BREAKS[i];
    if (value >= range.min && (range.max === Infinity ? true : value < range.max)) {
      return i;
    }
  }
  return 0;
};

// Calculate statistics from PDS grid data
export const calculateGridStats = (data) => {
  if (!data || data.length === 0) {
    return {
      totalCells: 0,
      totalVisits: 0,
      avgTime: 0,
      maxTime: 0,
      gridCells: 0,
      avgSpeed: 0
    };
  }
  
  const totalVisits = data.reduce((sum, d) => sum + (d.totalVisits || d.total_visits || 0), 0);
  const avgTime = data.reduce((sum, d) => sum + (d.avgTimeHours || d.avg_time_hours || 0), 0) / data.length;
  const maxTime = Math.max(...data.map(d => d.avgTimeHours || d.avg_time_hours || 0));
  const avgSpeed = data.reduce((sum, d) => sum + (d.avgSpeed || d.avg_speed || 0), 0) / data.length;
  
  return {
    totalCells: data.length,
    totalVisits: totalVisits,
    avgTime: avgTime,
    maxTime: maxTime,
    gridCells: data.length,
    avgSpeed: avgSpeed
  };
}; 