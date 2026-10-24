import { useMemo } from 'react';
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { FillStyleExtension } from '@deck.gl/extensions';
import { geoCentroid } from 'd3';
import { getRegionKey } from '../services/dataService';
import { rewindFeature } from '../utils/geoOutline';
import {
  getChoroplethColors,
  getEffortColors,
  getGroundsColors,
  getNoDataColor,
  gradeIndex,
  hexToRgb
} from '../utils/mapPalette';
import {
  PDS_GROUNDS_OPACITY,
  PDS_EFFORT_COVERAGE,
  PDS_EFFORT_ELEVATION_SCALE,
  PDS_EFFORT_SIZE_RANGE,
  PDS_GROUNDS_UNIQUE_TRIPS_FILTER,
  getQuantileThresholds,
  getColorByQuantile
} from '../utils/pdsOverlayConfig';

// Fill pattern atlas: a solid tile for districts with data, a diagonal hatch for districts
// without survey data, so "no data" never reads as a low value.
const PATTERN_SIZE = 16;
const buildPatternAtlas = () => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = PATTERN_SIZE * 2;
  canvas.height = PATTERN_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = -PATTERN_SIZE; i < PATTERN_SIZE * 2; i += 6) {
    ctx.moveTo(PATTERN_SIZE + i, PATTERN_SIZE);
    ctx.lineTo(PATTERN_SIZE + i + PATTERN_SIZE, 0);
  }
  ctx.save();
  ctx.rect(PATTERN_SIZE, 0, PATTERN_SIZE, PATTERN_SIZE);
  ctx.clip();
  ctx.stroke();
  ctx.restore();
  return canvas.toDataURL();
};
const PATTERN_ATLAS = buildPatternAtlas();
const PATTERN_MAPPING = {
  solid: { x: 0, y: 0, width: PATTERN_SIZE, height: PATTERN_SIZE, mask: true },
  hatch: { x: PATTERN_SIZE, y: 0, width: PATTERN_SIZE, height: PATTERN_SIZE, mask: true }
};
const FILL_PATTERN = new FillStyleExtension({ pattern: true });

const EFFORT_OPACITY = 0.85;
// avg_hours_per_day tops out around 7 and is far less outlier-driven than fishing_hours,
// so normalizing against its own max makes mid-range cells tower over the equivalent
// fishing_hours columns. A fixed ceiling damps it instead.
const AVG_HOURS_CEILING = 20;

const isMissing = (value) => value === null || value === undefined || Number.isNaN(Number(value));

