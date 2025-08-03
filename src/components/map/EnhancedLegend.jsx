import React, { memo, useState } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { TIME_BREAKS, COLOR_RANGE } from '../../utils/gridLayerConfig';
import { getMetricInfo } from '../../utils/formatters';

// Modern color palette for metrics
export const COLORS = ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84'];

const EnhancedLegend = memo(({
  isDarkTheme,
  grades,
  selectedMetric,
  colorRange,
  hasGridData,
  visualizationMode
}) => {
  const [expandedSections, setExpandedSections] = useState({
    metrics: true,
    activity: true
  });
  const [isMinimized, setIsMinimized] = useState(false);

  const metricInfo = getMetricInfo(selectedMetric);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionHeader = ({ title, isExpanded, onToggle, icon }) => (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 0',
        cursor: 'pointer',
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        marginBottom: isExpanded ? '8px' : '0',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isDarkTheme 
          ? 'rgba(255, 255, 255, 0.03)' 
          : 'rgba(0, 0, 0, 0.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon}
        <h4 style={{
          margin: 0,
          fontSize: '11px',
          fontWeight: 600,
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
          textTransform: 'uppercase',
          letterSpacing: '0.3px'
        }}>
          {title}
        </h4>
      </div>
      <ChevronDown 
        size={14} 
        style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
        }}
      />
    </div>
  );

  const ColorSwatch = ({ color, size = 'normal' }) => {
    const dimensions = size === 'small' ? '14px' : '18px';
    return (
      <div style={{
        width: dimensions,
        height: dimensions,
        backgroundColor: color,
        borderRadius: '3px',
        border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        flexShrink: 0
      }} />
    );
  };

  const GradientBar = ({ colors, height = '8px' }) => (
    <div style={{
      height,
      background: `linear-gradient(to right, ${colors.map(color => 
        typeof color === 'string' ? color : `rgba(${color.join(',')}, 0.8)`
      ).join(', ')})`,
      borderRadius: '4px',
      border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
    }} />
  );

  if (isMinimized) {
    return (
      <div style={{
        backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: '6px',
        border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: isDarkTheme 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '8px',
        cursor: 'pointer'
      }}
      onClick={() => setIsMinimized(false)}
      >
        <Eye size={16} style={{ 
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' 
        }} />
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      borderRadius: '8px',
      border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      boxShadow: isDarkTheme 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '12px',
      minWidth: '200px',
      maxWidth: '220px'
    }}>
      {/* Header with minimize button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 600,
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
        }}>
          Legend
        </h3>
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkTheme 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <EyeOff size={14} />
        </button>
      </div>

      {/* Metric Legend Section */}
      <div style={{ marginBottom: hasGridData ? '10px' : '0' }}>
        <SectionHeader
          title={`${metricInfo.label} ${metricInfo.unit ? `(${metricInfo.unit})` : ''}`}
          isExpanded={expandedSections.metrics}
          onToggle={() => toggleSection('metrics')}
          icon={<div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6'
          }} />}
        />

        {expandedSections.metrics && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '6px',
            paddingLeft: '2px'
          }}>
            {/* Gradient bar for overall visualization */}
            <div style={{ marginBottom: '6px' }}>
              <GradientBar colors={COLORS.slice(0, grades.length)} height="8px" />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '3px',
                fontSize: '10px',
                color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
              }}>
                <span>{grades[0]?.toFixed(1) || '0'}</span>
                <span>{grades[grades.length - 1]?.toFixed(1) || '0'}+</span>
              </div>
            </div>

            {/* Individual ranges */}
            {grades.map((grade, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkTheme 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ColorSwatch color={COLORS[i]} size="small" />
                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: isDarkTheme ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                }}>
                  {grade.toFixed(1)}{i < grades.length - 1 ? ` - ${grades[i + 1].toFixed(1)}` : '+'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fishing Activity Legend Section */}
      {hasGridData && (
        <div>
          <SectionHeader
            title={`Activity ${visualizationMode === 'heatmap' ? '(Heatmap)' : '(Hours)'}`}
            isExpanded={expandedSections.activity}
            onToggle={() => toggleSection('activity')}
            icon={<div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981'
            }} />}
          />

          {expandedSections.activity && (
            <div style={{ paddingLeft: '2px' }}>
              {visualizationMode === 'column' ? (
                <div>
                  {/* Gradient overview for column view */}
                  <div style={{ marginBottom: '8px' }}>
                    <GradientBar 
                      colors={COLOR_RANGE.map(color => `rgba(${color.join(',')}, 0.8)`)} 
                      height="8px" 
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '3px',
                      fontSize: '10px',
                      color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                    }}>
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  {/* Time ranges */}
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
                            gap: '6px',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDarkTheme 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.03)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <ColorSwatch 
                            color={`rgba(${colorRange[index].join(',')}, ${opacity})`} 
                            size="small" 
                          />
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: isDarkTheme ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                          }}>
                            {range.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Heatmap view
                <div>
                  <div style={{ marginBottom: '6px' }}>
                    <GradientBar 
                      colors={[
                        'rgba(254, 235, 226, 0.2)', 
                        'rgba(254, 235, 226, 0.5)',
                        'rgba(252, 197, 192, 0.7)',
                        'rgba(250, 159, 181, 0.8)',
                        'rgba(247, 104, 161, 0.9)',
                        'rgba(221, 52, 151, 1)',
                        'rgba(174, 1, 126, 1)'
                      ]} 
                      height="8px" 
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                    marginBottom: '4px'
                  }}>
                    <span>Low Activity</span>
                    <span>High Activity</span>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: '9px',
                    color: isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    fontStyle: 'italic'
                  }}>
                    Intensity based on fishing effort (hours)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

EnhancedLegend.displayName = 'EnhancedLegend';

export default EnhancedLegend;