import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactMapGL, { Source, Layer, NavigationControl, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Header from './Header';
import SelectionPanel from './panels/SelectionPanel';
import AnalysisPanel from './panels/AnalysisPanel';
import ChartsPanel from './panels/ChartsPanel';
import { useMapData } from '../hooks/useMapData';
import { getMapStyles } from '../styles/mapStyles';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Shared constants for legend and layer filtering
const GRADES = [0, 50, 100, 150, 200, 250];
const COLORS = ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'];

const Legend = ({ isDarkTheme, onToggleLayer, visibleRanges }) => {
  return (
    <div style={{
      padding: '10px',
      backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: '4px',
      color: isDarkTheme ? '#fff' : '#000'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Mean CPUE (kg/hour)</h4>
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

const MapComponent = () => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  
  // Panel states
  const [activePanel, setActivePanel] = useState(null);
  
  // Map states
  const [hoverInfo, setHoverInfo] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  
  // Analysis states
  const [opacity, setOpacity] = useState(0.7);
  
  // Viewport state
  const [viewState, setViewState] = useState({
    longitude: 40.0,
    latitude: -8.0,
    zoom: isMobile ? 5 : 6,
    bearing: 0,
    pitch: 0
  });

  // Load map data
  const { boundaries, loading, error, totalValue } = useMapData();

  // Add new state for legend layer visibility
  const [visibleRanges, setVisibleRanges] = useState(Array(6).fill(true));

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

  const onHover = useCallback(event => {
    const { features } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(hoveredFeature || null);
  }, []);

  const onClick = useCallback(event => {
    const { features } = event;
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
  }, []);

  // Add handler for toggling legend layers
  const handleToggleLayer = useCallback((index) => {
    setVisibleRanges(prev => {
      const newRanges = [...prev];
      newRanges[index] = !newRanges[index];
      return newRanges;
    });
  }, []);

  // Create WIO layer style
  const wioLayer = useMemo(() => ({
    id: 'wio-regions',
    type: 'fill',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#ff7e5f',
        [
          'interpolate',
          ['linear'],
          ['get', 'mean_cpue'],
          0, '#eff3ff',
          50, '#c6dbef',
          100, '#9ecae1',
          150, '#6baed6',
          200, '#3182bd',
          250, '#08519c'
        ]
      ],
      'fill-opacity': opacity,
      'fill-outline-color': isDarkTheme ? '#ffffff' : '#000000'
    }
  }), [isDarkTheme, opacity]);

  // Create WIO hover layer
  const wioHoverLayer = useMemo(() => ({
    id: 'wio-hover',
    type: 'fill',
    paint: {
      'fill-color': '#ff7e5f',
      'fill-opacity': 0.8,
      'fill-outline-color': isDarkTheme ? '#ffffff' : '#000000'
    }
  }), [isDarkTheme]);

  // Update panel visibility handlers
  const handleTogglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

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
        onToggleSelection={() => handleTogglePanel('selection')}
        onToggleAnalysis={() => handleTogglePanel('analysis')}
        onToggleCharts={() => handleTogglePanel('charts')}
      />
      
      <div style={{
        position: 'relative',
        flexGrow: 1,
        marginTop: '60px'
      }}>
        <ReactMapGL
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={getMapStyles(isDarkTheme)}
          mapboxAccessToken={MAPBOX_TOKEN}
          interactiveLayerIds={['wio-regions']}
          onMouseMove={onHover}
          onClick={onClick}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          
          <Source type="geojson" data={boundaries}>
            <Layer 
              {...wioLayer}
              beforeId="waterway-label"
            />
            {hoverInfo && (
              <Layer
                {...wioHoverLayer}
                filter={['==', 'region', hoverInfo.properties.region]}
                beforeId="waterway-label"
              />
            )}
          </Source>

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
              onToggleLayer={handleToggleLayer}
              visibleRanges={visibleRanges}
            />
          </div>
        </ReactMapGL>

        <div style={{
          position: 'fixed',
          top: '80px',
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: 'calc(100vh - 100px)',
          zIndex: 1000,
          overflowY: 'auto'
        }}>
          <AnalysisPanel
            isDarkTheme={isDarkTheme}
            showPanel={activePanel === 'analysis'}
            onTogglePanel={() => handleTogglePanel('analysis')}
            totalValue={totalValue}
            opacity={opacity}
            onOpacityChange={setOpacity}
            isMobile={isMobile}
          />

          <ChartsPanel
            isDarkTheme={isDarkTheme}
            showPanel={activePanel === 'charts'}
            onTogglePanel={() => handleTogglePanel('charts')}
            totalValue={totalValue}
            isMobile={isMobile}
            boundaries={boundaries}
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