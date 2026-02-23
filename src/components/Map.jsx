import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import DeckGL from '@deck.gl/react';
import { Map as MapGL } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Components - Lazy load heavy components
import Header from './Header';
import Sidebar from './Sidebar';
import EnhancedLegend from './map/EnhancedLegend';
import MapStyleToggle from './map/MapStyleToggle';
import TimeRangeControl from './map/TimeRangeControl';

// Lazy loaded components
const DistributionHistogram = lazy(() => import('./map/DistributionHistogram'));

// Hooks
import { useMapData } from '../hooks/useMapData';
import { useMapLayers } from '../hooks/useMapLayers';
import { useMapTooltip } from '../hooks/useMapTooltip';

// Utils
import { getMapStyles } from '../styles/mapStyles';
import { TIME_BREAKS, COLOR_RANGE } from '../utils/gridLayerConfig';
import { processPdsData, transformPdsData } from '../utils/pdsDataProcessor';
import { calculateMetricStats } from '../utils/metricCalculations';
import { getAverageMetricsInRange, getAverageMetricsInRangeGaul1, getRegionKey as getRegionKeyFromService } from '../services/dataService';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Initial viewport configuration
const INITIAL_VIEW_STATE = {
  longitude: 39.0,
  latitude: -7,
  zoom: 5.7,
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
  
  // Admin level: gaul1 = Admin 1 (provinces), gaul2 = Admin 2 (districts)
  const [gaulLevel, setGaulLevel] = useState('gaul2');
  
  // Data loading states
  const [pdsDataLoaded, setPdsDataLoaded] = useState(false);
  
  // Add state for date range (indices)
  const [dateRange, setDateRange] = useState([0, 0]); // [startIdx, endIdx]
  
  // Refs
  const mapRef = useRef(null);
  const deckRef = useRef(null);
  const didSetDefault = useRef(false);

  // Load map data (both GAUL levels)
  const {
    boundariesGaul1,
    boundariesGaul2,
    timeSeriesGaul1,
    timeSeriesGaul2,
    pdsGridsData,
    loading,
    error
  } = useMapData();

  // Active data based on selected admin level
  const boundaries = gaulLevel === 'gaul1' ? boundariesGaul1 : boundariesGaul2;
  const timeSeriesData = gaulLevel === 'gaul1' ? timeSeriesGaul1 : timeSeriesGaul2;

  // Clear selection when switching admin level
  useEffect(() => {
    setSelectedRegion(null);
    setSelectedRegionsForComparison([]);
  }, [gaulLevel]);

  // Extract all unique sorted dates from timeSeriesData (from 2020 onwards)
  const allDates = useMemo(() => {
    if (!timeSeriesData) return [];
    const dates = Object.values(timeSeriesData)
      .flatMap(region => region.data.map(d => d.date))
      .filter(Boolean)
      .filter(date => new Date(date).getFullYear() >= 2020);
    return Array.from(new Set(dates)).sort((a, b) => new Date(a) - new Date(b));
  }, [timeSeriesData]);

  // Set default date range when data loads
  useEffect(() => {
    if (
      allDates.length > 1 &&
      !didSetDefault.current
    ) {
      setDateRange([0, allDates.length - 1]);
      didSetDefault.current = true;
    }
  }, [allDates]);

  // Handler to clamp date range
  const handleDateRangeChange = (range) => {
    const [min, max] = range;
    const clampedMin = Math.max(0, Math.min(min, allDates.length - 1));
    const clampedMax = Math.max(clampedMin, Math.min(max, allDates.length - 1));
    setDateRange([clampedMin, clampedMax]);
  };

  // Helper to enrich boundaries with average metrics in range (GAUL level–aware)
  const getBoundariesWithAveragedMetrics = useCallback(() => {
    if (!boundaries || !timeSeriesData || allDates.length === 0) return boundaries;
    const [startIdx, endIdx] = dateRange;
    const startDate = allDates[startIdx];
    const endDate = allDates[endIdx];
    return {
      ...boundaries,
      features: boundaries.features.map((feature) => {
        const { country, gaul1_name, gaul2_name } = feature.properties;
        const avgMetrics =
          gaulLevel === 'gaul1'
            ? getAverageMetricsInRangeGaul1(timeSeriesData, country, gaul1_name, startDate, endDate)
            : getAverageMetricsInRange(timeSeriesData, country, gaul1_name, gaul2_name, startDate, endDate);
        return {
          ...feature,
          properties: {
            ...feature.properties,
            mean_cpue: avgMetrics?.mean_cpue ?? null,
            mean_cpua: avgMetrics?.mean_cpua ?? null,
            mean_rpue: avgMetrics?.mean_rpue ?? null,
            mean_rpua: avgMetrics?.mean_rpua ?? null,
            mean_price_kg: avgMetrics?.mean_price_kg ?? null
          }
        };
      })
    };
  }, [boundaries, timeSeriesData, allDates, dateRange, gaulLevel]);

  // Use enriched boundaries for map and sidebar
  const enrichedBoundaries = useMemo(() => getBoundariesWithAveragedMetrics(), [getBoundariesWithAveragedMetrics]);

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

  // Filter enriched boundaries by selected countries
  const filteredBoundaries = useMemo(() => {
    if (!enrichedBoundaries || selectedCountries.length === 0) return enrichedBoundaries;
    return {
      ...enrichedBoundaries,
      features: enrichedBoundaries.features.filter(f => 
        selectedCountries.includes(f.properties.country)
      )
    };
  }, [enrichedBoundaries, selectedCountries]);

  // Transform PDS data based on selected ranges
  const transformedPdsData = useMemo(() => {
    return transformPdsData(selectedRanges);
  }, [selectedRanges, pdsDataLoaded]);

  // Calculate metric statistics based on enriched boundaries
  const metricStats = useMemo(() => {
    return calculateMetricStats(enrichedBoundaries, selectedMetric);
  }, [enrichedBoundaries, selectedMetric]);

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

  // Selection key: level-aware (GAUL1 = country_gaul1, GAUL2 = ADM2_PCODE or country_gaul1_gaul2)
  const getRegionKey = useCallback(
    (props) => getRegionKeyFromService(props, gaulLevel),
    [gaulLevel]
  );

  const handleRegionSelect = useCallback((region) => {
    const key = getRegionKey(region.properties);
    setSelectedRegionsForComparison(prev => {
      const exists = prev.some(r => getRegionKey(r.properties) === key);
      if (exists) return prev;
      return [...prev, region];
    });
  }, [getRegionKey]);

  const handleRegionRemove = useCallback((region) => {
    const key = getRegionKey(region.properties);
    setSelectedRegionsForComparison(prev =>
      prev.filter(r => getRegionKey(r.properties) !== key)
    );
  }, [getRegionKey]);

  const handleRegionClick = useCallback((info) => {
    if (info.object && info.layer.id === 'wio-regions') {
      setSelectedRegion(info.object);
      handleRegionSelect(info.object);
    }
  }, [handleRegionSelect]);

  // Get map style (satellite-v9 = bare imagery, no roads/labels)
  const getMapStyle = useCallback(() => {
    if (isSatellite) {
      return 'mapbox://styles/mapbox/satellite-v9';
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
  if (!MAPBOX_TOKEN?.trim()) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#e0e0e0',
        fontFamily: 'system-ui, sans-serif',
        padding: '1rem',
        textAlign: 'center'
      }}>
        Map unavailable: missing Mapbox token. Set VITE_MAPBOX_TOKEN in .env for local development.
      </div>
    );
  }

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
        boundaries={enrichedBoundaries}
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
        <Sidebar
          isDarkTheme={isDarkTheme}
          isMobile={isMobile}
          isOpen={true}
          boundaries={enrichedBoundaries}
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
          gaulLevel={gaulLevel}
          onGaulLevelChange={setGaulLevel}
          visualizationMode={visualizationMode}
          onVisualizationModeChange={setVisualizationMode}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%'
          }}
        />

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
            <EnhancedLegend 
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

          <TimeRangeControl
            timeSeriesData={timeSeriesData}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            isDarkTheme={isDarkTheme}
            isMobile={isMobile}
          />

          {selectedRegion && (
            <Suspense fallback={<div>Loading distribution histogram...</div>}>
              <DistributionHistogram
                isDarkTheme={isDarkTheme}
                boundaries={enrichedBoundaries}
                selectedMetric={selectedMetric}
                selectedRegion={selectedRegion}
                timeSeriesData={timeSeriesData}
                gaulLevel={gaulLevel}
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