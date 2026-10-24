import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Map as MapGL, useControl } from 'react-map-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ArrowRight, Minus, MousePointerClick, Plus, SlidersHorizontal, Waves, X } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import Header from './Header';
import Sidebar from './Sidebar';
import EnhancedLegend from './map/EnhancedLegend';
import MapClarityPanel from './map/MapClarityPanel';
import MapStyleToggle from './map/MapStyleToggle';

import { useTheme } from './ThemeProvider';

// Hooks
import { useMapData } from '../hooks/useMapData';
import { useMapLayers } from '../hooks/useMapLayers';
import { useMapTooltip } from '../hooks/useMapTooltip';

// Utils
import { getMapStyles } from '../styles/mapStyles';
import { processH3EffortData } from '../utils/pdsDataProcessor';
import { calculateMetricStats } from '../utils/metricCalculations';
import { BATHYMETRY_DEPTHS, getBathymetryColors } from '../utils/mapPalette';
import { boundsOf, outlineFor } from '../utils/geoOutline';
import { formatCountryName } from '../utils/formatters';
import { getAverageMetricsInRange, getAverageMetricsInRangeGaul1, getRegionKey } from '../services/dataService';
import { PDS_MIN_UNIQUE_TRIPS } from '../utils/pdsOverlayConfig';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// The map opens on the whole coast from Kenya to Maputo; the right padding keeps the
// coast clear of the legend and the Timor-Leste locator.
const WIO_BOUNDS = [[32.0, -27.0], [42.2, -1.5]];
const DESKTOP_PADDING = { top: 40, bottom: 40, left: 72, right: 340 };
const MOBILE_PADDING = { top: 24, bottom: 24, left: 64, right: 16 };
const mapPadding = () => (window.innerWidth <= 768 ? MOBILE_PADDING : DESKTOP_PADDING);
const COLUMN_PITCH = 50;
// Below this zoom the GPS cells and grounds shrink to specks, so they wait until the visitor zooms in.
const GPS_MIN_ZOOM = 6;
const COUNTRY_ORDER = ['kenya', 'tanzania', 'mozambique', 'timor'];
const HINT_STORAGE_KEY = 'coasts-hint-district-click';

const BATHYMETRY_SOURCE_ID = 'bathymetry-source';
const BATHYMETRY_LINE_LAYER_ID = 'bathymetry-lines';
const BATHYMETRY_LABEL_LAYER_ID = 'bathymetry-labels';
const BATHYMETRY_DATA_PATH = '/data/bathymetry_contours_wio.geojson';
const COASTLINE_LAYER_ID = 'coastline-hairline';

const DeckGLOverlay = (props) => {
  // Use a stable creator function to prevent destroying/recreating the overlay on every render.
  // react-map-gl's useControl will only call this once unless the function identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const overlay = useControl(useCallback(() => new MapboxOverlay(props), []));
  // Efficiently update deck.gl layers/props without recreating the Mapbox control.
  overlay.setProps(props);
  return null;
};

// Repaint the vector basemap as plate paper: white land, pale sea, an ink hairline on the coast.
// Only sets a value that differs, because every paint change fires another styledata event.
const paintBasemap = (map, isDark) => {
  const setPaint = (layer, property, value) => {
    if (map.getLayer(layer) && map.getPaintProperty(layer, property) !== value) {
      map.setPaintProperty(layer, property, value);
    }
  };
  setPaint('land', 'background-color', isDark ? '#182022' : '#ffffff');
  setPaint('water', 'fill-color', isDark ? '#0d1416' : '#e9f3f4');
  setPaint('landuse', 'fill-color', isDark ? '#1b2426' : '#f3f7f7');
  setPaint('national-park', 'fill-color', isDark ? '#1b2426' : '#f3f7f7');
  if (!map.getLayer(COASTLINE_LAYER_ID) && map.getSource('composite') && map.getLayer('water')) {
    const firstSymbol = map.getStyle().layers.find((layer) => layer.type === 'symbol')?.id;
    map.addLayer({
      id: COASTLINE_LAYER_ID,
      type: 'line',
      source: 'composite',
      'source-layer': 'water',
      paint: { 'line-color': isDark ? '#8ccbd0' : '#0b2233', 'line-width': 0.7, 'line-opacity': isDark ? 0.5 : 0.55 }
    }, firstSymbol);
  }
  setPaint(COASTLINE_LAYER_ID, 'line-color', isDark ? '#8ccbd0' : '#0b2233');
  setPaint(COASTLINE_LAYER_ID, 'line-opacity', isDark ? 0.5 : 0.55);
};

