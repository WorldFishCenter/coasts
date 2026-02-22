import React, { useMemo, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { X } from 'lucide-react';
import { SHARED_STYLES } from '../../utils/gridLayerConfig';
import { getMetricInfo, formatRegionName } from '../../utils/formatters';
import { getTimeSeriesForGaul, getTimeSeriesKey } from '../../services/dataService';

const DistributionHistogram = memo(({ 
  isDarkTheme, 
  boundaries, 
  selectedMetric, 
  selectedRegion,
  timeSeriesData,
  onClose,
  style 
}) => {
  // Helper function to extract numeric value from formatted metric string
  const extractNumericValue = (formattedValue) => {
    if (!formattedValue || formattedValue === 'N/A') return 'N/A';
    // Remove currency symbols, units, and extract just the number
    const match = formattedValue.match(/[\d.]+/);
    return match ? match[0] : formattedValue;
  };

  // Calculate density plot data for time series
  const densityData = useMemo(() => {
    if (!boundaries || !boundaries.features || !timeSeriesData || !selectedRegion) return null;

    const { country: selectedCountry, gaul1_name: selectedGaul1, gaul2_name: selectedGaul2 } = selectedRegion.properties;
    const selectedKey = getTimeSeriesKey(selectedCountry, selectedGaul1, selectedGaul2);

    // Get time series for selected region (same key logic as fetch pipeline)
    const selectedTimeSeries = getTimeSeriesForGaul(timeSeriesData, selectedCountry, selectedGaul1, selectedGaul2);
    if (!selectedTimeSeries || !selectedTimeSeries.data) return null;

    // Extract values for selected region
    const selectedValues = selectedTimeSeries.data
      .map(entry => entry[selectedMetric])
      .filter(v => v != null && !isNaN(v));
    if (selectedValues.length === 0) return null;

    // Collect all time series data for other regions (use same key for skip check)
    const otherRegionsData = [];
    boundaries.features.forEach(feature => {
      const { country, gaul1_name, gaul2_name } = feature.properties;
      if (getTimeSeriesKey(country, gaul1_name, gaul2_name) === selectedKey) return;

      const regionTimeSeries = getTimeSeriesForGaul(
        timeSeriesData,
        country,
        gaul1_name,
        gaul2_name
      );
      if (regionTimeSeries?.data) {
        regionTimeSeries.data.forEach(entry => {
          if (entry[selectedMetric] != null && !isNaN(entry[selectedMetric])) {
            otherRegionsData.push(entry[selectedMetric]);
          }
        });
      }
    });

    // Build range from selected + other (allow other to be empty)
    const allValues = otherRegionsData.length > 0 ? [...selectedValues, ...otherRegionsData] : selectedValues;
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;
    const bandwidth = range * 0.15;

    const numPoints = 50;
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = min + (i / numPoints) * range;
      let selectedDensity = 0;
      selectedValues.forEach(value => {
        const u = (x - value) / bandwidth;
        selectedDensity += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
      });
      selectedDensity = selectedDensity / (selectedValues.length * bandwidth);

      let otherDensity = 0;
      if (otherRegionsData.length > 0) {
        otherRegionsData.forEach(value => {
          const u = (x - value) / bandwidth;
          otherDensity += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
        });
        otherDensity = otherDensity / (otherRegionsData.length * bandwidth);
      }

      points.push({
        value: x,
        selectedDensity: selectedDensity * 100,
        otherDensity: otherDensity * 100,
        label: x.toFixed(1)
      });
    }

    const maxSelectedDensity = Math.max(...points.map(p => p.selectedDensity));
    const maxOtherDensity = Math.max(...points.map(p => p.otherDensity));
    const maxDensity = Math.max(maxSelectedDensity, maxOtherDensity, 1);
    points.forEach(p => {
      p.selectedDensity = (p.selectedDensity / maxDensity) * 100;
      p.otherDensity = (p.otherDensity / maxDensity) * 100;
    });

    return {
      points,
      selectedStats: {
        mean: selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length,
        min: Math.min(...selectedValues),
        max: Math.max(...selectedValues),
        count: selectedValues.length
      },
      otherStats: otherRegionsData.length > 0
        ? {
            mean: otherRegionsData.reduce((a, b) => a + b, 0) / otherRegionsData.length,
            min: Math.min(...otherRegionsData),
            max: Math.max(...otherRegionsData),
            count: otherRegionsData.length
          }
        : { mean: 0, min: 0, max: 0, count: 0 },
      min,
      max
    };
  }, [boundaries, selectedMetric, selectedRegion, timeSeriesData]);

  if (!densityData) return null;

  const metricInfo = getMetricInfo(selectedMetric);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div style={{
          ...SHARED_STYLES.glassPanel(isDarkTheme),
          padding: '8px 12px'
        }}>
          <div style={SHARED_STYLES.text.body(isDarkTheme)}>
            Value: {metricInfo.format(parseFloat(data.value))}
          </div>
          {payload.map((entry, index) => (
            <div key={index} style={{
              ...SHARED_STYLES.text.muted(isDarkTheme),
              color: entry.color
            }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      ...SHARED_STYLES.glassPanel(isDarkTheme),
      padding: '20px',
      width: '700px',
      height: '320px',
      ...style
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div>
          <p style={{
            ...SHARED_STYLES.text.muted(isDarkTheme),
            margin: '4px 0 0 0'
          }}>
            {formatRegionName(selectedRegion?.properties)} vs all other districts
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            color: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = isDarkTheme 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={densityData.points} margin={{ top: 5, right: 10, left: 10, bottom: 25 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
            vertical={false}
          />
          
          <XAxis 
            dataKey="value" 
            type="number"
            domain={[densityData.min, densityData.max]}
            tickFormatter={(value) => value.toFixed(1)}
            tick={{ 
              fill: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              fontSize: 10
            }}
            label={{
              value: metricInfo.unit,
              position: 'insideBottom',
              offset: -5,
              style: {
                fill: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                fontSize: 10
              }
            }}
          />
          
          <YAxis 
            label={{ 
              value: 'Density (%)', 
              angle: -90, 
              position: 'insideLeft',
              style: { 
                fill: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                fontSize: 10
              }
            }}
            tick={{ 
              fill: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              fontSize: 10
            }}
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={true}
          />
          
          {/* <Legend 
            wrapperStyle={{
              paddingTop: '5px',
              fontSize: '11px'
            }}
            iconType="line"
          /> */}
          
          {/* Selected district line */}
          <Line 
            name="Selected District"
            type="monotone" 
            dataKey="selectedDensity" 
            stroke={isDarkTheme ? '#60a5fa' : '#3b82f6'}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
          
          {/* Other districts line */}
          <Line 
            name="Other Districts" 
            type="monotone" 
            dataKey="otherDensity" 
            stroke={isDarkTheme ? '#f87171' : '#ef4444'}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats - Horizontal Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginTop: '1px'
      }}>
        {/* Selected District Stats */}
        <div style={{
          backgroundColor: isDarkTheme ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)',
          border: `1px solid ${isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ flex: '0 0 auto' }}>
            <div style={{
              ...SHARED_STYLES.text.label(isDarkTheme),
              fontSize: '12px',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: 0.8,
              color: isDarkTheme ? '#60a5fa' : '#3b82f6'
            }}>
              {formatRegionName(selectedRegion?.properties)}
            </div>
            <div style={{
              ...SHARED_STYLES.text.body(isDarkTheme),
              fontSize: '18px',
              fontWeight: 700,
              color: isDarkTheme ? '#60a5fa' : '#3b82f6'
            }}>
              {extractNumericValue(metricInfo.format(densityData.selectedStats.mean))}
              <span style={{
                fontSize: '11px',
                fontWeight: 400,
                marginLeft: '3px',
                opacity: 0.7
              }}>
                {metricInfo.unit}
              </span>
            </div>
          </div>
          <div style={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingLeft: '12px',
            borderLeft: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                ...SHARED_STYLES.text.muted(isDarkTheme),
                fontSize: '9px',
                marginBottom: '2px'
              }}>
                Range
              </div>
              <div style={{
                ...SHARED_STYLES.text.body(isDarkTheme),
                fontSize: '11px'
              }}>
                {extractNumericValue(metricInfo.format(densityData.selectedStats.min))} - {extractNumericValue(metricInfo.format(densityData.selectedStats.max))}
              </div>
            </div>
            <div>
              <div style={{
                ...SHARED_STYLES.text.muted(isDarkTheme),
                fontSize: '9px',
                marginBottom: '2px'
              }}>
                Samples
              </div>
              <div style={{
                ...SHARED_STYLES.text.body(isDarkTheme),
                fontSize: '14px',
                fontWeight: 600
              }}>
                {densityData.selectedStats.count}
              </div>
            </div>
          </div>
        </div>
        
        {/* Other Districts Stats */}
        <div style={{
          backgroundColor: isDarkTheme ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.06)',
          border: `1px solid ${isDarkTheme ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ flex: '0 0 auto' }}>
            <div style={{
              ...SHARED_STYLES.text.label(isDarkTheme),
              fontSize: '12px',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: 0.8,
              color: isDarkTheme ? '#f87171' : '#ef4444'
            }}>
              Others
            </div>
            <div style={{
              ...SHARED_STYLES.text.body(isDarkTheme),
              fontSize: '18px',
              fontWeight: 700,
              color: isDarkTheme ? '#f87171' : '#ef4444'
            }}>
              {extractNumericValue(metricInfo.format(densityData.otherStats.mean))}
              <span style={{
                fontSize: '11px',
                fontWeight: 400,
                marginLeft: '3px',
                opacity: 0.7
              }}>
                {metricInfo.unit}
              </span>
            </div>
          </div>
          <div style={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingLeft: '12px',
            borderLeft: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                ...SHARED_STYLES.text.muted(isDarkTheme),
                fontSize: '9px',
                marginBottom: '2px'
              }}>
                Range
              </div>
              <div style={{
                ...SHARED_STYLES.text.body(isDarkTheme),
                fontSize: '11px'
              }}>
                {extractNumericValue(metricInfo.format(densityData.otherStats.min))} - {extractNumericValue(metricInfo.format(densityData.otherStats.max))}
              </div>
            </div>
            <div>
              <div style={{
                ...SHARED_STYLES.text.muted(isDarkTheme),
                fontSize: '9px',
                marginBottom: '2px'
              }}>
                Samples
              </div>
              <div style={{
                ...SHARED_STYLES.text.body(isDarkTheme),
                fontSize: '14px',
                fontWeight: 600
              }}>
                {densityData.otherStats.count}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DistributionHistogram; 