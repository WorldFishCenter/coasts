import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactMapGL, { Source, Layer, NavigationControl, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Header from './Header';
import SelectionPanel from './panels/SelectionPanel';
import AnalysisPanel from './panels/AnalysisPanel';
import ChartsPanel from './panels/ChartsPanel';
import { useMapData } from '../hooks/useMapData';
import { getMapStyles, containerStyles, getDistrictLayer, getHoverLayer } from '../styles/mapStyles';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Shared constants for legend and layer filtering
const GRADES = [0, 100, 300, 500, 700, 900];
const COLORS = ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'];

const Legend = ({ isDarkTheme, onToggleLayer, visibleRanges }) => {
  return (
    <div style={{
      padding: '10px',
      backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: '4px',
      color: isDarkTheme ? '#fff' : '#000'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Fishery Catch (tons)</h4>
      {GRADES.map((grade, i) => {
        const isVisible = visibleRanges[i];
        return (
          <div 
            key={i} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '5px',
              cursor: 'pointer',
              opacity: isVisible ? 1 : 0.5,
              transition: 'opacity 0.2s ease'
            }}
            onClick={() => onToggleLayer(i)}
          >
            <span style={{
              width: '20px',
              height: '20px',
              backgroundColor: COLORS[i],
              display: 'inline-block',
              marginRight: '8px',
              border: `1px solid ${isDarkTheme ? '#fff' : '#000'}`
            }}></span>
            <span>{grade}{i < GRADES.length - 1 ? ` - ${GRADES[i + 1]}` : '+'}</span>
          </div>
        );
      })}
    </div>
  );
};

const CustomPopup = ({ info, isDarkTheme, onClose }) => (
  <Popup
    longitude={info.longitude}
    latitude={info.latitude}
    closeButton={false}
    closeOnClick={false}
    onClose={onClose}
    anchor="bottom"
    maxWidth="300px"
    className={`custom-popup ${isDarkTheme ? 'dark' : 'light'}`}
    style={{
      zIndex: 2
    }}
  >
    <div style={{
      backgroundColor: isDarkTheme ? '#2c3e50' : '#ffffff',
      color: isDarkTheme ? '#ecf0f1' : '#2c3e50',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: isDarkTheme 
        ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
        : '0 4px 6px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          color: isDarkTheme ? '#bdc3c7' : '#95a5a6',
          fontSize: '18px',
          lineHeight: '18px',
          height: '24px',
          width: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.color = isDarkTheme ? '#ffffff' : '#2c3e50';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = isDarkTheme ? '#bdc3c7' : '#95a5a6';
        }}
      >
        ×
      </button>
      <h3 style={{
        margin: '0 0 8px 0',
        fontSize: '16px',
        fontWeight: '600',
        paddingRight: '20px'
      }}>
        {info.feature.properties.ADM2_PT}
      </h3>
      <div style={{
        fontSize: '14px',
        lineHeight: '1.4'
      }}>
        <div style={{
          marginBottom: '4px',
          color: isDarkTheme ? '#bdc3c7' : '#7f8c8d'
        }}>
          Province: {info.feature.properties.ADM1_PT}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{
            color: isDarkTheme ? '#bdc3c7' : '#7f8c8d'
          }}>
            Value:
          </span>
          <span style={{
            fontWeight: '500',
            color: isDarkTheme ? '#3498db' : '#2980b9'
          }}>
            {info.feature.properties.value?.toLocaleString() || 0}
          </span>
        </div>
      </div>
    </div>
  </Popup>
);

