import { useCallback } from 'react';
import { TIME_BREAKS, COLOR_RANGE } from '../utils/gridLayerConfig';
import { getMetricInfo, formatRegionName, formatCountryName } from '../utils/formatters';
import { COLORS } from '../components/map/UnifiedLegend';

export const useMapTooltip = ({
  selectedMetric,
  isDarkTheme,
  metricStats,
  visualizationMode
}) => {
  return useCallback(({object, layer}) => {
    if (!object) return null;

    // Handle GeoJsonLayer (choropleth) tooltips
    if (layer.id === 'wio-regions') {
      const props = object.properties;
      const metricValue = props[selectedMetric];
      const metricInfo = getMetricInfo(selectedMetric);
      
      // Get the color for this value
      let backgroundColor = 'rgba(200, 200, 200, 0.95)'; // Default gray for NA
      let textColor = '#000000';
      
      if (metricValue !== null && metricValue !== undefined && !isNaN(metricValue)) {
        // Find which grade this value falls into
        const { grades } = metricStats;
        let colorIndex = 0;
        for (let i = 0; i < grades.length - 1; i++) {
          if (metricValue >= grades[i] && metricValue < grades[i + 1]) {
            colorIndex = i;
            break;
          } else if (metricValue >= grades[grades.length - 1]) {
            colorIndex = grades.length - 1;
          }
        }
        
        // Convert hex color to RGB
        const hexColor = COLORS[colorIndex];
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        backgroundColor = `rgba(${r}, ${g}, ${b}, 0.95)`;
        
        // Use white text for darker colors (last 3 colors in YlGnBu-8)
        textColor = colorIndex > 4 ? '#ffffff' : '#000000';
      }
      
      return {
        html: `
          <div style="padding: 8px">
            <div style="font-weight: bold; margin-bottom: 4px">${formatRegionName(props)}</div>
            <div>Country: ${formatCountryName(props.country)}</div>
            <div>${metricInfo.label}: ${metricInfo.format(metricValue)}</div>
          </div>
        `,
        style: {
          backgroundColor,
          color: textColor,
          fontSize: '12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }
      };
    }

    // Handle ColumnLayer (PDS grid) tooltips
    if (layer.id === 'pds-grid-column-layer' || layer.id === 'pds-grid-heatmap-layer') {
      const avgTime = object.avgTimeHours;
      const totalVisits = object.totalVisits;
      
      // Determine appropriate styling based on visualization mode
      let backgroundColor;
      let textColor;
      
      if (visualizationMode === 'column') {
        const breakIndex = TIME_BREAKS.findIndex(range => 
          avgTime >= range.min && (range.max === Infinity ? true : avgTime < range.max)
        );
        const cellColor = COLOR_RANGE[breakIndex >= 0 ? breakIndex : 0];
        backgroundColor = `rgba(${cellColor.join(',')}, 0.95)`;
        textColor = breakIndex > 2 ? '#ffffff' : '#000000';
      } else {
        // For heatmap, use a consistent style
        backgroundColor = isDarkTheme ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        textColor = isDarkTheme ? '#ffffff' : '#000000';
      }
      
      return {
        html: `
          <div style="padding: 8px">
            <div><strong>Fishing Activity</strong></div>
            <div>Average time: ${avgTime.toFixed(2)} hours</div>
            <div>Total visits: ${totalVisits}</div>
            <div style="font-size: 11px; margin-top: 4px; opacity: 0.8">
              Location: ${object.position[1].toFixed(3)}°, ${object.position[0].toFixed(3)}°
            </div>
          </div>
        `,
        style: {
          backgroundColor,
          color: textColor,
          fontSize: '12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }
      };
    }

    return null;
  }, [selectedMetric, isDarkTheme, metricStats, visualizationMode]);
}; 