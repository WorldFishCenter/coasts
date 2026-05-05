import { useMemo } from 'react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { COLORS } from '../components/map/EnhancedLegend';
import {
  PDS_GROUNDS_COLOR_RANGE,
  PDS_EFFORT_COLOR_RANGE,
  PDS_GROUNDS_OPACITY,
  PDS_EFFORT_OPACITY,
  PDS_EFFORT_COVERAGE,
  PDS_EFFORT_ELEVATION_SCALE,
  PDS_EFFORT_SIZE_RANGE,
  PDS_GROUNDS_UNIQUE_TRIPS_FILTER,
  KEPLER_LAYER_BLENDING,
  getKeplerPdsLayerParameters,
  getQuantileThresholds,
  getColorByQuantile
} from '../utils/pdsOverlayConfig';

export const useMapLayers = ({
  filteredBoundaries,
  selectedMetric,
  metricStats,
  opacity,
  isSatellite,
  isDarkTheme,
  hoveredFeatureIndex,
  visualizationMode,
  pdsFishingGroundsData,
  pdsH3EffortData,
  selectedActivityMetric,
  activeActivityLayers
}) => {
  return useMemo(() => {
    const isAvgHoursMetric = selectedActivityMetric === 'avg_hours_per_day';
    const allLayers = [];
    const showWioRegions = true;
    const showGrounds = activeActivityLayers?.grounds !== false;
    const showEffort = activeActivityLayers?.hexagons !== false;
    const groundsOpacity = PDS_GROUNDS_OPACITY;
    const effortOpacity = PDS_EFFORT_OPACITY;
    const effortExtruded = visualizationMode === 'column';
    const effortElevationScale = PDS_EFFORT_ELEVATION_SCALE;
    const pdsBlendParameters = getKeplerPdsLayerParameters();

    // Add choropleth layer with filtered boundaries
    if (showWioRegions && filteredBoundaries) {
      // Function to get color based on metric value
      const getColorForFeature = (feature) => {
        const value = feature.properties[selectedMetric];
        if (value === null || value === undefined || isNaN(value)) {
          return [0, 0, 0, 0]; // Transparent for NA values
        }
        
        // Find which grade this value falls into
        const { grades } = metricStats;
        let colorIndex = 0;
        for (let i = 0; i < grades.length - 1; i++) {
          if (value >= grades[i] && value < grades[i + 1]) {
            colorIndex = i;
            break;
          } else if (value >= grades[grades.length - 1]) {
            colorIndex = grades.length - 1;
          }
        }
        
        // Convert hex color to RGB
        const hexColor = COLORS[colorIndex];
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        return [r, g, b, 255 * (isSatellite ? opacity * 1.2 : opacity)];
      };

      allLayers.push(
        new GeoJsonLayer({
          id: 'wio-regions',
          data: filteredBoundaries,
          pickable: true,
          stroked: true,
          filled: true,
          getFillColor: getColorForFeature,
          getLineColor: (d, {index}) => {
            const isHovered = hoveredFeatureIndex === index;
            if (isHovered) {
              return isDarkTheme ? [100, 180, 255, 255] : [0, 100, 200, 255];
            }
            return isSatellite 
              ? [255, 255, 255, 230] 
              : (isDarkTheme ? [255, 255, 255, 200] : [0, 0, 0, 200]);
          },
          getLineWidth: (d, {index}) => {
            const isHovered = hoveredFeatureIndex === index;
            return isHovered ? 4 : (isSatellite ? 1 : 1);
          },
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 1,
          lineWidthMaxPixels: 10,
          updateTriggers: {
            getFillColor: [selectedMetric, metricStats, opacity, isSatellite],
            getLineColor: [isSatellite, isDarkTheme, hoveredFeatureIndex],
            getLineWidth: [isSatellite, hoveredFeatureIndex]
          }
        })
      );
    }

    // PDS H3 effort overlay (Kepler-like H3 layer)
    if (showEffort && pdsH3EffortData?.length) {
      const effortValues = pdsH3EffortData
        .map((row) => row?.[selectedActivityMetric])
        .filter((value) => typeof value === 'number' && !isNaN(value));
      const effortQuantiles = getQuantileThresholds(effortValues, PDS_EFFORT_COLOR_RANGE.length);
      const maxEffort = effortValues.length ? Math.max(...effortValues) : 0;
      const minEffort = effortValues.length ? Math.min(...effortValues) : 0;
      const effortRange = maxEffort - minEffort;
      // avg_hours_per_day has a small natural range (0-17) which makes linear
      // normalization against its own max produce bars ~9× taller than fishing_hours
      // at the same percentile. A fixed ceiling of 75 brings column heights into the
      // same visual order as fishing_hours while keeping hotspot differentiation.
      const AVG_HOURS_CEILING = 75;

      allLayers.push(
        new H3HexagonLayer({
          id: 'pds-h3-effort-layer',
          data: pdsH3EffortData,
          pickable: true,
          autoHighlight: true,
          highlightColor: [252, 242, 26, 255],
          extruded: effortExtruded,
          filled: true,
          stroked: false,
          wireframe: false,
          coverage: PDS_EFFORT_COVERAGE,
          opacity: effortOpacity,
          ...(pdsBlendParameters ? { parameters: pdsBlendParameters } : {}),
          getHexagon: (d) => d.h3_index,
          getFillColor: (d) =>
            getColorByQuantile(d?.[selectedActivityMetric], effortQuantiles, PDS_EFFORT_COLOR_RANGE),
          getElevation: (d) => {
            const value = d?.[selectedActivityMetric];
            if (typeof value !== 'number' || isNaN(value) || value <= 0) return 0;
            const [, maxSize] = PDS_EFFORT_SIZE_RANGE;
            if (isAvgHoursMetric) {
              return (value / AVG_HOURS_CEILING) * maxSize;
            }
            if (effortRange <= 0) return 0;
            return ((value - minEffort) / effortRange) * maxSize;
          },
          elevationScale: effortElevationScale,
          updateTriggers: {
            getFillColor: [pdsH3EffortData, effortOpacity, selectedActivityMetric],
            getElevation: [pdsH3EffortData, effortElevationScale, effortExtruded, minEffort, maxEffort, isAvgHoursMetric, selectedActivityMetric],
            parameters: [KEPLER_LAYER_BLENDING, effortOpacity]
          }
        })
      );
    }

    // PDS fishing grounds overlay (Kepler-style geojson choropleth)
    // Draw after H3 layer so grounds remain visible.
    if (showGrounds && pdsFishingGroundsData?.features?.length) {
      // Kepler filter on grounds dataset: unique_trips configured in style filter.
      const filteredGroundsFeatures = pdsFishingGroundsData.features.filter((feature) => {
        const trips = Number(feature?.properties?.unique_trips);
        return (
          Number.isFinite(trips) &&
          trips >= PDS_GROUNDS_UNIQUE_TRIPS_FILTER.min &&
          trips <= PDS_GROUNDS_UNIQUE_TRIPS_FILTER.max
        );
      });
      const groundsValues = filteredGroundsFeatures
        .map((feature) => feature?.properties?.[selectedActivityMetric])
        .filter((value) => typeof value === 'number' && !isNaN(value));
      const groundsQuantiles = getQuantileThresholds(groundsValues, PDS_GROUNDS_COLOR_RANGE.length);

      allLayers.push(
        new GeoJsonLayer({
          id: 'pds-fishing-grounds-layer',
          data: {
            ...pdsFishingGroundsData,
            features: filteredGroundsFeatures
          },
          pickable: true,
          autoHighlight: true,
          highlightColor: [252, 242, 26, 255],
          stroked: false,
          filled: true,
          opacity: groundsOpacity,
          ...(pdsBlendParameters ? { parameters: pdsBlendParameters } : {}),
          getFillColor: (feature) =>
            getColorByQuantile(
              feature?.properties?.[selectedActivityMetric],
              groundsQuantiles,
              PDS_GROUNDS_COLOR_RANGE,
              Math.round(255 * groundsOpacity)
            ),
          updateTriggers: {
            getFillColor: [pdsFishingGroundsData, groundsOpacity, selectedActivityMetric],
            parameters: [KEPLER_LAYER_BLENDING, groundsOpacity]
          }
        })
      );
    }

    return allLayers;
  }, [
    filteredBoundaries,
    selectedMetric,
    metricStats,
    opacity,
    isSatellite,
    isDarkTheme,
    hoveredFeatureIndex,
    visualizationMode,
    pdsFishingGroundsData,
    pdsH3EffortData,
    selectedActivityMetric,
    activeActivityLayers
  ]);
}; 