export const useMapLayers = ({
  filteredBoundaries,
  selectedMetric,
  metricStats,
  opacity,
  isSatellite,
  isDarkTheme,
  hoveredFeatureIndex,
  selectedRegion,
  gaulLevel,
  visualizationMode,
  pdsFishingGroundsData,
  pdsH3EffortData,
  selectedActivityMetric,
  activeActivityLayers,
  highlightCountry
}) => {
  return useMemo(() => {
    const isAvgHoursMetric = selectedActivityMetric === 'avg_hours_per_day';
    const allLayers = [];
    const showGrounds = activeActivityLayers?.grounds !== false;
    const showEffort = activeActivityLayers?.hexagons !== false;
    const choropleth = getChoroplethColors(isDarkTheme).map(hexToRgb);
    const noData = getNoDataColor(isDarkTheme);
    const fillAlpha = Math.round(255 * Math.min(1, isSatellite ? opacity * 1.2 : opacity));
    // Satellite imagery is dark, so marks drawn over it use the dark-theme colours.
    const onDark = isDarkTheme || isSatellite;
    const ink = onDark ? [255, 255, 255] : [11, 34, 51];
    const coral = onDark ? [230, 159, 141] : [217, 108, 80];
    const edge = isSatellite ? [255, 255, 255, 200] : isDarkTheme ? [18, 24, 25, 220] : [255, 255, 255, 230];

    if (filteredBoundaries) {
      allLayers.push(
        new GeoJsonLayer({
          id: 'wio-regions',
          data: filteredBoundaries,
          pickable: true,
          stroked: true,
          filled: true,
          extensions: PATTERN_ATLAS ? [FILL_PATTERN] : [],
          fillPatternAtlas: PATTERN_ATLAS,
          fillPatternMapping: PATTERN_MAPPING,
          getFillPattern: (feature) => (isMissing(feature.properties[selectedMetric]) ? 'hatch' : 'solid'),
          getFillPatternScale: 1,
          getFillColor: (feature) => {
            const value = feature.properties[selectedMetric];
            if (isMissing(value)) return [...noData, 70];
            return [...choropleth[gradeIndex(value, metricStats.grades)], fillAlpha];
          },
          getLineColor: (d, { index }) => (hoveredFeatureIndex === index ? [...ink, 255] : edge),
          getLineWidth: (d, { index }) => (hoveredFeatureIndex === index ? 2 : 0.75),
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 0.5,
          updateTriggers: {
            getFillColor: [selectedMetric, metricStats, fillAlpha, isDarkTheme],
            getFillPattern: [selectedMetric],
            getLineColor: [isSatellite, isDarkTheme, hoveredFeatureIndex],
            getLineWidth: [hoveredFeatureIndex]
          }
        })
      );
    }

    if (showEffort && pdsH3EffortData?.length) {
      const effortColors = getEffortColors(onDark).map(hexToRgb);
      const effortValues = pdsH3EffortData
        .map((row) => row?.[selectedActivityMetric])
        .filter((value) => typeof value === 'number' && !isNaN(value));
      const effortQuantiles = getQuantileThresholds(effortValues, effortColors.length);
      const maxEffort = effortValues.length ? Math.max(...effortValues) : 0;
      const minEffort = effortValues.length ? Math.min(...effortValues) : 0;
      const effortRange = maxEffort - minEffort;

      allLayers.push(
        new H3HexagonLayer({
          id: 'pds-h3-effort-layer',
          data: pdsH3EffortData,
          pickable: true,
          autoHighlight: true,
          highlightColor: [...coral, 255],
          extruded: visualizationMode === 'column',
          filled: true,
          stroked: false,
          wireframe: false,
          coverage: PDS_EFFORT_COVERAGE,
          opacity: EFFORT_OPACITY,
          material: { ambient: 0.6, diffuse: 0.5, shininess: 8, specularColor: [40, 40, 40] },
          getHexagon: (d) => d.h3_index,
          getFillColor: (d) => getColorByQuantile(d?.[selectedActivityMetric], effortQuantiles, effortColors),
          getElevation: (d) => {
            const value = d?.[selectedActivityMetric];
            if (typeof value !== 'number' || isNaN(value) || value <= 0) return 0;
            const [, maxSize] = PDS_EFFORT_SIZE_RANGE;
            if (isAvgHoursMetric) return (value / AVG_HOURS_CEILING) * maxSize;
            if (effortRange <= 0) return 0;
            return ((value - minEffort) / effortRange) * maxSize;
          },
          elevationScale: PDS_EFFORT_ELEVATION_SCALE,
          updateTriggers: {
            getFillColor: [pdsH3EffortData, selectedActivityMetric, onDark],
            getElevation: [pdsH3EffortData, minEffort, maxEffort, isAvgHoursMetric, selectedActivityMetric]
          }
        })
      );
    }

    // Fishing grounds draw after the effort grid so they stay visible.
    if (showGrounds && pdsFishingGroundsData?.features?.length) {
      const groundsColors = getGroundsColors(onDark).map(hexToRgb);
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
      const groundsQuantiles = getQuantileThresholds(groundsValues, groundsColors.length);

      allLayers.push(
        new GeoJsonLayer({
          id: 'pds-fishing-grounds-layer',
          data: { ...pdsFishingGroundsData, features: filteredGroundsFeatures },
          pickable: true,
          autoHighlight: true,
          highlightColor: [...ink, 90],
          stroked: true,
          filled: true,
          getLineColor: groundsColors[groundsColors.length - 1],
          lineWidthUnits: 'pixels',
          getLineWidth: 0.75,
          getFillColor: (feature) =>
            getColorByQuantile(
              feature?.properties?.[selectedActivityMetric],
              groundsQuantiles,
              groundsColors,
              Math.round(255 * PDS_GROUNDS_OPACITY)
            ),
          updateTriggers: {
            getFillColor: [pdsFishingGroundsData, selectedActivityMetric, onDark],
            getLineColor: [onDark]
          }
        })
      );
    }

    // Hovering a country in the coverage sheet previews where it will take the map.
    if (highlightCountry && filteredBoundaries?.features) {
      allLayers.push(
        new GeoJsonLayer({
          id: 'country-highlight',
          data: {
            type: 'FeatureCollection',
            features: filteredBoundaries.features.filter((feature) => feature.properties.country === highlightCountry)
          },
          pickable: false,
          stroked: true,
          filled: true,
          getFillColor: [...coral, 70],
          getLineColor: [...coral, 255],
          getLineWidth: 2.5,
          lineWidthUnits: 'pixels',
          updateTriggers: { getLineColor: [onDark], getFillColor: [onDark] }
        })
      );
    }

    // The district whose sheet is open, outlined in ink above everything else.
    if (selectedRegion && filteredBoundaries?.features) {
      const selectedKey = getRegionKey(selectedRegion.properties, gaulLevel);
      const selectedFeatures = filteredBoundaries.features.filter(
        (feature) => getRegionKey(feature.properties, gaulLevel) === selectedKey
      );
      allLayers.push(
        new GeoJsonLayer({
          id: 'wio-selection',
          data: { type: 'FeatureCollection', features: selectedFeatures },
          pickable: false,
          stroked: true,
          filled: false,
          getLineColor: [...ink, 255],
          getLineWidth: 3,
          lineWidthUnits: 'pixels',
          updateTriggers: { getLineColor: [onDark] }
        })
      );
      // A coral locator ring, the same mark the district sheet uses for its measurements.
      allLayers.push(
        new ScatterplotLayer({
          id: 'wio-selection-ring',
          data: selectedFeatures.map((feature) => geoCentroid(rewindFeature(feature))),
          pickable: false,
          stroked: true,
          filled: false,
          getPosition: (d) => d,
          getRadius: 14,
          radiusUnits: 'pixels',
          getLineColor: [...coral, 255],
          getLineWidth: 2.5,
          lineWidthUnits: 'pixels',
          updateTriggers: { getLineColor: [onDark] }
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
    selectedRegion,
    gaulLevel,
    visualizationMode,
    pdsFishingGroundsData,
    pdsH3EffortData,
    selectedActivityMetric,
    activeActivityLayers,
    highlightCountry
  ]);
};
