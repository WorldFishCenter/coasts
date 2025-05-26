import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { Map as MapGL, NavigationControl, Popup, Source, Layer } from 'react-map-gl';
import { ColumnLayer } from '@deck.gl/layers';
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
  calculateGridStats
} from '../utils/gridLayerConfig';
import GridInfoPanel from './map/GridInfoPanel';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Color palette (fixed), numeric stops will be computed dynamically per metric
const COLORS = ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'];

// Legend now receives dynamic grade thresholds
const Legend = ({ isDarkTheme, grades }) => {
  return (
    <div style={{
      padding: '10px',
      backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: '4px',
      color: isDarkTheme ? '#fff' : '#000'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Metric value</h4>
      {grades.map((grade, i) => {
        return (
          <div 
            key={i} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '5px'
            }}
          >
            <span style={{
              width: '20px',
              height: '20px',
              backgroundColor: COLORS[i],
              display: 'inline-block',
              marginRight: '8px',
              border: `1px solid ${isDarkTheme ? '#fff' : '#000'}`
            }}></span>
            <span>{grade.toFixed(0)}{i < grades.length - 1 ? ` - ${grades[i + 1].toFixed(0)}` : '+'}</span>
          </div>
        );
      })}
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
  const [isSatellite, setIsSatellite] = useState(false);
  
  // Panel states
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'charts' | 'selection'
  
  // Map states
  const [hoverInfo, setHoverInfo] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  
  // Analysis states
  const [opacity, setOpacity] = useState(0.7);
  
  // Force update state to trigger re-renders when PDS data loads
  const [pdsDataLoaded, setPdsDataLoaded] = useState(false);
  
  // Viewport state - only used for updates, not initial
  const [viewState, setViewState] = useState({
    longitude: 40.0,
    latitude: -8.0,
    zoom: isMobile ? 5 : 7,
    bearing: 0,
    pitch: 45
  });

  // Load map data including PDS grids
  const { boundaries, pdsGridsData, loading, error, totalValue } = useMapData();

  // Add sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Add selection state
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedTotal, setSelectedTotal] = useState(0);

  // Add metric and time range state
  const [selectedMetric, setSelectedMetric] = useState('mean_cpue');
  const [timeRange, setTimeRange] = useState([
    new Date('2023-01-01').getTime(),
    new Date('2025-12-31').getTime()
  ]);

  // Add PDS grid layer visibility state - REMOVED isPdsGridVisible as it's no longer needed
  const [selectedRanges, setSelectedRanges] = useState(TIME_BREAKS);

  // Time range constants
  const minDate = new Date('2023-01-01').getTime();
  const maxDate = new Date('2025-12-31').getTime();

  // Ref for Map instance
  const mapRef = useRef(null);
  const deckRef = useRef(null);

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

  // Callbacks
  const handleThemeChange = useCallback((isDark) => {
    setIsDarkTheme(isDark);
  }, []);

  // Handle view state change
  const onViewStateChange = useCallback(({ viewState }) => {
    setViewState(viewState);
  }, []);

  // Handle hover - simplified for react-map-gl integration
  const onHover = useCallback((event) => {
    if (mapRef.current && event) {
      const features = mapRef.current.queryRenderedFeatures(event.point, {
        layers: ['wio-regions']
      });
      setHoverInfo(features && features[0]);
    }
  }, []);

  // Handle click - simplified for react-map-gl integration
  const onClick = useCallback((event) => {
    if (mapRef.current && event) {
      const features = mapRef.current.queryRenderedFeatures(event.point, {
        layers: ['wio-regions']
      });
      const clickedFeature = features && features[0];
      
      if (clickedFeature) {
        setPopupInfo({
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
          feature: clickedFeature
        });
      } else {
        setPopupInfo(null);
      }
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

  // Transform PDS grid data - MATCH REFERENCE EXACTLY
  const transformedPdsData = useMemo(() => {
    const filtered = FILTERED_PDS_DATA.filter(d => 
      selectedRanges.some(range => 
        d.avgTimeHours >= range.min && (
          range.max === Infinity ? true : d.avgTimeHours < range.max
        )
      )
    );
    console.log('Transformed PDS data length:', filtered.length);
    console.log('Sample data:', filtered[0]);
    return filtered;
  }, [selectedRanges, pdsDataLoaded]);

  // Tooltip for PDS grid
  const getTooltip = useCallback(({object}) => {
    if (!object) return null;

    const avgTime = object.avgTimeHours;
    const breakIndex = TIME_BREAKS.findIndex(range => 
      avgTime >= range.min && (range.max === Infinity ? true : avgTime < range.max)
    );
    const cellColor = COLOR_RANGE[breakIndex >= 0 ? breakIndex : 0];
    const totalVisits = object.totalVisits;
    
    return {
      html: `
        <div style="padding: 8px">
          <div><strong>Time spent</strong></div>
          <div>Average time: ${avgTime.toFixed(2)} hours</div>
          <div><strong>Activity</strong></div>
          <div>Total visits: ${totalVisits}</div>
        </div>
      `,
      style: {
        backgroundColor: `rgba(${cellColor.join(',')}, 0.95)`,
        color: breakIndex > COLOR_RANGE.length / 2 ? '#ffffff' : '#000000',
        fontSize: '12px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }
    };
  }, []);

  // Create layers - Use ColumnLayer for pre-aggregated data
  const layers = useMemo(() => {
    if (transformedPdsData.length === 0) return [];

    return [
      new ColumnLayer({
        id: 'pds-grid-layer',
        data: transformedPdsData,
        pickable: true,
        // Position
        getPosition: d => d.position,
        // Size - 1km = 1000m, but we need to adjust for visualization
        radius: 500, // Half of cell size for better visualization
        // Elevation
        elevationScale: 2500, // or 1000, experiment for best effect
        getElevation: d => d.avgTimeHours,
        // Color
        getFillColor: d => {
          const colorIndex = getColorForValue(d.avgTimeHours);
          return COLOR_RANGE[colorIndex];
        },
        // Style
        opacity: 0.8, // Always visible with 0.8 opacity
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
    ];
  }, [transformedPdsData, selectedRanges]);

  // Compute dynamic grades & color stops for current metric
  const metricStats = useMemo(() => {
    if (!boundaries || !boundaries.features) {
      return { grades: [0,1,2,3,4,5], stops: [0,COLORS[0],1,COLORS[1],2,COLORS[2],3,COLORS[3],4,COLORS[4],5,COLORS[5]] };
    }
    const values = boundaries.features.map(f => Number(f.properties[selectedMetric])).filter(v => !Number.isNaN(v));
    if (values.length === 0) {
      return { grades: [0,1,2,3,4,5], stops: [0,COLORS[0],1,COLORS[1],2,COLORS[2],3,COLORS[3],4,COLORS[4],5,COLORS[5]] };
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / (COLORS.length - 1 || 1);
    const grades = COLORS.map((_, idx) => min + idx * step);
    const stops = grades.flatMap((g, idx) => [g, COLORS[idx]]);
    return { grades, stops };
  }, [boundaries, selectedMetric]);

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
        marginTop: '60px',
        display: 'flex',
        height: 'calc(100vh - 60px)',
        minHeight: 0
      }}>
        {/* Sidebar */}
        <Sidebar
          isDarkTheme={isDarkTheme}
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          // Analysis props
          totalValue={totalValue}
          opacity={opacity}
          onOpacityChange={setOpacity}
          // Selection props
          selectedDistricts={selectedDistricts}
          onClearSelection={() => {
            setSelectedDistricts([]);
            setSelectedTotal(0);
          }}
          selectedTotal={selectedTotal}
          onRemoveDistrict={(districtCode) => {
            setSelectedDistricts(prev => {
              const newDistricts = prev.filter(d => d.properties.ADM2_PCODE !== districtCode);
              const newTotal = newDistricts.reduce((sum, d) => sum + (d.properties.value || 0), 0);
              setSelectedTotal(newTotal);
              return newDistricts;
            });
          }}
          onExportSelection={() => {
            // Implement export functionality
            console.log('Exporting selection:', selectedDistricts);
          }}
          // Charts props
          boundaries={boundaries}
          // New props
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          minDate={minDate}
          maxDate={maxDate}
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
            getCursor={({isDragging, isHovering}) => 
              isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
            }
          >
            <MapGL
              ref={mapRef}
              mapStyle={getMapStyle()}
              mapboxAccessToken={MAPBOX_TOKEN}
              onMouseMove={onHover}
              onClick={onClick}
              interactiveLayerIds={['wio-regions']}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            >
              <NavigationControl position="top-right" />
              
              {/* WIO regions layer */}
              {boundaries && (
                <Source id="geojson-source" type="geojson" data={boundaries}>
                  <Layer 
                    id="wio-regions"
                    type="fill"
                    paint={{
                      'fill-color': ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', selectedMetric]], metricStats.grades[0]], ...metricStats.stops],
                      'fill-opacity': isSatellite ? opacity * 1.2 : opacity // Increase opacity in satellite mode for better visibility
                    }}
                  />
                  <Layer
                    id="wio-regions-outline"
                    type="line"
                    paint={{
                      'line-color': isSatellite ? '#ffffff' : (isDarkTheme ? '#ffffff' : '#000000'),
                      'line-width': isSatellite ? 1.5 : 1,
                      'line-opacity': isSatellite ? 0.9 : 0.8
                    }}
                  />
                  {hoverInfo && (
                    <Layer
                      id="wio-hover"
                      type="fill"
                      paint={{
                        'fill-color': '#ff7e5f',
                        'fill-opacity': isSatellite ? 0.9 : 0.8
                      }}
                      filter={['==', ['get', 'region'], hoverInfo.properties.region]}
                    />
                  )}
                </Source>
              )}

              {popupInfo && (
                <Popup
                  longitude={popupInfo.longitude}
                  latitude={popupInfo.latitude}
                  closeButton={true}
                  closeOnClick={false}
                  onClose={() => setPopupInfo(null)}
                  anchor="bottom"
                  className={`custom-popup ${isDarkTheme ? 'dark' : 'light'}`}
                >
                  <div style={{
                    backgroundColor: isDarkTheme ? '#2c3e50' : '#ffffff',
                    color: isDarkTheme ? '#ecf0f1' : '#2c3e50',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    boxShadow: isDarkTheme 
                      ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
                      : '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                      {popupInfo.feature.properties.region}
                    </h3>
                    <div style={{ fontSize: '14px' }}>
                      <div>Country: {popupInfo.feature.properties.country}</div>
                      <div>Date: {popupInfo.feature.properties.date}</div>
                      <div>Mean CPUE: {popupInfo.feature.properties.mean_cpue?.toFixed(2)} kg/hour</div>
                      <div>Mean CPUA: {popupInfo.feature.properties.mean_cpua?.toFixed(2)} kg/km²</div>
                      <div>Mean RPUE: ${popupInfo.feature.properties.mean_rpue?.toFixed(2)}/hour</div>
                      <div>Mean RPUA: ${popupInfo.feature.properties.mean_rpua?.toFixed(2)}/km²</div>
                      <div>Mean Price: ${popupInfo.feature.properties.mean_price_kg?.toFixed(2)}/kg</div>
                    </div>
                  </div>
                </Popup>
              )}

              {/* Legend - always visible */}
              <div style={{
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
              }}>
                <Legend 
                  isDarkTheme={isDarkTheme}
                  grades={metricStats.grades}
                />
              </div>
            </MapGL>
          </DeckGL>

          {/* PDS Grid Info Panel - always visible */}
          <GridInfoPanel
            isDarkTheme={isDarkTheme}
            data={transformedPdsData}
            colorRange={COLOR_RANGE}
            selectedRanges={selectedRanges}
            onRangeToggle={handleRangeToggle}
          />

          {/* Map Style Toggle Button */}
          <button
            onClick={handleMapStyleToggle}
            title={isSatellite ? 'Switch to standard view' : 'Switch to satellite view'}
            style={{
              position: 'absolute',
              top: '80px',
              right: '20px',
              width: '40px',
              height: '40px',
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
              <MapIcon size={20} strokeWidth={1.5} />
            ) : (
              <Satellite size={20} strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            position: 'absolute',
            left: isSidebarOpen ? '350px' : '0',
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
        </button>
      </div>
    </div>
  );
};

export default MapComponent; 