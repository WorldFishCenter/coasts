import { useCallback } from 'react';
import { getMetricInfo, formatRegionName, formatCountryName } from '../utils/formatters';
import { COLORS } from '../components/map/EnhancedLegend';
import { ACTIVITY_METRIC_METADATA } from '../utils/metricMetadata';

export const useMapTooltip = ({
  selectedMetric,
  selectedActivityMetric = 'fishing_hours',
  isDarkTheme,
  metricStats
}) => {
  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  return useCallback(({object, layer}) => {
    if (!object) return null;
    const selectedActivityLabel = ACTIVITY_METRIC_METADATA[selectedActivityMetric]?.label ?? selectedActivityMetric;
    const formatActivityValue = (value) => {
      if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
      const formatter = ACTIVITY_METRIC_METADATA[selectedActivityMetric]?.format;
      if (formatter) return formatter(Number(value));
      return Number(value).toFixed(2);
    };

    // Handle GeoJsonLayer (choropleth) tooltips
    if (layer.id === 'wio-regions') {
      const props = object.properties;
      const metricValue = props[selectedMetric];
      const metricInfo = getMetricInfo(selectedMetric);
      const isFishersMetric = selectedMetric.startsWith('fishers_');
      const isBoatsMetric = selectedMetric === 'boats_total';
      
      // Get the color for this value
      let backgroundColor = isDarkTheme ? 'rgba(60, 60, 60, 0.95)' : 'rgba(240, 240, 240, 0.95)'; // Neutral background for NA
      let textColor = isDarkTheme ? '#ffffff' : '#000000';
      
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
            <div style="font-weight: bold; margin-bottom: 4px">${escapeHtml(formatRegionName(props))}</div>
            <div>Country: ${escapeHtml(formatCountryName(props.country))}</div>
            <div>${metricInfo.label}: ${metricInfo.format(metricValue)}</div>
            ${isFishersMetric ? `<div style="margin-top: 4px">Male: ${getMetricInfo('fishers_male').format(props.fishers_male)}</div>
            <div>Female: ${getMetricInfo('fishers_female').format(props.fishers_female)}</div>
            <div>Total: ${getMetricInfo('fishers_total').format(props.fishers_total)}</div>` : ''}
            ${isBoatsMetric ? `<div style="margin-top: 4px">Boats Total: ${getMetricInfo('boats_total').format(props.boats_total)}</div>` : ''}
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



    if (layer.id === 'pds-fishing-grounds-layer') {
      const props = object.properties || {};
      const groundContextRows = [
        `<div>Area: ${(props.area_km2 ?? 0).toFixed?.(2) ?? '0.00'} km²</div>`,
        selectedActivityMetric !== 'fishing_hours'
          ? `<div>Total Hours: ${(props.fishing_hours ?? 0).toLocaleString?.(undefined, {maximumFractionDigits: 1}) ?? '0'} h</div>`
          : '',
        selectedActivityMetric !== 'unique_trips'
          ? `<div>Unique Trips: ${(props.unique_trips ?? 0).toLocaleString?.() ?? '0'}</div>`
          : '',
        selectedActivityMetric !== 'n_active_days'
          ? `<div>Active Days: ${(props.n_active_days ?? 0).toLocaleString?.() ?? '0'}</div>`
          : '',
      ].join('');
      return {
        html: `
          <div style="padding: 8px">
            <div><strong>Designated Fishing Ground</strong></div>
            <div style="margin-top: 4px;">${escapeHtml(selectedActivityLabel)}: ${formatActivityValue(props[selectedActivityMetric])}</div>
            ${groundContextRows}
          </div>
        `,
        style: {
          backgroundColor: isDarkTheme ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          color: isDarkTheme ? '#ffffff' : '#000000',
          fontSize: '12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }
      };
    }

    if (layer.id === 'pds-h3-effort-layer') {
      const contextRows = [
        selectedActivityMetric !== 'fishing_hours'
          ? `<div>Total Hours: ${(object.fishing_hours ?? 0).toLocaleString?.(undefined, {maximumFractionDigits: 1}) ?? '0'} h</div>`
          : '',
        selectedActivityMetric !== 'unique_trips'
          ? `<div>Unique Trips: ${(object.unique_trips ?? 0).toLocaleString?.() ?? '0'}</div>`
          : '',
        selectedActivityMetric !== 'n_active_days'
          ? `<div>Active Days: ${(object.n_active_days ?? 0).toLocaleString?.() ?? '0'}</div>`
          : '',
      ].join('');
      return {
        html: `
          <div style="padding: 8px">
            <div><strong>Fishing Activity Cell</strong></div>
            <div style="margin-top: 4px;">${escapeHtml(selectedActivityLabel)}: ${formatActivityValue(object[selectedActivityMetric])}</div>
            ${contextRows}
          </div>
        `,
        style: {
          backgroundColor: isDarkTheme ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          color: isDarkTheme ? '#ffffff' : '#000000',
          fontSize: '12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }
      };
    }

    return null;
  }, [selectedMetric, selectedActivityMetric, isDarkTheme, metricStats]);
}; 