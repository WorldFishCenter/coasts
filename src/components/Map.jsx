import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactMapGL, { Source, Layer, NavigationControl, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Header from './Header';
import Sidebar from './Sidebar';
import { useMapData } from '../hooks/useMapData';
import { getMapStyles } from '../styles/mapStyles';

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

const MapComponent = () => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  
  // Panel states
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'charts' | 'selection'
  
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

  // Time range constants
  const minDate = new Date('2023-01-01').getTime();
  const maxDate = new Date('2025-12-31').getTime();

  // Ref for Map instance
  const mapRef = useRef(null);

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

  // Create WIO layer style
  const wioLayer = useMemo(() => ({
    id: 'wio-regions',
    type: 'fill',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#ff7e5f',
        ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', selectedMetric]], metricStats.grades[0]], ...metricStats.stops]
      ],
      'fill-opacity': opacity,
      'fill-outline-color': isDarkTheme ? '#ffffff' : '#000000'
    }
  }), [isDarkTheme, opacity, selectedMetric, metricStats]);

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

        {/* Map Container */}
        <div style={{
          flexGrow: 1,
          position: 'relative',
          transition: 'margin-left 0.3s ease'
        }}>
          <ReactMapGL
            ref={mapRef}
            {...viewState}
            projection={{ name: 'globe' }}
            dragRotate
            pitchWithRotate
            maxZoom={8}
            pitch = {40}
            onMove={e => setViewState(e.viewState)}
            mapStyle={getMapStyles(isDarkTheme)}
            mapboxAccessToken={MAPBOX_TOKEN}
            interactiveLayerIds={['wio-regions']}
            onMouseMove={onHover}
            onClick={onClick}
            style={{ width: '100%', height: '100%' }}
            onLoad={()=>{
              const map = mapRef.current?.getMap?.();
              try{
                map?.setProjection?.({ name: 'globe' });
              }catch(err){
                console.warn('Globe projection not supported:', err);
              }
            }}
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
                grades={metricStats.grades}
              />
            </div>
          </ReactMapGL>
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