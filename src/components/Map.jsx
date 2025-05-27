import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { Map as MapGL, NavigationControl, Popup } from 'react-map-gl';
import { ColumnLayer, GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { MapView } from '@deck.gl/core';
import { Satellite, Map as MapIcon } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import Header from './Header';
import Sidebar from './Sidebar';
import { useMapData } from '../hooks/useMapData';
import { getMapStyles } from '../styles/mapStyles';
import { 
  TIME_BREAKS, 
  COLOR_RANGE, 
  GRID_LAYER_SETTINGS,
  getColorForValue,
  calculateGridStats,
  SHARED_STYLES
} from '../utils/gridLayerConfig';
import DistributionHistogram from './map/DistributionHistogram';
import { getMetricInfo, formatRegionName, formatCountryName } from '../utils/formatters';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Color palette (fixed), numeric stops will be computed dynamically per metric
// YlGnBu-8 palette from https://loading.io/color/feature/YlGnBu-8/
const COLORS = ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84'];

// Unified Legend Component that combines metric and fishing activity legends
const UnifiedLegend = ({ isDarkTheme, grades, selectedMetric, colorRange, hasGridData, visualizationMode }) => {
  const metricInfo = getMetricInfo(selectedMetric);
  
  return (
    <div style={{
      ...SHARED_STYLES.glassPanel(isDarkTheme),
      padding: '16px',
      minWidth: '220px'
    }}>
      {/* Metric Legend Section */}
      <div style={{ marginBottom: hasGridData ? '16px' : '0' }}>
        <h4 style={{
          ...SHARED_STYLES.text.subheading(isDarkTheme),
          margin: '0 0 10px 0',
          fontSize: '13px'
        }}>
          {metricInfo.label} {metricInfo.unit && `(${metricInfo.unit})`}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {grades.map((grade, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{
                width: '18px',
                height: '18px',
                backgroundColor: COLORS[i],
                display: 'inline-block',
                borderRadius: '3px',
                border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
              }} />
              <span style={{
                ...SHARED_STYLES.text.body(isDarkTheme),
                fontSize: '12px'
              }}>
                {grade.toFixed(1)}{i < grades.length - 1 ? ` - ${grades[i + 1].toFixed(1)}` : '+'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fishing Activity Legend Section */}
      {hasGridData && (
        <>
          <div style={{
            borderTop: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            marginBottom: '12px'
          }} />
          <div>
            <h4 style={{
              ...SHARED_STYLES.text.subheading(isDarkTheme),
              margin: '0 0 10px 0',
              fontSize: '13px'
            }}>
              Fishing Activity {visualizationMode === 'heatmap' ? '(Heatmap)' : '(Hours)'}
            </h4>
            {visualizationMode === 'column' ? (
              // Show time ranges for column view
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {TIME_BREAKS.map((range, index) => {
                  const timeValue = range.min + (range.max === Infinity ? 8 : range.max - range.min) / 2;
                  const normalizedValue = Math.min(timeValue / 12, 1);
                  const opacity = 0.3 + (normalizedValue * 0.6);
                  
                  return (
                    <div 
                      key={index}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{
                        width: '18px',
                        height: '18px',
                        backgroundColor: `rgba(${colorRange[index].join(',')}, ${opacity})`,
                        display: 'inline-block',
                        borderRadius: '3px',
                        border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
                      }} />
                      <span style={{
                        ...SHARED_STYLES.text.body(isDarkTheme),
                        fontSize: '12px'
                      }}>
                        {range.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show heatmap gradient for heatmap view
              <div>
                <div style={{
                  height: '20px',
                  background: `linear-gradient(to right, 
                    rgba(254, 235, 226, 0.1), 
                    rgba(254, 235, 226, 0.5),
                    rgba(252, 197, 192, 0.7),
                    rgba(250, 159, 181, 0.8),
                    rgba(247, 104, 161, 0.9),
                    rgba(221, 52, 151, 1),
                    rgba(174, 1, 126, 1)
                  )`,
                  borderRadius: '4px',
                  marginBottom: '8px',
                  border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
                }} />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  ...SHARED_STYLES.text.muted(isDarkTheme),
                  fontSize: '11px'
                }}>
                  <span>Low Activity</span>
                  <span>High Activity</span>
                </div>
                <div style={{
                  textAlign: 'center',
                  marginTop: '4px',
                  ...SHARED_STYLES.text.muted(isDarkTheme),
                  fontSize: '10px',
                  fontStyle: 'italic'
                }}>
                  Intensity based on fishing effort (hours)
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Pre-filter and transform PDS data at module level (like reference does)
let FILTERED_PDS_DATA = [];

const MapComponent = () => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  
  // Satellite mode state
  const [isSatellite, setIsSatellite] = useState(true);
  
  // Panel states
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'charts' | 'selection'
  
  // Map states
  const [hoverInfo, setHoverInfo] = useState(null);
  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState(null);
  
  // Analysis states
  const [opacity] = useState(0.9); // Fixed at 90% opacity
  
  // Force update state to trigger re-renders when PDS data loads
  const [pdsDataLoaded, setPdsDataLoaded] = useState(false);
  
  // Viewport state - only used for updates, not initial
  const [viewState, setViewState] = useState({
    longitude: 39.0,
    latitude: -5.5,
    zoom: 7.2,
    pitch: 40,
    bearing: 0
  });

  // Load map data including PDS grids
  const { boundaries, pdsGridsData, timeSeriesData, loading, error, totalValue } = useMapData();

  // Add sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // Add selection state
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedTotal, setSelectedTotal] = useState(0);

  // Add comparison and filter states
  const [selectedRegionsForComparison, setSelectedRegionsForComparison] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);

  // Add metric and time range state
  const [selectedMetric, setSelectedMetric] = useState('mean_cpue');
  const [timeRange, setTimeRange] = useState([
    new Date('2023-01-01').getTime(),
    new Date('2025-12-31').getTime()
  ]);

  // Add PDS grid layer visibility state - REMOVED isPdsGridVisible as it's no longer needed
  const [selectedRanges, setSelectedRanges] = useState(TIME_BREAKS);

  // Add selected region state for histogram
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Time range constants
  const minDate = new Date('2023-01-01').getTime();
  const maxDate = new Date('2025-12-31').getTime();

  // Ref for Map instance
  const mapRef = useRef(null);
  const deckRef = useRef(null);

  // New state for visualization mode
  const [visualizationMode, setVisualizationMode] = useState('column');

  // Pre-process PDS data once when it loads (like reference)
  useEffect(() => {
    if (pdsGridsData && Array.isArray(pdsGridsData)) {
      FILTERED_PDS_DATA = pdsGridsData
        .filter(d => !d.type?.includes('metadata'))
        .map(d => ({
          position: [parseFloat(d.lng_grid_1km), parseFloat(d.lat_grid_1km)],
          avgTimeHours: parseFloat(d.avg_time_hours) || 0,
          totalVisits: parseInt(d.total_visits) || 0,
          avgSpeed: parseFloat(d.avg_speed) || 0,
          originalCells: parseInt(d.original_cells) || 0
        }))
        .filter(d => 
          !isNaN(d.position[0]) && 
          !isNaN(d.position[1]) &&
          isFinite(d.position[0]) &&
          isFinite(d.position[1])
        );
      console.log('Pre-filtered PDS data:', FILTERED_PDS_DATA.length);
      // Force update to trigger re-render
      setPdsDataLoaded(true);
    }
  }, [pdsGridsData]);

  // Update viewport when mobile state changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Adjust pitch when switching visualization modes
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      pitch: visualizationMode === 'heatmap' ? 0 : 40,
      transitionDuration: 1000
    }));
  }, [visualizationMode]);

  // Callbacks
  const handleThemeChange = useCallback((isDark) => {
    setIsDarkTheme(isDark);
  }, []);

  // Handle view state change
  const onViewStateChange = useCallback(({ viewState }) => {
    setViewState(viewState);
  }, []);

  // Simplified hover handler for highlighting
  const onHover = useCallback((info) => {
    if (info.object && info.layer.id === 'wio-regions') {
      setHoverInfo(info.object);
      setHoveredFeatureIndex(info.index);
    } else {
      setHoverInfo(null);
      setHoveredFeatureIndex(null);
    }
  }, []);

  // Handle range toggle for PDS grids
  const handleRangeToggle = useCallback((range) => {
    setSelectedRanges(current => {
      const isSelected = current.some(r => r.min === range.min && r.max === range.max);
      if (isSelected) {
        return current.length === 1 ? current : 
          current.filter(r => r.min !== range.min || r.max !== range.max);
      }
      return [...current, range];
    });
  }, []);

  // Handle country filter toggle
  const handleCountryToggle = useCallback((country) => {
    setSelectedCountries(prev => {
      const isSelected = prev.includes(country);
      if (isSelected) {
        return prev.filter(c => c !== country);
      }
      return [...prev, country];
    });
  }, []);

  // Handle region comparison
  const handleRegionSelect = useCallback((region) => {
    setSelectedRegionsForComparison(prev => {
      const exists = prev.some(r => 
        r.properties.ADM2_PCODE === region.properties.ADM2_PCODE
      );
      if (exists) return prev;
      return [...prev, region];
    });
  }, []);

  const handleRegionRemove = useCallback((region) => {
    setSelectedRegionsForComparison(prev => 
      prev.filter(r => r.properties.ADM2_PCODE !== region.properties.ADM2_PCODE)
    );
  }, []);

  // Filter boundaries by selected countries
  const filteredBoundaries = useMemo(() => {
    if (!boundaries || selectedCountries.length === 0) return boundaries;
    
    return {
      ...boundaries,
      features: boundaries.features.filter(f => 
        selectedCountries.includes(f.properties.country)
      )
    };
  }, [boundaries, selectedCountries]);

  // Transform PDS grid data - MATCH REFERENCE EXACTLY
  const transformedPdsData = useMemo(() => {
    if (!FILTERED_PDS_DATA || !Array.isArray(FILTERED_PDS_DATA)) {
      console.log('No filtered PDS data available');
      return [];
    }
    
    const filtered = FILTERED_PDS_DATA.filter(d => 
      selectedRanges.some(range => 
        d.avgTimeHours >= range.min && (
          range.max === Infinity ? true : d.avgTimeHours < range.max
        )
      )
    );
    console.log('Transformed PDS data length:', filtered.length);
    console.log('Sample data:', filtered[0]);
    return filtered || [];
  }, [selectedRanges, pdsDataLoaded]);

  // Compute dynamic grades & color stops for current metric
  const metricStats = useMemo(() => {
    if (!boundaries || !boundaries.features) {
      return { grades: [0,1,2,3,4,5,6,7], stops: Array.from({length: 8}, (_, i) => [i, COLORS[i]]).flat() };
    }
    const values = boundaries.features.map(f => Number(f.properties[selectedMetric])).filter(v => !Number.isNaN(v));
    if (values.length === 0) {
      return { grades: [0,1,2,3,4,5,6,7], stops: Array.from({length: 8}, (_, i) => [i, COLORS[i]]).flat() };
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / (COLORS.length - 1 || 1);
    const grades = COLORS.map((_, idx) => min + idx * step);
    const stops = grades.flatMap((g, idx) => [g, COLORS[idx]]);
    return { grades, stops };
  }, [boundaries, selectedMetric]);

  // Tooltip for PDS grid
  const getTooltip = useCallback(({object, layer}) => {
    if (!object) return null;

    // Handle GeoJsonLayer (choropleth) tooltips
    if (layer.id === 'wio-regions') {
      const props = object.properties;
      const metricValue = props[selectedMetric];
      const metricInfo = getMetricInfo(selectedMetric);
      
      // Get the color for this value (same logic as in the layer)
      let backgroundColor = 'rgba(200, 200, 200, 0.95)'; // Default gray for NA
      let textColor = '#000000';
      
      if (metricValue !== null && metricValue !== undefined && !isNaN(metricValue)) {
        // Find which grade this value falls into
        const { grades } = metricStats;
        let colorIndex = 0;
        for (let i = 0; i < grades.length - 1; i++) {
          if (metricValue >= grades[i] && metricValue < grades[i + 1]) {
            colorIndex = i;
            break;
          } else if (metricValue >= grades[grades.length - 1]) {
            colorIndex = grades.length - 1;
          }
        }
        
        // Convert hex color to RGB
        const hexColor = COLORS[colorIndex];
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        backgroundColor = `rgba(${r}, ${g}, ${b}, 0.95)`;
        
        // Use white text for darker colors (last 3 colors in YlGnBu-8)
        textColor = colorIndex > 4 ? '#ffffff' : '#000000';
      }
      
      return {
        html: `
          <div style="padding: 8px">
            <div style="font-weight: bold; margin-bottom: 4px">${formatRegionName(props)}</div>
            <div>Country: ${formatCountryName(props.country)}</div>
            <div>${metricInfo.label}: ${metricInfo.format(metricValue)}</div>
          </div>
        `,
        style: {
          backgroundColor,
          color: textColor,
          fontSize: '12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }
      };
    }

    // Handle ColumnLayer (PDS grid) tooltips
    if (layer.id === 'pds-grid-column-layer' || layer.id === 'pds-grid-heatmap-layer') {
      // For heatmap, we still have access to the data point
      const avgTime = object.avgTimeHours;
      const totalVisits = object.totalVisits;
      
      // Determine appropriate styling based on visualization mode
      let backgroundColor;
      let textColor;
      
      if (visualizationMode === 'column') {
        const breakIndex = TIME_BREAKS.findIndex(range => 
          avgTime >= range.min && (range.max === Infinity ? true : avgTime < range.max)
        );
        const cellColor = COLOR_RANGE[breakIndex >= 0 ? breakIndex : 0];
        backgroundColor = `rgba(${cellColor.join(',')}, 0.95)`;
        textColor = breakIndex > 2 ? '#ffffff' : '#000000';
      } else {
        // For heatmap, use a consistent style
        backgroundColor = isDarkTheme ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        textColor = isDarkTheme ? '#ffffff' : '#000000';
      }
      
      return {
        html: `
          <div style="padding: 8px">
            <div><strong>Fishing Activity</strong></div>
            <div>Average time: ${avgTime.toFixed(2)} hours</div>
            <div>Total visits: ${totalVisits}</div>
            <div style="font-size: 11px; margin-top: 4px; opacity: 0.8">
              Location: ${object.position[1].toFixed(3)}°, ${object.position[0].toFixed(3)}°
            </div>
          </div>
        `,
        style: {
          backgroundColor,
          color: textColor,
          fontSize: '12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }
      };
    }

    return null;
  }, [selectedMetric, isDarkTheme, metricStats, visualizationMode]);

  // Create layers - Use ColumnLayer for pre-aggregated data
  const layers = useMemo(() => {
    const allLayers = [];

    // Add choropleth layer with filtered boundaries
    if (filteredBoundaries) {
      // Function to get color based on metric value
      const getColorForFeature = (feature) => {
        const value = feature.properties[selectedMetric];
        if (value === null || value === undefined || isNaN(value)) return [200, 200, 200, 255 * opacity];
        
        // Find which grade this value falls into
        const { grades } = metricStats;
        let colorIndex = 0;
        for (let i = 0; i < grades.length - 1; i++) {
          if (value >= grades[i] && value < grades[i + 1]) {
            colorIndex = i;
            break;
          } else if (value >= grades[grades.length - 1]) {
            colorIndex = grades.length - 1;
          }
        }
        
        // Convert hex color to RGB
        const hexColor = COLORS[colorIndex];
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        return [r, g, b, 255 * (isSatellite ? opacity * 1.2 : opacity)];
      };

      allLayers.push(
        new GeoJsonLayer({
          id: 'wio-regions',
          data: filteredBoundaries,
          pickable: true,
          stroked: true,
          filled: true,
          getFillColor: getColorForFeature,
          getLineColor: (d, {index}) => {
            const isHovered = hoveredFeatureIndex === index;
            if (isHovered) {
              // Use blue highlight for better visibility in both modes
              return isDarkTheme ? [100, 180, 255, 255] : [0, 100, 200, 255]; // Light blue for dark mode, darker blue for light mode
            }
            return isSatellite ? [255, 255, 255, 230] : (isDarkTheme ? [255, 255, 255, 200] : [0, 0, 0, 200]);
          },
          getLineWidth: (d, {index}) => {
            const isHovered = hoveredFeatureIndex === index;
            return isHovered ? 4 : (isSatellite ? 2 : 1);
          },
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 1,
          lineWidthMaxPixels: 10,
          updateTriggers: {
            getFillColor: [selectedMetric, metricStats, opacity, isSatellite],
            getLineColor: [isSatellite, isDarkTheme, hoveredFeatureIndex],
            getLineWidth: [isSatellite, hoveredFeatureIndex]
          }
        })
      );
    }

    // Add PDS grid columns if data exists
    if (transformedPdsData.length > 0) {
      if (visualizationMode === 'column') {
        // Existing ColumnLayer
        allLayers.push(
          new ColumnLayer({
            id: 'pds-grid-column-layer',
            data: transformedPdsData,
            pickable: true,
            // Position
            getPosition: d => d.position,
            // Size - 1km = 1000m, but we need to adjust for visualization
            radius: 500, // Half of cell size for better visualization
            // Elevation
            elevationScale: 2500, // or 1000, experiment for best effect
            getElevation: d => d.avgTimeHours,
            // Color with variable opacity based on effort
            getFillColor: d => {
              const colorIndex = getColorForValue(d.avgTimeHours);
              const baseColor = COLOR_RANGE[colorIndex];
              // Calculate opacity: minimum 0.3 (30%) for lowest values, maximum 0.9 (90%) for highest
              // Normalize avgTimeHours to 0-1 range (assuming max ~12 hours)
              const normalizedValue = Math.min(d.avgTimeHours / 12, 1);
              const opacity = 0.3 + (normalizedValue * 0.6); // Range from 0.3 to 0.9
              return [...baseColor, 255 * opacity];
            },
            // Style
            opacity: 1, // Set to 1 since we're controlling opacity in getFillColor
            // Optimization
            material: {
              ambient: 0.64,
              diffuse: 0.6,
              shininess: 32,
              specularColor: [51, 51, 51]
            },
            updateTriggers: {
              getFillColor: [selectedRanges],
              opacity: [] // Removed isPdsGridVisible from update triggers
            }
          })
        );
      } else {
        // New HeatmapLayer
        allLayers.push(
          new HeatmapLayer({
            id: 'pds-grid-heatmap-layer',
            data: transformedPdsData || [], // Ensure data is never undefined
            pickable: true,
            getPosition: d => d.position,
            getWeight: d => {
              // Add validation to prevent errors
              if (!d || typeof d.avgTimeHours !== 'number') return 0;
              return Math.max(0, d.avgTimeHours); // Ensure non-negative weights
            },
            radiusPixels: 40, // Slightly larger radius for better blending
            intensity: 1.2, // Slightly higher intensity
            threshold: 0.03,
            colorRange: [
              [255, 255, 255, 0],
              [254, 235, 226, 255],  // Lightest color from COLOR_RANGE
              [252, 197, 192, 255],
              [250, 159, 181, 255],
              [247, 104, 161, 255],
              [221, 52, 151, 255],
              [174, 1, 126, 255]     // Darkest color from COLOR_RANGE
            ],
            aggregation: 'SUM',
            weightsTextureSize: 1024, // Performance optimization for large datasets
            updateTriggers: {
              getWeight: [selectedRanges],
              data: [transformedPdsData] // Add data to update triggers
            }
          })
        );
      }
    }

    return allLayers;
  }, [transformedPdsData, selectedRanges, filteredBoundaries, selectedMetric, metricStats, opacity, isSatellite, isDarkTheme, hoveredFeatureIndex, visualizationMode]);

  // Add satellite toggle callback
  const handleMapStyleToggle = useCallback(() => {
    setIsSatellite(prev => !prev);
  }, []);

  // Get map style based on satellite mode and theme
  const getMapStyle = useCallback(() => {
    if (isSatellite) {
      return "mapbox://styles/mapbox/satellite-v9";
    }
    return getMapStyles(isDarkTheme);
  }, [isSatellite, isDarkTheme]);

  // Handle region click for histogram and comparison
  const handleRegionClick = useCallback((info) => {
    if (info.object && info.layer.id === 'wio-regions') {
      setSelectedRegion(info.object);
      handleRegionSelect(info.object);
    }
  }, [handleRegionSelect]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!boundaries) return <div>No data available</div>;

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100%',
      backgroundColor: isDarkTheme ? '#1a1a1a' : '#f8f9fa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header 
        isDarkTheme={isDarkTheme} 
        onThemeChange={handleThemeChange}
      />
      
      <div style={{
        position: 'relative',
        flexGrow: 1,
        marginTop: '64px',
        display: 'flex',
        height: 'calc(100vh - 64px)',
        minHeight: 0
      }}>
        {/* Sidebar */}
        <Sidebar
          isDarkTheme={isDarkTheme}
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          boundaries={boundaries}
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
          // Grid data props
          transformedPdsData={transformedPdsData}
          selectedRanges={selectedRanges}
          onRangeToggle={handleRangeToggle}
          // Comparison props
          selectedRegions={selectedRegionsForComparison}
          onRegionSelect={handleRegionSelect}
          onRegionRemove={handleRegionRemove}
          // Filter props
          selectedCountries={selectedCountries}
          onCountryToggle={handleCountryToggle}
          // Visualization mode props
          visualizationMode={visualizationMode}
          onVisualizationModeChange={setVisualizationMode}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%'
          }}
        />

        {/* Map Container - Best practice: DeckGL as parent with MapGL as child */}
        <div style={{
          flexGrow: 1,
          position: 'relative',
          transition: 'margin-left 0.3s ease'
        }}>
          <DeckGL
            ref={deckRef}
            viewState={viewState}
            onViewStateChange={onViewStateChange}
            controller={true}
            layers={layers}
            getTooltip={getTooltip}
            onHover={onHover}
            getCursor={({isDragging, isHovering}) => 
              isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
            }
            onClick={handleRegionClick}
          >
            <MapGL
              ref={mapRef}
              mapStyle={getMapStyle()}
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            >
              {/* <NavigationControl position="top-right" /> Removed as requested */}
            </MapGL>
          </DeckGL>

          {/* Unified Legend - positioned bottom-right */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            zIndex: 1000
          }}>
            <UnifiedLegend 
              isDarkTheme={isDarkTheme}
              grades={metricStats.grades}
              selectedMetric={selectedMetric}
              colorRange={COLOR_RANGE}
              hasGridData={transformedPdsData.length > 0}
              visualizationMode={visualizationMode}
            />
          </div>

          {/* Map Style Toggle Button */}
          <button
            onClick={handleMapStyleToggle}
            title={isSatellite ? 'Switch to standard view' : 'Switch to satellite view'}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              width: '48px',
              height: '48px',
              padding: '8px',
              backgroundColor: isDarkTheme ? 'rgba(28, 28, 28, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              boxShadow: isDarkTheme 
                ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)' 
                : '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)',
              border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              cursor: 'pointer',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease-in-out',
              color: isDarkTheme ? '#ffffff' : '#000000'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.backgroundColor = isDarkTheme 
                ? 'rgba(31, 41, 55, 0.9)' 
                : 'rgba(255, 255, 255, 0.95)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = isDarkTheme 
                ? 'rgba(28, 28, 28, 0.9)' 
                : 'rgba(255, 255, 255, 0.9)';
            }}
          >
            {isSatellite ? (
              <MapIcon size={28} strokeWidth={1.5} />
            ) : (
              <Satellite size={28} strokeWidth={1.5} />
            )}
          </button>

          {/* Distribution Histogram - shows when region is selected */}
          {selectedRegion && (
            <DistributionHistogram
              isDarkTheme={isDarkTheme}
              boundaries={boundaries}
              selectedMetric={selectedMetric}
              selectedRegion={selectedRegion}
              timeSeriesData={timeSeriesData}
              onClose={() => setSelectedRegion(null)}
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1001
              }}
            />
          )}
        </div>

        {/* Sidebar Toggle Button
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            position: 'absolute',
            left: isSidebarOpen ? '400px' : '0',
            top: '20px',
            zIndex: 1000,
            padding: '8px 12px',
            backgroundColor: isDarkTheme ? 'rgba(28, 28, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: isDarkTheme ? '#fff' : '#000',
            transition: 'left 0.3s ease',
            boxShadow: isDarkTheme ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {isSidebarOpen ? '←' : '→'}
        </button> */}
      </div>
    </div>
  );
};

export default MapComponent; 