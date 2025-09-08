import { useMemo } from 'react';
import { GeoJsonLayer, ColumnLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { COLOR_RANGE, getColorForValue } from '../utils/gridLayerConfig';
import { COLORS } from '../components/map/UnifiedLegend';

export const useMapLayers = ({
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
}) => {
  return useMemo(() => {
    const allLayers = [];

    // Add choropleth layer with filtered boundaries
    if (filteredBoundaries) {
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
            return isHovered ? 4 : (isSatellite ? 2 : 1);
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

    // Add PDS grid visualization
    if (transformedPdsData.length > 0) {
      if (visualizationMode === 'column') {
        // Column layer for 3D visualization
        allLayers.push(
          new ColumnLayer({
            id: 'pds-grid-column-layer',
            data: transformedPdsData,
            pickable: true,
            getPosition: d => d.position,
            radius: 500,
            elevationScale: 2500,
            getElevation: d => d.avgTimeHours,
            getFillColor: d => {
              const colorIndex = getColorForValue(d.avgTimeHours);
              const baseColor = COLOR_RANGE[colorIndex];
              const normalizedValue = Math.min(d.avgTimeHours / 12, 1);
              const opacity = 0.3 + (normalizedValue * 0.6);
              return [...baseColor, 255 * opacity];
            },
            opacity: 1,
            material: {
              ambient: 0.64,
              diffuse: 0.6,
              shininess: 32,
              specularColor: [51, 51, 51]
            },
            updateTriggers: {
              getFillColor: [selectedRanges],
              opacity: []
            }
          })
        );
      } else {
        // Heatmap layer for density visualization
        allLayers.push(
          new HeatmapLayer({
            id: 'pds-grid-heatmap-layer',
            data: transformedPdsData || [],
            pickable: true,
            getPosition: d => d.position,
            getWeight: d => {
              if (!d || typeof d.avgTimeHours !== 'number') return 0;
              return Math.max(0, d.avgTimeHours);
            },
            radiusPixels: 40,
            intensity: 1.2,
            threshold: 0.03,
            colorRange: [
              [255, 255, 255, 0],
              [254, 235, 226, 255],
              [252, 197, 192, 255],
              [250, 159, 181, 255],
              [247, 104, 161, 255],
              [221, 52, 151, 255],
              [174, 1, 126, 255]
            ],
            aggregation: 'SUM',
            weightsTextureSize: 1024,
            updateTriggers: {
              getWeight: [selectedRanges],
              data: [transformedPdsData]
            }
          })
        );
      }
    }

    return allLayers;
  }, [
    transformedPdsData,
    selectedRanges,
    filteredBoundaries,
    selectedMetric,
    metricStats,
    opacity,
    isSatellite,
    isDarkTheme,
    hoveredFeatureIndex,
    visualizationMode
  ]);
}; 