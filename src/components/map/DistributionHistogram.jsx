import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { X } from 'lucide-react';
import { SHARED_STYLES } from '../../utils/gridLayerConfig';
import { getMetricInfo, formatRegionName } from '../../utils/formatters';

const DistributionHistogram = ({ 
  isDarkTheme, 
  boundaries, 
  selectedMetric, 
  selectedRegion,
  onClose,
  style 
}) => {
  // Calculate density plot data
  const densityData = useMemo(() => {
    if (!boundaries || !boundaries.features) return null;

    // Extract all values for the selected metric
    const allValues = boundaries.features
      .map(f => f.properties[selectedMetric])
      .filter(v => v !== null && v !== undefined && !isNaN(v));

    if (allValues.length === 0) return null;

    // Get selected region's value
    const selectedValue = selectedRegion?.properties[selectedMetric];

    // Calculate statistics
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    
    // Create more points for smooth curve
    const numPoints = 50;
    const bandwidth = range * 0.1; // Bandwidth for kernel density estimation
    
    // Calculate density using Gaussian kernel
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = min + (i / numPoints) * range;
      let density = 0;
      
      // Gaussian kernel density estimation
      allValues.forEach(value => {
        const u = (x - value) / bandwidth;
        density += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
      });
      
      density = density / (allValues.length * bandwidth);
      
      points.push({
        value: x,
        density: density,
        label: x.toFixed(1)
      });
    }

    // Find max density for scaling
    const maxDensity = Math.max(...points.map(p => p.density));
    
    // Normalize densities to percentage
    points.forEach(p => {
      p.density = (p.density / maxDensity) * 100;
    });

    // Add selected value density
    if (selectedValue != null) {
      let selectedDensity = 0;
      allValues.forEach(value => {
        const u = (selectedValue - value) / bandwidth;
        selectedDensity += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
      });
      selectedDensity = (selectedDensity / (allValues.length * bandwidth) / maxDensity) * 100;
      
      // Find closest point to insert selected value info
      const closestIndex = points.findIndex(p => p.value >= selectedValue);
      if (closestIndex >= 0) {
        points[closestIndex].isSelected = true;
        points[closestIndex].selectedDensity = selectedDensity;
      }
    }

    return {
      points,
      selectedValue,
      totalRegions: allValues.length,
      metricName: selectedMetric,
      min,
      max
    };
  }, [boundaries, selectedMetric, selectedRegion]);

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
          <div style={SHARED_STYLES.text.muted(isDarkTheme)}>
            Density: {data.density.toFixed(1)}%
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      ...SHARED_STYLES.glassPanel(isDarkTheme),
      padding: '20px',
      width: '600px',
      height: '280px',
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
          <h3 style={{
            ...SHARED_STYLES.text.heading(isDarkTheme),
            margin: 0
          }}>
            Distribution Analysis
          </h3>
          <p style={{
            ...SHARED_STYLES.text.muted(isDarkTheme),
            margin: '4px 0 0 0'
          }}>
            {formatRegionName(selectedRegion?.properties)} compared to all regions
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

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '12px',
        ...SHARED_STYLES.text.muted(isDarkTheme)
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '24px',
            height: '12px',
            background: isDarkTheme 
              ? 'linear-gradient(to right, rgba(147, 197, 253, 0.2), rgba(147, 197, 253, 0.6))' 
              : 'linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.6))',
            borderRadius: '2px'
          }} />
          <span>Density distribution</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '4px',
            height: '12px',
            backgroundColor: '#ef4444',
            borderStyle: 'dashed',
            borderWidth: '0 1px',
            borderColor: '#ef4444'
          }} />
          <span>Selected value</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={densityData.points} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
          <defs>
            <linearGradient id="densityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={isDarkTheme ? '#93c5fd' : '#3b82f6'} 
                stopOpacity={0.8}
              />
              <stop 
                offset="95%" 
                stopColor={isDarkTheme ? '#93c5fd' : '#3b82f6'} 
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          
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
              fontSize: 11
            }}
            label={{
              value: metricInfo.unit,
              position: 'insideBottom',
              offset: -5,
              style: {
                fill: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                fontSize: 11
              }
            }}
          />
          
          <YAxis 
            label={{ 
              value: 'Density', 
              angle: -90, 
              position: 'insideLeft',
              style: { 
                fill: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                fontSize: 11
              }
            }}
            tick={{ 
              fill: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              fontSize: 11
            }}
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={false}
          />
          
          {/* Density curve */}
          <Area 
            type="monotone" 
            dataKey="density" 
            stroke={isDarkTheme ? '#93c5fd' : '#3b82f6'}
            strokeWidth={2}
            fill="url(#densityGradient)"
          />

          {/* Reference line for selected value */}
          {densityData.selectedValue != null && (
            <ReferenceLine 
              x={densityData.selectedValue}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: metricInfo.format(densityData.selectedValue),
                position: "top",
                fill: "#ef4444",
                fontSize: 11,
                offset: 10
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <div style={SHARED_STYLES.text.muted(isDarkTheme)}>
          Selected value: <span style={SHARED_STYLES.text.body(isDarkTheme)}>
            {densityData.selectedValue !== null && densityData.selectedValue !== undefined ? metricInfo.format(densityData.selectedValue) : 'N/A'}
          </span>
        </div>
        <div style={SHARED_STYLES.text.muted(isDarkTheme)}>
          Range: <span style={SHARED_STYLES.text.body(isDarkTheme)}>
            {metricInfo.format(densityData.min)} - {metricInfo.format(densityData.max)}
          </span>
        </div>
        <div style={SHARED_STYLES.text.muted(isDarkTheme)}>
          Total regions: <span style={SHARED_STYLES.text.body(isDarkTheme)}>
            {densityData.totalRegions}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DistributionHistogram; 