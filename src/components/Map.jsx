import { useState, useCallback } from 'react';
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
          zoom={9}
          style={{ height: "100%", width: "100%" }}
          minZoom={2}
          zoomControl={false}
        >
          <TileLayer
            url={isDarkTheme 
              ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
              : "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
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

        <div style={styles.panelsContainer}>
          <SelectionPanel
            isDarkTheme={isDarkTheme}
            showPanel={showSelectionPanel}
            onTogglePanel={() => setShowSelectionPanel(!showSelectionPanel)}
            selectedDistricts={selectedDistricts}
            onClearSelection={() => setSelectedDistricts([])}
            selectedTotal={selectedDistricts.reduce((sum, d) => sum + (d.properties.value || 0), 0)}
            totalValue={totalValue}
            onRemoveDistrict={handleRemoveDistrict}
            onExportSelection={handleExportSelection}
          />

          <AnalysisPanel
            isDarkTheme={isDarkTheme}
            showPanel={showAnalysisPanel}
            onTogglePanel={() => setShowAnalysisPanel(!showAnalysisPanel)}
            totalValue={totalValue}
            coverage={coverage}
            onCoverageChange={setCoverage}
            radius={radius}
            onRadiusChange={setRadius}
            upperPercentile={upperPercentile}
            onUpperPercentileChange={setUpperPercentile}
            opacity={opacity}
            onOpacityChange={setOpacity}
          />
        </div>
      </div>

      <style>
        {`
          .district-polygon {
            transition: all 0.3s ease;
          }
          .leaflet-control-zoom {
            margin-top: 20px !important;
            margin-left: 20px !important;
          }
          .leaflet-control-attribution {
            background-color: ${isDarkTheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)'} !important;
            color: ${isDarkTheme ? '#fff' : '#000'} !important;
          }
          .leaflet-control-attribution a {
            color: ${isDarkTheme ? '#3498db' : '#2980b9'} !important;
          }
        `}
      </style>
    </div>
  );
};

export default Map; 