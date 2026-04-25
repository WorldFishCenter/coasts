import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { Map as MapGL, useControl } from 'react-map-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { Waves } from 'lucide-react';
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
import { KEPLER_INITIAL_VIEW_STATE } from '../utils/pdsOverlayConfig';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Initial viewport configuration
const INITIAL_VIEW_STATE = {
  ...KEPLER_INITIAL_VIEW_STATE
};
const BATHYMETRY_SOURCE_ID = 'bathymetry-source';
const BATHYMETRY_LINE_LAYER_ID = 'bathymetry-lines';
const BATHYMETRY_LABEL_LAYER_ID = 'bathymetry-labels';
const BATHYMETRY_DATA_PATH = '/data/bathymetry_contours_wio.geojson';

const DeckGLOverlay = (props) => {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
};

const MapComponent = () => {
  // Device detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Theme and visualization states
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isSatellite, setIsSatellite] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState('column');
  const [showBathymetry, setShowBathymetry] = useState(false);
  const [bathymetryLoading, setBathymetryLoading] = useState(false);
  
  // Map interaction states
  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState(null);
  
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
  const didSetDefault = useRef(false);

  // Load map data (both GAUL levels)
  const {
    boundariesGaul1,
    boundariesGaul2,
    timeSeriesGaul1,
    timeSeriesGaul2,
    pdsGridsData,
    pdsFishingGroundsData,
    pdsH3EffortData,
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
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    const targetPitch = visualizationMode === 'heatmap' ? 0 : KEPLER_INITIAL_VIEW_STATE.pitch;
    map.setPitch(targetPitch);
    map.triggerRepaint();
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
    selectedMetric,
    metricStats,
    opacity,
    isSatellite,
    isDarkTheme,
    hoveredFeatureIndex,
    visualizationMode,
    pdsFishingGroundsData,
    pdsH3EffortData
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

  const removeBathymetryLayers = useCallback((map) => {
    if (!map) return;
    if (map.getLayer(BATHYMETRY_LABEL_LAYER_ID)) {
      map.removeLayer(BATHYMETRY_LABEL_LAYER_ID);
    }
    if (map.getLayer(BATHYMETRY_LINE_LAYER_ID)) {
      map.removeLayer(BATHYMETRY_LINE_LAYER_ID);
    }
    if (map.getSource(BATHYMETRY_SOURCE_ID)) {
      map.removeSource(BATHYMETRY_SOURCE_ID);
    }
  }, []);

  const ensureBathymetryLayers = useCallback(async (map) => {
    if (!map || !map.isStyleLoaded()) return;
    setBathymetryLoading(true);
    try {
      if (!map.getSource(BATHYMETRY_SOURCE_ID)) {
        map.addSource(BATHYMETRY_SOURCE_ID, {
          type: 'geojson',
          data: BATHYMETRY_DATA_PATH
        });
      }

      if (!map.getLayer(BATHYMETRY_LINE_LAYER_ID)) {
        map.addLayer({
          id: BATHYMETRY_LINE_LAYER_ID,
          type: 'line',
          source: BATHYMETRY_SOURCE_ID,
          minzoom: 4,
          paint: {
            'line-color': [
              'interpolate',
              ['linear'],
              ['get', 'depth_m'],
              5, '#84d2f6',
              40, '#55a9df',
              120, '#2f7eb8',
              300, '#255c95',
              1000, '#1e3f72',
              2000, '#172f58'
            ],
            'line-width': [
              'match',
              ['get', 'depth_m'],
              [5, 10, 20, 40, 60, 90, 120, 150, 200, 300, 500, 1000, 2000], 1.5,
              1
            ],
            'line-opacity': isDarkTheme ? 0.65 : 0.5
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          }
        });
      }

      if (!map.getLayer(BATHYMETRY_LABEL_LAYER_ID)) {
        map.addLayer({
          id: BATHYMETRY_LABEL_LAYER_ID,
          type: 'symbol',
          source: BATHYMETRY_SOURCE_ID,
          minzoom: 8,
          filter: [
            'in',
            ['get', 'depth_m'],
            ['literal', [10, 40, 90, 200, 500, 1000, 2000]]
          ],
          layout: {
            'text-field': ['get', 'depth_label'],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 11,
            'text-anchor': 'center',
            'symbol-placement': 'line',
            'symbol-spacing': 180,
            'text-max-angle': 45
          },
          paint: {
            'text-color': isDarkTheme ? '#d9f2ff' : '#154368',
            'text-halo-color': isDarkTheme ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.8)',
            'text-halo-width': 1.5
          }
        });
      }
    } finally {
      setBathymetryLoading(false);
    }
  }, [isDarkTheme]);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    if (showBathymetry) {
      ensureBathymetryLayers(map);
    } else {
      removeBathymetryLayers(map);
      setBathymetryLoading(false);
    }
  }, [showBathymetry, ensureBathymetryLayers, removeBathymetryLayers]);

  const handleStyleData = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !showBathymetry) return;
    ensureBathymetryLayers(map);
  }, [showBathymetry, ensureBathymetryLayers]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    map.dragPan.enable();
    map.dragRotate.enable();
    map.touchZoomRotate.enable();
    map.touchZoomRotate.disableRotation();
    map.keyboard.enable();
    if (showBathymetry) {
      ensureBathymetryLayers(map);
    }
  }, [showBathymetry, ensureBathymetryLayers]);

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
        display: 'flex',
        minHeight: 0
      }}>
        <Sidebar
          isDarkTheme={isDarkTheme}
          isMobile={isMobile}
          isOpen={!isMobile}
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
          <MapGL
            ref={mapRef}
            initialViewState={INITIAL_VIEW_STATE}
            projection="mercator"
            // Default bearingSnap is 7°: small non-zero bearings (e.g. Kepler ~-2°) get eased to north
            // after zoom/pan inertia ends. Disable so zoom never "corrects" bearing unexpectedly.
            bearingSnap={0}
            mapStyle={getMapStyle()}
            mapboxAccessToken={MAPBOX_TOKEN}
            onLoad={handleMapLoad}
            onStyleData={handleStyleData}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          >
            <DeckGLOverlay
              interleaved={true}
              layers={layers}
              getTooltip={getTooltip}
              onHover={onHover}
              onClick={handleRegionClick}
              getCursor={getCursor}
            />
          </MapGL>

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

          <button
            onClick={() => setShowBathymetry((prev) => !prev)}
            title={showBathymetry ? 'Hide bathymetry contours' : 'Show bathymetry contours'}
            className="absolute top-20 right-6 w-12 h-12 p-2 glass-panel rounded-xl z-[1000] flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 group cursor-pointer"
            aria-label={showBathymetry ? 'Hide bathymetry contours' : 'Show bathymetry contours'}
          >
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
            <Waves
              size={22}
              strokeWidth={2}
              className={`${showBathymetry ? 'text-primary' : 'text-foreground/70'} group-hover:text-primary transition-colors relative z-10`}
            />
          </button>

          {bathymetryLoading && (
            <div
              className="px-3 py-1.5 rounded-lg glass-panel z-[1000] text-xs text-foreground/80"
              style={{ position: 'absolute', top: '132px', right: '24px' }}
            >
              Loading bathymetry...
            </div>
          )}


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