const MapComponent = () => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  
  // Panel states
  const [activePanel, setActivePanel] = useState(null);
  
  // Map states
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  
  // Analysis states
  const [coverage, setCoverage] = useState(75);
  const [radius, setRadius] = useState(30);
  const [upperPercentile, setUpperPercentile] = useState(95);
  const [opacity, setOpacity] = useState(0.7);
  
  // Viewport state
  const [viewState, setViewState] = useState({
    longitude: 40.5,
    latitude: -12.5,
    zoom: isMobile ? 8 : 9,
    bearing: 0,
    pitch: 0
  });

  // Load map data
  const { boundaries, loading, error, totalValue } = useMapData();

  // Add new state for legend layer visibility
  const [visibleRanges, setVisibleRanges] = useState(Array(6).fill(true));

  // Get container styles
  const styles = {
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
      position: 'fixed',
      top: '80px',
      left: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxHeight: 'calc(100vh - 100px)',
      zIndex: 1000,
      overflowY: 'auto'
    },
    expandedChartsContainer: {
      maxWidth: activePanel === 'charts' ? '80vw' : '300px',
      width: activePanel === 'charts' ? '80vw' : '300px',
      transition: 'all 0.3s ease-in-out'
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
    }
  };

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

  const handleExportSelection = useCallback(() => {
    const data = selectedDistricts.map(d => ({
      name: d.properties.ADM2_PT,
      value: d.properties.value,
      province: d.properties.ADM1_PT
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected-districts.json';
    a.click();
  }, [selectedDistricts]);

  const handleRemoveDistrict = useCallback((districtId) => {
    setSelectedDistricts(prev => prev.filter(d => d.properties.ADM2_PCODE !== districtId));
  }, []);

  const onHover = useCallback(event => {
    const { features } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(hoveredFeature || null);
  }, []);

  const onClick = useCallback(event => {
    const { features } = event;
    const clickedFeature = features && features[0];
    
    if (clickedFeature) {
      const districtId = clickedFeature.properties.ADM2_PCODE;
      const isSelected = selectedDistricts.some(d => d.properties.ADM2_PCODE === districtId);
      
      if (!isSelected) {
        setSelectedDistricts(prev => [...prev, clickedFeature]);
      }
      
      setPopupInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        feature: clickedFeature
      });
    } else {
      setPopupInfo(null);
    }
  }, [selectedDistricts]);

  // Add handler for toggling legend layers
  const handleToggleLayer = useCallback((index) => {
    setVisibleRanges(prev => {
      const newRanges = [...prev];
      newRanges[index] = !newRanges[index];
      return newRanges;
    });
  }, []);

  // Update district layer with visibility filters
  const districtLayer = useMemo(() => {
    const baseLayer = getDistrictLayer(selectedDistricts, isDarkTheme, opacity, coverage);
    
    // Build the color expression based on visible ranges
    const colorExpression = [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      isDarkTheme ? '#e74c3c' : '#c0392b',
      [
        'case',
        ...GRADES.map((grade, i) => {
          if (!visibleRanges[i]) return [];
          
          // For the first range (0-100)
          if (i === 0) {
            return [
              ['all', 
                ['>=', ['get', 'value'], grade],
                ['<', ['get', 'value'], GRADES[i + 1]]
              ],
              COLORS[i]
            ];
          }
          // For the last range (900+)
          else if (i === GRADES.length - 1) {
            return [
              ['>=', ['get', 'value'], grade],
              COLORS[i]
            ];
          }
          // For middle ranges
          else {
            return [
              ['all',
                ['>=', ['get', 'value'], grade],
                ['<', ['get', 'value'], GRADES[i + 1]]
              ],
              COLORS[i]
            ];
          }
        }).flat(),
        'rgba(0,0,0,0)' // default color if no range matches
      ]
    ];

    return {
      ...baseLayer,
      paint: {
        'fill-color': colorExpression,
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          0.8,  // Back to original selected districts opacity
          opacity  // Back to original non-selected districts opacity
        ]
      }
    };
  }, [selectedDistricts, isDarkTheme, opacity, coverage, visibleRanges]);

  // Get layer styles
  const hoverLayer = useMemo(() => 
    getHoverLayer(isDarkTheme, radius),
    [isDarkTheme, radius]
  );

  // Calculate selected total
  const selectedTotal = useMemo(() => 
    selectedDistricts.reduce((sum, d) => sum + (d.properties.value || 0), 0),
    [selectedDistricts]
  );

  // Update panel visibility handlers
  const handleTogglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!boundaries) return <div>No data available</div>;

  return (
    <div style={styles.container}>
      <Header 
        isDarkTheme={isDarkTheme} 
        onThemeChange={handleThemeChange}
        onToggleSelection={() => handleTogglePanel('selection')}
        onToggleAnalysis={() => handleTogglePanel('analysis')}
        onToggleCharts={() => handleTogglePanel('charts')}
      />
      
      <div style={styles.contentWrapper}>
        <ReactMapGL
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={getMapStyles(isDarkTheme)}
          mapboxAccessToken={MAPBOX_TOKEN}
          interactiveLayerIds={['districts']}
          onMouseMove={onHover}
          onClick={onClick}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          
          <Source type="geojson" data={boundaries}>
            <Layer 
              {...districtLayer} 
              beforeId="waterway-label"
            />
            {hoverInfo && (
              <Layer
                {...hoverLayer}
                filter={['==', 'ADM2_PCODE', hoverInfo.properties.ADM2_PCODE]}
                beforeId="waterway-label"
              />
            )}
          </Source>

          {popupInfo && (
            <CustomPopup
              info={popupInfo}
              isDarkTheme={isDarkTheme}
              onClose={() => setPopupInfo(null)}
            />
          )}

          <div style={styles.legend}>
            <Legend 
              isDarkTheme={isDarkTheme} 
              onToggleLayer={handleToggleLayer}
              visibleRanges={visibleRanges}
            />
          </div>
        </ReactMapGL>

        <div style={{...styles.panelsContainer, ...styles.expandedChartsContainer}}>
          <SelectionPanel
            isDarkTheme={isDarkTheme}
            showPanel={activePanel === 'selection'}
            onTogglePanel={() => handleTogglePanel('selection')}
            selectedDistricts={selectedDistricts}
            onClearSelection={() => setSelectedDistricts([])}
            selectedTotal={selectedTotal}
            totalValue={totalValue}
            onRemoveDistrict={handleRemoveDistrict}
            onExportSelection={handleExportSelection}
            isMobile={isMobile}
          />

          <AnalysisPanel
            isDarkTheme={isDarkTheme}
            showPanel={activePanel === 'analysis'}
            onTogglePanel={() => handleTogglePanel('analysis')}
            totalValue={totalValue}
            coverage={coverage}
            onCoverageChange={setCoverage}
            radius={radius}
            onRadiusChange={setRadius}
            upperPercentile={upperPercentile}
            onUpperPercentileChange={setUpperPercentile}
            opacity={opacity}
            onOpacityChange={setOpacity}
            isMobile={isMobile}
          />

          <ChartsPanel
            isDarkTheme={isDarkTheme}
            showPanel={activePanel === 'charts'}
            onTogglePanel={() => handleTogglePanel('charts')}
            selectedDistricts={selectedDistricts}
            totalValue={totalValue}
            isMobile={isMobile}
            style={{ 
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: '20px',
              justifyContent: 'space-between'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MapComponent; 