import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import DeckGL from '@deck.gl/react';
import { Map as MapGL } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Components - Lazy load heavy components
import Header from './Header';
import UnifiedLegend from './map/UnifiedLegend';
import MapStyleToggle from './map/MapStyleToggle';

// Lazy loaded components
const DistributionHistogram = lazy(() => import('./map/DistributionHistogram'));
const Sidebar = lazy(() => import('./Sidebar'));

// Hooks
import { useMapData } from '../hooks/useMapData';
import { useMapLayers } from '../hooks/useMapLayers';
import { useMapTooltip } from '../hooks/useMapTooltip';

// Utils
import { getMapStyles } from '../styles/mapStyles';
import { TIME_BREAKS, COLOR_RANGE } from '../utils/gridLayerConfig';
import { processPdsData, transformPdsData } from '../utils/pdsDataProcessor';
import { calculateMetricStats } from '../utils/metricCalculations';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Initial viewport configuration
const INITIAL_VIEW_STATE = {
  longitude: 39.0,
  latitude: -5.5,
  zoom: 7.2,
  pitch: 40,
  bearing: 0
};

const MapComponent = () => {
  // Device detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Theme and visualization states
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isSatellite, setIsSatellite] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState('column');
  
  // Map interaction states
  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  
  // Analysis states
  const [opacity, setOpacity] = useState(0.7);
  const [selectedMetric, setSelectedMetric] = useState('mean_cpue');
  const [selectedRanges, setSelectedRanges] = useState(TIME_BREAKS);
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  // Selection and filter states
  const [selectedRegionsForComparison, setSelectedRegionsForComparison] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  
  // Data loading states
  const [pdsDataLoaded, setPdsDataLoaded] = useState(false);
  
  // Refs
  const mapRef = useRef(null);
  const deckRef = useRef(null);

  // Load map data
  const { boundaries, pdsGridsData, timeSeriesData, loading, error } = useMapData();

  // Process PDS data when it loads
  useEffect(() => {
    if (processPdsData(pdsGridsData)) {
      setPdsDataLoaded(true);
    }
  }, [pdsGridsData]);

  // Handle window resize
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

  // Transform PDS data based on selected ranges
  const transformedPdsData = useMemo(() => {
    return transformPdsData(selectedRanges);
  }, [selectedRanges, pdsDataLoaded]);

  // Calculate metric statistics
  const metricStats = useMemo(() => {
    return calculateMetricStats(boundaries, selectedMetric);
  }, [boundaries, selectedMetric]);

  // Create map layers
  const layers = useMapLayers({
    filteredBoundaries,
    transformedPdsData,
    selectedMetric,
    metricStats,
    opacity,
    isSatellite,
    isDarkTheme,
    hoveredFeatureIndex,
    visualizationMode,
    selectedRanges
  });

  // Create tooltip handler
  const getTooltip = useMapTooltip({
    selectedMetric,
    isDarkTheme,
    metricStats,
    visualizationMode
  });

  // Event handlers
  const handleThemeChange = useCallback((isDark) => {
    setIsDarkTheme(isDark);
  }, []);

  const onViewStateChange = useCallback(({ viewState }) => {
    setViewState(viewState);
  }, []);

  const onHover = useCallback((info) => {
    if (info.object && info.layer.id === 'wio-regions') {
      setHoveredFeatureIndex(info.index);
    } else {
      setHoveredFeatureIndex(null);
    }
  }, []);

  const handleMapStyleToggle = useCallback(() => {
    setIsSatellite(prev => !prev);
  }, []);

  // Selection handlers
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

  const handleCountryToggle = useCallback((country) => {
    setSelectedCountries(prev => {
      const isSelected = prev.includes(country);
      if (isSelected) {
        return prev.filter(c => c !== country);
      }
      return [...prev, country];
    });
  }, []);

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

  const handleRegionClick = useCallback((info) => {
    if (info.object && info.layer.id === 'wio-regions') {
      setSelectedRegion(info.object);
      handleRegionSelect(info.object);
    }
  }, [handleRegionSelect]);

  // Get map style
  const getMapStyle = useCallback(() => {
    if (isSatellite) {
      return "mapbox://styles/mapbox/satellite-v9";
    }
    return getMapStyles(isDarkTheme);
  }, [isSatellite, isDarkTheme]);

  const getCursor = useCallback(({isDragging, isHovering}) => 
    isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
  , []);

  // Loading and error states
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
        boundaries={boundaries}
        timeSeriesData={timeSeriesData}
        pdsGridsData={pdsGridsData}
      />
      
      <div style={{
        position: 'relative',
        flex: '1 1 auto',
        marginTop: '64px',
        display: 'flex',
        height: 'calc(100vh - 64px)',
        minHeight: 0
      }}>
        <Suspense fallback={<div>Loading Sidebar...</div>}>
          <Sidebar
            isDarkTheme={isDarkTheme}
            isMobile={isMobile}
            isOpen={true}
            boundaries={boundaries}
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
            transformedPdsData={transformedPdsData}
            selectedRanges={selectedRanges}
            onRangeToggle={handleRangeToggle}
            selectedRegions={selectedRegionsForComparison}
            onRegionSelect={handleRegionSelect}
            onRegionRemove={handleRegionRemove}
            selectedCountries={selectedCountries}
            onCountryToggle={handleCountryToggle}
            visualizationMode={visualizationMode}
            onVisualizationModeChange={setVisualizationMode}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%'
            }}
          />
        </Suspense>

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
            getCursor={getCursor}
            onClick={handleRegionClick}
          >
            <MapGL
              ref={mapRef}
              mapStyle={getMapStyle()}
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />
          </DeckGL>

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

          <MapStyleToggle
            isDarkTheme={isDarkTheme}
            isSatellite={isSatellite}
            onToggle={handleMapStyleToggle}
          />

          {selectedRegion && (
            <Suspense fallback={<div>Loading distribution histogram...</div>}>
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
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapComponent; 