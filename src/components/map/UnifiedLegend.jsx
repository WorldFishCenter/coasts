import React, { memo } from 'react';
import { TIME_BREAKS, COLOR_RANGE, SHARED_STYLES } from '../../utils/gridLayerConfig';
import { getMetricInfo } from '../../utils/formatters';

// Color palette (fixed), numeric stops will be computed dynamically per metric
// YlGnBu-8 palette from https://loading.io/color/feature/YlGnBu-8/
export const COLORS = ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84'];

const UnifiedLegend = memo(({
  isDarkTheme,
  grades,
  selectedMetric,
  colorRange,
  hasGridData,
  visualizationMode
}) => {
  const metricInfo = getMetricInfo(selectedMetric);

  return (
    <div style={{
      ...SHARED_STYLES.glassPanel(isDarkTheme),
      padding: '16px',
      minWidth: '220px'
    }}>
      {/* Metric Legend Section */}
      <div style={{ marginBottom: hasGridData ? '16px' : '0' }}>
        <h4 style={{
          ...SHARED_STYLES.text.subheading(isDarkTheme),
          margin: '0 0 10px 0',
          fontSize: '13px'
        }}>
          {metricInfo.label} {metricInfo.unit && `(${metricInfo.unit})`}
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {grades.map((grade, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{
                width: '18px',
                height: '18px',
                backgroundColor: COLORS[i],
                display: 'inline-block',
                borderRadius: '3px',
                border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
              }} />
              <span style={{
                ...SHARED_STYLES.text.body(isDarkTheme),
                fontSize: '12px'
              }}>
                {grade.toFixed(1)}{i < grades.length - 1 ? ` - ${grades[i + 1].toFixed(1)}` : '+'}                </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fishing Activity Legend Section */}
      {hasGridData && (
        <>
          <div style={{
            borderTop: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            marginBottom: '12px'
          }} />
          <div>
            <h4 style={{
              ...SHARED_STYLES.text.subheading(isDarkTheme),
              margin: '0 0 10px 0',
              fontSize: '13px'
            }}>
              Fishing Activity {visualizationMode === 'heatmap' ? '(Heatmap)' : '(Hours)'}
            </h4>
            {visualizationMode === 'column' ? (
              // Show time ranges for column view
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {TIME_BREAKS.map((range, index) => {
                  const timeValue = range.min + (range.max === Infinity ? 8 : range.max - range.min) / 2;
                  const normalizedValue = Math.min(timeValue / 12, 1);
                  const opacity = 0.3 + (normalizedValue * 0.6);

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{
                        width: '18px',
                        height: '18px',
                        backgroundColor: `rgba(${colorRange[index].join(',')}, ${opacity})`,
                        display: 'inline-block',
                        borderRadius: '3px',
                        border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
                      }} />
                      <span style={{
                        ...SHARED_STYLES.text.body(isDarkTheme),
                        fontSize: '12px'
                      }}>
                        {range.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show heatmap gradient for heatmap view
              <div>
                <div style={{
                  height: '20px',
                  background: `linear-gradient(to right, 
                    rgba(254, 235, 226, 0.1), 
                    rgba(254, 235, 226, 0.5),
                    rgba(252, 197, 192, 0.7),
                    rgba(250, 159, 181, 0.8),
                    rgba(247, 104, 161, 0.9),
                    rgba(221, 52, 151, 1),
                    rgba(174, 1, 126, 1)
                  )`,
                  borderRadius: '4px',
                  marginBottom: '8px',
                  border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
                }} />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  ...SHARED_STYLES.text.muted(isDarkTheme),
                  fontSize: '11px'
                }}>
                  <span>Low Activity</span>
                  <span>High Activity</span>
                </div>
                <div style={{
                  textAlign: 'center',
                  marginTop: '4px',
                  ...SHARED_STYLES.text.muted(isDarkTheme),
                  fontSize: '10px',
                  fontStyle: 'italic'
                }}>
                  Intensity based on fishing effort (hours)
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

export default UnifiedLegend; 