const featuresOf = (boundaries, countries) =>
  (boundaries?.features ?? []).filter((feature) => countries.includes(feature.properties.country));

const MapComponent = ({ isActive = true }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  // Default to the vector basemap (light-v11/dark-v11): cheap map loads.
  // Satellite (satellite-v9) bills against the Raster Tiles API, so it is opt-in via MapStyleToggle.
  const [isSatellite, setIsSatellite] = useState(false);
  // 3D columns by default: the map opens tilted, and the effort columns stand up once the visitor zooms in.
  const [visualizationMode, setVisualizationMode] = useState('column');
  const [showBathymetry, setShowBathymetry] = useState(true);
  const [viewRegion, setViewRegion] = useState('wio');
  const [zoom, setZoom] = useState(0);
  const gpsVisible = zoom >= GPS_MIN_ZOOM;

  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  // A first-visit hint on the map, until the first district click or a dismissal.
  const [showHint, setShowHint] = useState(() => {
    try {
      return localStorage.getItem(HINT_STORAGE_KEY) !== 'done';
    } catch {
      return true;
    }
  });
  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_STORAGE_KEY, 'done');
    } catch {
      // Private mode: the hint just comes back next visit.
    }
  }, []);

  const [opacity] = useState(0.85);
  const [selectedMetric, setSelectedMetric] = useState('mean_cpue');
  const [selectedFishersMetric, setSelectedFishersMetric] = useState('fishers_total');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedActivityMetric, setSelectedActivityMetric] = useState('avg_hours_per_day');
  const [activeActivityLayers, setActiveActivityLayers] = useState({ hexagons: true, grounds: true });
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Admin level: gaul1 = Admin 1 (provinces), gaul2 = Admin 2 (districts)
  const [gaulLevel, setGaulLevel] = useState('gaul2');

  const mapRef = useRef(null);
  const [initialViewState] = useState(() => ({
    bounds: WIO_BOUNDS,
    fitBoundsOptions: { padding: mapPadding(), pitch: COLUMN_PITCH },
    pitch: COLUMN_PITCH,
    bearing: 0
  }));

  const {
    boundariesGaul1,
    boundariesGaul2,
    timeSeriesGaul1,
    timeSeriesGaul2,
    pdsFishingGroundsData,
    pdsH3EffortData,
    frameGearsRows,
    loading,
    error
  } = useMapData();

  const boundaries = gaulLevel === 'gaul1' ? boundariesGaul1 : boundariesGaul2;
  const timeSeriesData = gaulLevel === 'gaul1' ? timeSeriesGaul1 : timeSeriesGaul2;

  // Clear selection when switching admin level
  useEffect(() => {
    setSelectedRegion(null);
  }, [gaulLevel]);

  // All unique sorted dates from 2020 onwards: what "All" years averages over.
  const allDates = useMemo(() => {
    if (!timeSeriesData) return [];
    const dates = Object.values(timeSeriesData)
      .flatMap(region => region.data.map(d => d.date))
      .filter(Boolean)
      .filter(date => new Date(date).getFullYear() >= 2020);
    return Array.from(new Set(dates)).sort((a, b) => new Date(a) - new Date(b));
  }, [timeSeriesData]);
  const dataFreshnessLabel = useMemo(() => {
    if (!allDates.length) return 'unknown';
    const latest = new Date(allDates[allDates.length - 1]);
    return latest.toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' });
  }, [allDates]);
  const surveyPeriodLabel = useMemo(() => {
    if (selectedYear !== 'all') return selectedYear;
    if (!allDates.length) return 'all years';
    return `${new Date(allDates[0]).getUTCFullYear()}–${new Date(allDates[allDates.length - 1]).getUTCFullYear()}`;
  }, [selectedYear, allDates]);

  // Enrich boundaries with average metrics in range (GAUL level–aware)
  const enrichedBoundaries = useMemo(() => {
    if (!boundaries || !timeSeriesData || allDates.length === 0) return boundaries;
    const startDate = selectedYear === 'all' ? allDates[0] : `${selectedYear}-01-01`;
    const endDate = selectedYear === 'all' ? allDates[allDates.length - 1] : `${selectedYear}-12-31`;
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
  }, [boundaries, timeSeriesData, allDates, selectedYear, gaulLevel]);

  // The open sheet follows the year choice, so read the selected district from the enriched data.
  const selectedFeature = useMemo(() => {
    if (!selectedRegion || !enrichedBoundaries?.features) return null;
    const key = getRegionKey(selectedRegion.properties, gaulLevel);
    return enrichedBoundaries.features.find((feature) => getRegionKey(feature.properties, gaulLevel) === key) ?? null;
  }, [selectedRegion, enrichedBoundaries, gaulLevel]);

  // Reach: districts with survey data per country, the year surveys began, and census fishers.
  const coverage = useMemo(() => {
    if (!timeSeriesGaul2) return null;
    const byCountry = new Map();
    Object.values(timeSeriesGaul2).forEach((series) => {
      const country = series.country === 'zanzibar' ? 'tanzania' : series.country;
      const dated = (series.data ?? []).filter((entry) => entry.mean_cpue != null || entry.mean_price_kg != null);
      if (!dated.length) return;
      const row = byCountry.get(country) ?? { districts: 0, since: Infinity, fishers: 0 };
      row.districts += 1;
      row.since = Math.min(row.since, new Date(dated[0].date).getUTCFullYear());
      byCountry.set(country, row);
    });
    (frameGearsRows ?? []).forEach((frameRow) => {
      const raw = String(frameRow.country).toLowerCase();
      const row = byCountry.get(raw === 'zanzibar' ? 'tanzania' : raw);
      if (row) row.fishers += (Number(frameRow.fishers_male) || 0) + (Number(frameRow.fishers_female) || 0);
    });
    const countries = COUNTRY_ORDER.filter((country) => byCountry.has(country)).map((country) => {
      const features = featuresOf(boundariesGaul2, [country]);
      const { collection, path } = outlineFor(features, 44, 32, 1);
      return {
        country,
        name: formatCountryName(country),
        silhouette: features.length ? collection.features.map((feature) => path(feature)) : [],
        ...byCountry.get(country)
      };
    });
    return { countries, districts: countries.reduce((sum, row) => sum + row.districts, 0) };
  }, [timeSeriesGaul2, frameGearsRows, boundariesGaul2]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tilt for 3D columns, flatten for the flat view.
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    map.easeTo({ pitch: visualizationMode === 'column' ? COLUMN_PITCH : 0, duration: 600 });
  }, [visualizationMode]);

  // Transform H3 data based on selected year
  const transformedH3Data = useMemo(() => {
    const yearFiltered = processH3EffortData(pdsH3EffortData, selectedYear);
    return yearFiltered.filter((row) => {
      const trips = Number(row?.unique_trips);
      return Number.isFinite(trips) && trips >= PDS_MIN_UNIQUE_TRIPS;
    });
  }, [selectedYear, pdsH3EffortData]);

  // Which period the effort grid currently represents, for legend and panel copy.
  const activityYearScope = useMemo(() => {
    if (selectedYear !== 'all') {
      return { isAllYears: false, label: String(selectedYear) };
    }
    const years = Array.from(
      new Set((pdsH3EffortData ?? []).map((row) => Number(row?.year)).filter(Number.isFinite))
    ).sort((a, b) => a - b);
    if (years.length > 1) {
      return { isAllYears: true, label: `all years (${years[0]}–${years[years.length - 1]})` };
    }
    return { isAllYears: true, label: years.length ? `all years (${years[0]})` : 'all years' };
  }, [selectedYear, pdsH3EffortData]);

  const filteredPdsFishingGroundsData = useMemo(() => {
    if (!pdsFishingGroundsData?.features?.length) return pdsFishingGroundsData;
    return {
      ...pdsFishingGroundsData,
      features: pdsFishingGroundsData.features.filter((feature) => {
        const trips = Number(feature?.properties?.unique_trips);
        return Number.isFinite(trips) && trips >= PDS_MIN_UNIQUE_TRIPS;
      })
    };
  }, [pdsFishingGroundsData]);

  const metricStats = useMemo(() => calculateMetricStats(enrichedBoundaries, selectedMetric), [enrichedBoundaries, selectedMetric]);

  const layers = useMapLayers({
    filteredBoundaries: enrichedBoundaries,
    selectedMetric,
    metricStats,
    opacity,
    isSatellite,
    isDarkTheme,
    hoveredFeatureIndex,
    selectedRegion: selectedFeature,
    gaulLevel,
    visualizationMode,
    pdsFishingGroundsData: filteredPdsFishingGroundsData,
    pdsH3EffortData: transformedH3Data,
    selectedActivityMetric,
    activeActivityLayers: gpsVisible ? activeActivityLayers : { hexagons: false, grounds: false },
    highlightCountry: hoveredCountry
  });

  const getTooltip = useMapTooltip({
    selectedMetric,
    selectedActivityMetric,
    surveyPeriodLabel,
    yearScopeLabel: activityYearScope.label
  });

  // The locator plate shows whichever region is not on screen, and flies there.
  const locator = useMemo(() => {
    const target = viewRegion === 'timor' ? 'wio' : 'timor';
    const countries = target === 'timor' ? ['timor'] : ['kenya', 'tanzania', 'mozambique'];
    const features = featuresOf(boundariesGaul2, countries);
    if (!features.length) return null;
    const { collection, path } = outlineFor(features, 220, target === 'timor' ? 64 : 120, 4);
    const rows = coverage?.countries.filter((row) => countries.includes(row.country)) ?? [];
    return {
      target,
      title: target === 'timor' ? 'Timor-Leste' : 'Kenya to Mozambique',
      detail: rows.length
        ? `${rows.reduce((sum, row) => sum + row.districts, 0)} districts, surveys since ${Math.min(...rows.map((row) => row.since))}`
        : '',
      height: target === 'timor' ? 64 : 120,
      paths: collection.features.map((feature) => path(feature))
    };
  }, [viewRegion, boundariesGaul2, coverage]);

  const showCountry = useCallback((country) => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    // fitBounds resets the pitch unless told otherwise, so pass the view the visitor chose.
    const pitch = visualizationMode === 'column' ? COLUMN_PITCH : 0;
    if (country === 'wio') {
      map.fitBounds(WIO_BOUNDS, { padding: mapPadding(), pitch, duration: 1200 });
      return;
    }
    const features = featuresOf(boundariesGaul2, [country]);
    if (!features.length) return;
    map.fitBounds(boundsOf(features), { padding: mapPadding(), pitch, duration: 1200, maxZoom: 9 });
    if (isMobile) setSidebarOpen(false);
  }, [boundariesGaul2, isMobile, visualizationMode]);

  const handleMoveEnd = useCallback((event) => {
    setViewRegion(event.viewState.longitude > 100 ? 'timor' : 'wio');
    setZoom(event.viewState.zoom);
  }, []);

  const onHover = useCallback((info) => {
    setHoveredFeatureIndex(info.object && info.layer.id === 'wio-regions' ? info.index : null);
  }, []);

  const handleSelectedMetricChange = useCallback((metricId) => {
    setSelectedMetric(metricId);
    if (metricId.startsWith('fishers_')) {
      setSelectedFishersMetric(metricId);
    }
  }, []);

  const handleFishersMetricChange = useCallback((metricId) => {
    setSelectedFishersMetric(metricId);
    setSelectedMetric(metricId);
  }, []);

  const removeBathymetryLayers = useCallback((map) => {
    if (!map) return;
    if (map.getLayer(BATHYMETRY_LABEL_LAYER_ID)) map.removeLayer(BATHYMETRY_LABEL_LAYER_ID);
    if (map.getLayer(BATHYMETRY_LINE_LAYER_ID)) map.removeLayer(BATHYMETRY_LINE_LAYER_ID);
    if (map.getSource(BATHYMETRY_SOURCE_ID)) map.removeSource(BATHYMETRY_SOURCE_ID);
  }, []);

  // Not gated on map.isStyleLoaded(): that stays false while basemap tiles are still loading, which
  // skipped the contours on first load. Adding layers needs only the style itself; before that,
  // addSource throws and the next style.load/styledata event tries again.
  const ensureBathymetryLayers = useCallback((map) => {
    if (!map) return;

    const hasSource = !!map.getSource(BATHYMETRY_SOURCE_ID);
    const hasLineLayer = !!map.getLayer(BATHYMETRY_LINE_LAYER_ID);
    const hasLabelLayer = !!map.getLayer(BATHYMETRY_LABEL_LAYER_ID);
    const contourColors = getBathymetryColors(isDarkTheme);
    const lineColor = ['interpolate', ['linear'], ['get', 'depth_m'],
      ...BATHYMETRY_DEPTHS.flatMap((depth, i) => [depth, contourColors[i]])];

    // A theme switch can keep the layer through style diffing: recolour it in place.
    if (hasLineLayer && JSON.stringify(map.getPaintProperty(BATHYMETRY_LINE_LAYER_ID, 'line-color')) !== JSON.stringify(lineColor)) {
      map.setPaintProperty(BATHYMETRY_LINE_LAYER_ID, 'line-color', lineColor);
    }
    if (hasSource && hasLineLayer && hasLabelLayer) return;

    try {
      if (!hasSource) {
        map.addSource(BATHYMETRY_SOURCE_ID, { type: 'geojson', data: BATHYMETRY_DATA_PATH });
      }
      if (!hasLineLayer) {
        map.addLayer({
          id: BATHYMETRY_LINE_LAYER_ID,
          type: 'line',
          source: BATHYMETRY_SOURCE_ID,
          minzoom: 4,
          paint: {
            'line-color': lineColor,
            'line-width': ['match', ['get', 'depth_m'], [10, 40, 200, 1000], 1, 0.6],
            'line-opacity': isDarkTheme ? 0.8 : 0.9
          },
          layout: { 'line-join': 'round', 'line-cap': 'round' }
        });
      }
      if (!hasLabelLayer) {
        map.addLayer({
          id: BATHYMETRY_LABEL_LAYER_ID,
          type: 'symbol',
          source: BATHYMETRY_SOURCE_ID,
          minzoom: 8,
          filter: ['in', ['get', 'depth_m'], ['literal', [10, 40, 90, 200, 500, 1000, 2000]]],
          layout: {
            'text-field': ['get', 'depth_label'],
            'text-font': ['Open Sans Italic', 'Arial Unicode MS Regular'],
            'text-size': 11,
            'text-anchor': 'center',
            'symbol-placement': 'line',
            'symbol-spacing': 180,
            'text-max-angle': 45
          },
          paint: {
            'text-color': isDarkTheme ? '#a4b1b3' : '#4b6170',
            'text-halo-color': isDarkTheme ? '#0d1416' : '#e9f3f4',
            'text-halo-width': 1.5
          }
        });
      }
    } catch (e) {
      console.warn('Error adding bathymetry layers:', e);
    }
  }, [isDarkTheme]);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    if (showBathymetry) {
      ensureBathymetryLayers(map);
    } else {
      removeBathymetryLayers(map);
    }
  }, [showBathymetry, ensureBathymetryLayers, removeBathymetryLayers]);

  const handleStyleData = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    try {
      if (!isSatellite) paintBasemap(map, isDarkTheme);
    } catch {
      // Style not parsed yet; style.load repaints.
    }
    if (showBathymetry) ensureBathymetryLayers(map);
  }, [isSatellite, isDarkTheme, showBathymetry, ensureBathymetryLayers]);

  // style.load fires once a new style (theme or satellite switch) is ready for our layers.
  const styleHandlerRef = useRef(handleStyleData);
  useEffect(() => {
    styleHandlerRef.current = handleStyleData;
    handleStyleData();
  }, [handleStyleData]);

  // All pages stay mounted, so a visit that starts on another page creates the map hidden, at
  // zero size, where the opening fit to the coast cannot work and falls back to the whole world.
  // Frame the coast the first time the map is actually visible.
  const needsFramingRef = useRef(!isActive);
  const visualizationModeRef = useRef(visualizationMode);
  visualizationModeRef.current = visualizationMode;
  const frameIfNeeded = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!needsFramingRef.current || !map || !map.getContainer().clientWidth) return;
    map.resize();
    map.fitBounds(WIO_BOUNDS, {
      padding: mapPadding(),
      pitch: visualizationModeRef.current === 'column' ? COLUMN_PITCH : 0,
      duration: 0
    });
    needsFramingRef.current = false;
  }, []);

  // Resize map when it becomes active (e.g. returning from Country Insights)
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        const map = mapRef.current?.getMap?.();
        if (map) {
          map.resize();
          frameIfNeeded();
          map.triggerRepaint();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, frameIfNeeded]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    map.dragPan.enable();
    map.dragRotate.enable();
    map.touchZoomRotate.enable();
    map.touchZoomRotate.disableRotation();
    map.keyboard.enable();
    frameIfNeeded();
    setZoom(map.getZoom());
    map.on('style.load', () => styleHandlerRef.current());
    styleHandlerRef.current();
  }, [frameIfNeeded]);

  const handleLayerToggle = useCallback((layer) => {
    setActiveActivityLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleRegionClick = useCallback((info) => {
    if (info.object && info.layer.id === 'wio-regions') {
      setSelectedRegion(info.object);
      dismissHint();
      if (isMobile) setSidebarOpen(true);
    }
  }, [isMobile, dismissHint]);

  const zoomBy = useCallback((delta) => {
    const map = mapRef.current?.getMap?.();
    if (map) map.easeTo({ zoom: map.getZoom() + delta, duration: 300 });
  }, []);

  const mapStyle = isSatellite ? 'mapbox://styles/mapbox/satellite-v9' : getMapStyles(isDarkTheme);

  const getCursor = useCallback(({ isDragging, isHovering }) =>
    isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
  , []);

  if (loading || error || !boundaries || !MAPBOX_TOKEN?.trim()) {
    const message = loading
      ? 'Loading the map data…'
      : error
        ? `The map data could not be loaded (${error}). Reload the page to try again.`
        : !boundaries
          ? 'No map data is available.'
          : 'The map cannot load: the Mapbox token is missing. Set VITE_MAPBOX_TOKEN in .env for local development.';
    return (
      <div className="flex h-full items-center justify-center bg-background p-6 text-center">
        <p className={loading ? 'font-serif text-lg italic text-muted-foreground' : 'max-w-md text-[15px]'}>{message}</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col bg-background">
      <Header
        boundaries={enrichedBoundaries}
        timeSeriesData={timeSeriesData}
        pdsH3EffortData={transformedH3Data}
      />

      <div className="relative flex min-h-0 flex-1">
        <Sidebar
          isDarkTheme={isDarkTheme}
          isMobile={isMobile}
          isOpen={!isMobile || sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          selectedMetric={selectedMetric}
          onMetricChange={handleSelectedMetricChange}
          selectedFishersMetric={selectedFishersMetric}
          onFishersMetricChange={handleFishersMetricChange}
          transformedH3Data={transformedH3Data}
          pdsFishingGroundsData={filteredPdsFishingGroundsData}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedActivityMetric={selectedActivityMetric}
          onActivityMetricChange={setSelectedActivityMetric}
          activeActivityLayers={activeActivityLayers}
          onLayerToggle={handleLayerToggle}
          gaulLevel={gaulLevel}
          onGaulLevelChange={setGaulLevel}
          visualizationMode={visualizationMode}
          onVisualizationModeChange={setVisualizationMode}
          surveyPeriodLabel={surveyPeriodLabel}
          dataFreshnessLabel={dataFreshnessLabel}
          coverage={coverage}
          onShowCountry={showCountry}
          onHoverCountry={setHoveredCountry}
          selectedFeature={selectedFeature}
          onCloseSheet={() => setSelectedRegion(null)}
          boundaries={enrichedBoundaries}
          timeSeriesData={timeSeriesData}
          frameGearsRows={frameGearsRows}
        />

        <div className="relative flex-1">
          <MapGL
            ref={mapRef}
            initialViewState={initialViewState}
            projection="mercator"
            // Default bearingSnap is 7°: small non-zero bearings get eased to north after
            // zoom/pan inertia ends. Disable so zoom never "corrects" bearing unexpectedly.
            bearingSnap={0}
            mapStyle={mapStyle}
            mapboxAccessToken={MAPBOX_TOKEN}
            onLoad={handleMapLoad}
            onStyleData={handleStyleData}
            onMoveEnd={handleMoveEnd}
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

          <div className="absolute left-4 top-4 z-[1000] flex flex-col gap-2 sm:left-6 sm:top-6">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="map-button" aria-label="Figures and districts" title="Figures and districts">
                <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            )}
            <div className="flex flex-col">
              <button onClick={() => zoomBy(1)} className="map-button" aria-label="Zoom in" title="Zoom in">
                <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button onClick={() => zoomBy(-1)} className="map-button -mt-px" aria-label="Zoom out" title="Zoom out">
                <Minus size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <button
              onClick={() => setVisualizationMode((mode) => (mode === 'column' ? 'heatmap' : 'column'))}
              className="map-button text-[13px] font-bold"
              aria-pressed={visualizationMode === 'column'}
              aria-label="3D view"
              title={visualizationMode === 'column' ? 'Flat view' : '3D view'}
            >
              3D
            </button>
            <MapStyleToggle isSatellite={isSatellite} onToggle={() => setIsSatellite((prev) => !prev)} />
            <button
              onClick={() => setShowBathymetry((prev) => !prev)}
              className="map-button"
              aria-pressed={showBathymetry}
              aria-label="Depth contours"
              title="Depth contours"
            >
              <Waves size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <MapClarityPanel
              selectedActivityMetric={selectedActivityMetric}
              showBathymetry={showBathymetry}
              h3Records={transformedH3Data?.length ?? 0}
              groundsFeatures={filteredPdsFishingGroundsData?.features?.length ?? 0}
              yearScope={activityYearScope}
              visualizationMode={visualizationMode}
            />
          </div>

          {locator && (
            <button
              onClick={() => showCountry(locator.target)}
              className="plate group absolute right-4 top-4 z-[1000] hidden w-[252px] px-3 pb-3 pt-2 text-left transition-colors hover:border-primary hover:bg-secondary sm:right-6 sm:top-6 sm:block"
            >
              <span className="block font-serif text-base font-semibold">{locator.title}</span>
              <span className="block text-[13px] text-muted-foreground">{locator.detail}</span>
              <svg width="226" height={locator.height} className="mt-1.5 block" aria-hidden="true">
                {locator.paths.map((d, i) => (
                  <path key={i} d={d} fill="var(--primary)" stroke="var(--card)" strokeWidth="0.4" />
                ))}
              </svg>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded bg-primary px-2.5 py-1 text-[13px] font-semibold text-primary-foreground">
                Show on the map
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </button>
          )}

          {showHint && !selectedFeature && (
            <div className="plate absolute bottom-16 left-4 z-[1000] flex max-w-[300px] items-start gap-2.5 py-2.5 pl-3 pr-2 sm:bottom-auto sm:left-[72px] sm:top-6">
              <MousePointerClick size={20} className="mt-0.5 shrink-0 text-coral" aria-hidden="true" />
              <p className="m-0 text-[15px] font-semibold leading-snug">
                {isMobile ? 'Tap' : 'Click'} a district to open its sheet
                <span className="block text-[13px] font-normal text-muted-foreground">
                  Its catch, price and revenue, and where each figure comes from.
                </span>
              </p>
              <button onClick={dismissHint} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Dismiss hint">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="absolute bottom-4 right-4 z-[1000] sm:bottom-6 sm:right-6">
            <EnhancedLegend
              key={isMobile ? 'mobile' : 'desktop'}
              isSatellite={isSatellite}
              defaultMinimized={isMobile}
              isDarkTheme={isDarkTheme}
              grades={metricStats.grades}
              selectedMetric={selectedMetric}
              selectedActivityMetric={selectedActivityMetric}
              hasGridData={transformedH3Data.length > 0 || filteredPdsFishingGroundsData?.features?.length > 0}
              pdsH3EffortData={transformedH3Data}
              pdsFishingGroundsData={filteredPdsFishingGroundsData}
              activeActivityLayers={activeActivityLayers}
              showBathymetry={showBathymetry}
              dataFreshnessLabel={dataFreshnessLabel}
              surveyPeriodLabel={surveyPeriodLabel}
              yearScope={activityYearScope}
              gpsVisible={gpsVisible}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
