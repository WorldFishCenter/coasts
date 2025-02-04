import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Header from './Header';
import SelectionPanel from './panels/SelectionPanel';
import AnalysisPanel from './panels/AnalysisPanel';
import MapControls from './map/MapControls';
import { useMapData } from '../hooks/useMapData';
import { getMapStyles, getDistrictStyle, getColor } from '../styles/mapStyles';

const Map = () => {
  // State
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [showSelectionPanel, setShowSelectionPanel] = useState(true);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true);
  const [coverage, setCoverage] = useState(75);
  const [radius, setRadius] = useState(30);
  const [upperPercentile, setUpperPercentile] = useState(95);
  const [opacity, setOpacity] = useState(0.7);

  // Custom hook for data management
  const { 
    boundaries, 
    palmaArea, 
    loading, 
    error, 
    totalValue,
    getPalmaCenter
  } = useMapData();

  // Add mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

  // Style functions
  const style = useCallback((feature) => {
    const value = feature.properties.fisheryValue || 0;
    return {
      fillColor: getColor(value),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  }, []);

  const districtStyleCallback = useCallback((feature) => {
    return getDistrictStyle(feature, { isDarkTheme, opacity, selectedDistricts });
  }, [isDarkTheme, opacity, selectedDistricts]);

  // Event handlers
  const onEachFeature = useCallback((feature, layer) => {
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.7
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(style(layer.feature));
      },
      click: (e) => {
        const layer = e.target;
        const popupContent = `
          <div>
            <h3>${feature.properties.name || 'Unknown Region'}</h3>
            <p>Fishery Catch: ${feature.properties.fisheryValue || 0} tons</p>
          </div>
        `;
        layer.bindPopup(popupContent).openPopup();
      }
    });
  }, [style]);

  const onEachDistrictFeature = useCallback((feature, layer) => {
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        if (!selectedDistricts.some(d => d.properties.ADM2_PCODE === feature.properties.ADM2_PCODE)) {
          layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.8
          });
        }
        layer.bringToFront();
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(districtStyleCallback(feature));
      },
      click: (e) => {
        const layer = e.target;
        const isSelected = selectedDistricts.some(d => d.properties.ADM2_PCODE === feature.properties.ADM2_PCODE);
        
        if (isSelected) {
          setSelectedDistricts(prev => prev.filter(d => d.properties.ADM2_PCODE !== feature.properties.ADM2_PCODE));
        } else {
          setSelectedDistricts(prev => [...prev, feature]);
        }
        
        layer.setStyle(districtStyleCallback(feature));
      }
    });
  }, [selectedDistricts, districtStyleCallback]);

  if (loading) return <div>Loading map data...</div>;
  if (error) return <div>Error: {error}</div>;

  const styles = getMapStyles(isDarkTheme);
  const palmaCenter = getPalmaCenter();

  return (
    <div style={styles.container}>
      <Header onThemeChange={handleThemeChange} />
      
      <div style={styles.contentWrapper}>
        <MapContainer
          center={palmaCenter}
          zoom={isMobile ? 8 : 9}
          style={{ height: "100%", width: "100%" }}
          minZoom={2}
          zoomControl={false}
          dragging={!isMobile || (isMobile && selectedDistricts.length === 0)}
          touchZoom={true}
          doubleClickZoom={true}
        >
          <TileLayer
            url={isDarkTheme 
              ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
              : `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
            }
            attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
          />
          <MapControls
            boundaries={boundaries}
            palmaArea={palmaArea}
            style={style}
            districtStyle={districtStyleCallback}
            onEachFeature={onEachFeature}
            onEachDistrictFeature={onEachDistrictFeature}
          />
        </MapContainer>

        <div style={{
          ...styles.panelsContainer,
          ...(isMobile && {
            position: 'fixed',
            bottom: '0',
            right: '0',
            left: '0',
            top: 'auto',
            transform: showSelectionPanel || showAnalysisPanel ? 'translateY(0)' : 'translateY(calc(100% - 40px))',
            maxHeight: '70vh',
            width: '100%',
            padding: '0 10px 10px',
            background: isDarkTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderTopLeftRadius: '15px',
            borderTopRightRadius: '15px',
            transition: 'transform 0.3s ease',
            zIndex: 1001
          })
        }}>
          {isMobile && (
            <div 
              onClick={() => {
                if (!showSelectionPanel && !showAnalysisPanel) {
                  setShowSelectionPanel(true);
                }
              }}
              style={{
                width: '100%',
                height: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                borderTopLeftRadius: '15px',
                borderTopRightRadius: '15px',
                borderBottom: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <div style={{
                width: '40px',
                height: '4px',
                backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                borderRadius: '2px',
                margin: '8px 0'
              }} />
            </div>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: isMobile ? 'calc(70vh - 40px)' : 'auto',
            overflowY: 'auto'
          }}>
            <SelectionPanel
              isDarkTheme={isDarkTheme}
              showPanel={showSelectionPanel}
              onTogglePanel={() => {
                setShowSelectionPanel(!showSelectionPanel);
                if (!showSelectionPanel) setShowAnalysisPanel(false);
              }}
              selectedDistricts={selectedDistricts}
              onClearSelection={() => setSelectedDistricts([])}
              selectedTotal={selectedDistricts.reduce((sum, d) => sum + (d.properties.value || 0), 0)}
              totalValue={totalValue}
              onRemoveDistrict={handleRemoveDistrict}
              onExportSelection={handleExportSelection}
              isMobile={isMobile}
            />

            <AnalysisPanel
              isDarkTheme={isDarkTheme}
              showPanel={showAnalysisPanel}
              onTogglePanel={() => {
                setShowAnalysisPanel(!showAnalysisPanel);
                if (!showAnalysisPanel) setShowSelectionPanel(false);
              }}
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
          </div>
        </div>
      </div>

      <style>
        {`
          .district-polygon {
            transition: all 0.3s ease;
          }
          .leaflet-control-zoom {
            margin-top: ${isMobile ? '70px' : '20px'} !important;
            margin-left: ${isMobile ? '10px' : '20px'} !important;
          }
          .leaflet-control-attribution {
            background-color: ${isDarkTheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)'} !important;
            color: ${isDarkTheme ? '#fff' : '#000'} !important;
          }
          .leaflet-control-attribution a {
            color: ${isDarkTheme ? '#3498db' : '#2980b9'} !important;
          }
          @media (max-width: 768px) {
            .leaflet-control-attribution {
              font-size: 10px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Map; 