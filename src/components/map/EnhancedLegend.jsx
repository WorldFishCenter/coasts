import React, { memo, useState } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { COLOR_RANGE, ACTIVITY_METRICS } from '../../utils/gridLayerConfig';
import { getMetricInfo } from '../../utils/formatters';
import { PDS_EFFORT_COLOR_HEX, PDS_GROUNDS_COLOR_HEX } from '../../utils/pdsOverlayConfig';

// Modern color palette for metrics
export const COLORS = ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84'];

const EnhancedLegend = memo(({
  isDarkTheme,
  grades,
  selectedMetric,
  selectedActivityMetric,
  colorRange,
  hasGridData,
  pdsH3EffortData,
  pdsFishingGroundsData,
  activeActivityLayers,
  visualizationMode,
  showBathymetry = false,
  dataFreshnessLabel = 'Latest available export'
}) => {
  const [expandedSections, setExpandedSections] = useState({
    metrics: true,
    activity: true,
    grounds: true,
    bathymetry: true
  });
  const [isMinimized, setIsMinimized] = useState(false);

  const metricInfo = getMetricInfo(selectedMetric);
  const activeMetricConfig = ACTIVITY_METRICS.find(m => m.id === selectedActivityMetric) || ACTIVITY_METRICS[0];

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

  const formatGradeValue = (value) => {
    if (!Number.isFinite(value)) return '0';
    const absValue = Math.abs(value);
    if (absValue >= 100) return value.toFixed(0);
    if (absValue >= 10) return value.toFixed(1);
    if (absValue >= 1) return value.toFixed(2);
    return value.toFixed(3);
  };

  if (isMinimized) {
    return (
      <div
        className="glass-panel p-2.5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors backdrop-blur-xl border border-border/50 group"
        onClick={() => setIsMinimized(false)}
      >
        <Eye size={16} className="text-foreground/70 group-hover:text-primary transition-colors" />
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 rounded-2xl min-w-[200px] max-w-[220px]">
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
        <a
          href="/docs#layer-interpretation"
          style={{ fontSize: '10px', color: 'var(--primary)', textDecoration: 'none', marginRight: '6px' }}
        >
          Guide
        </a>
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
          icon={<div className="w-2 h-2 rounded-full bg-primary" />}
        />

        {expandedSections.metrics && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            paddingLeft: '2px'
          }}>
            <div style={{
              fontSize: '10px',
              color: isDarkTheme ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
              lineHeight: 1.4
            }}>
              Colors represent quantile classes for the selected metric and selected year filter.
            </div>
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
                <span>{formatGradeValue(grades[0])}</span>
                <span>{formatGradeValue(grades[grades.length - 1])}+</span>
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
                  {formatGradeValue(grade)}{i < grades.length - 1 ? ` - ${formatGradeValue(grades[i + 1])}` : '+'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fishing Activity Legend Section */}
      {hasGridData && (
        <>
          {/* H3 Effort Legend */}
          {activeActivityLayers?.hexagons !== false && pdsH3EffortData?.length > 0 && (() => {
            const values = pdsH3EffortData.map(d => d[selectedActivityMetric]).filter(v => typeof v === 'number');
            const min = values.length ? Math.min(...values) : 0;
            const max = values.length ? Math.max(...values) : 0;
            return (
              <div>
                <SectionHeader
                  title="Local Fishing Activity"
                  isExpanded={expandedSections.activity}
                  onToggle={() => toggleSection('activity')}
                  icon={<div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: PDS_EFFORT_COLOR_HEX[PDS_EFFORT_COLOR_HEX.length - 1]
                  }} />}
                />

                {expandedSections.activity && (
                  <div style={{ paddingLeft: '2px', marginBottom: '10px' }}>
                    <div style={{
                      fontSize: '10px',
                      marginBottom: '4px',
                      color: isDarkTheme ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)'
                    }}>
                      H3 cells are colored by quantile and extruded in column mode.
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: isDarkTheme ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
                      }}>
                        {activeMetricConfig.label}
                      </div>
                      <GradientBar
                        colors={PDS_EFFORT_COLOR_HEX}
                        height="8px"
                      />
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '3px',
                        fontSize: '10px',
                        color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                      }}>
                        <span>{min > 1000 ? `${(min/1000).toFixed(1)}k` : min.toFixed(1)}</span>
                        <span>{max > 1000 ? `${(max/1000).toFixed(1)}k` : max.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Fishing Grounds Legend */}
          {activeActivityLayers?.grounds !== false && pdsFishingGroundsData?.features?.length > 0 && (() => {
            const values = pdsFishingGroundsData.features.map(f => f.properties[selectedActivityMetric]).filter(v => typeof v === 'number');
            const min = values.length ? Math.min(...values) : 0;
            const max = values.length ? Math.max(...values) : 0;
            return (
              <div>
                <SectionHeader
                  title="Fishing Grounds"
                  isExpanded={expandedSections.grounds}
                  onToggle={() => toggleSection('grounds')}
                  icon={<div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: PDS_GROUNDS_COLOR_HEX[PDS_GROUNDS_COLOR_HEX.length - 1]
                  }} />}
                />

                {expandedSections.grounds && (
                  <div style={{ paddingLeft: '2px', marginBottom: '10px' }}>
                    <div style={{
                      fontSize: '10px',
                      marginBottom: '4px',
                      color: isDarkTheme ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)'
                    }}>
                      Grounds polygons use the same metric with quantile bins after trips filtering.
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: isDarkTheme ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
                      }}>
                        {activeMetricConfig.label}
                      </div>
                      <GradientBar
                        colors={PDS_GROUNDS_COLOR_HEX}
                        height="8px"
                      />
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '3px',
                        fontSize: '10px',
                        color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                      }}>
                        <span>{min > 1000 ? `${(min/1000).toFixed(1)}k` : min.toFixed(1)}</span>
                        <span>{max > 1000 ? `${(max/1000).toFixed(1)}k` : max.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* Bathymetry Legend Section */}
      {showBathymetry && (
        <div style={{ marginTop: (hasGridData ? '10px' : '0') }}>
          <SectionHeader
            title="Bathymetry (Depth m)"
            isExpanded={expandedSections.bathymetry}
            onToggle={() => toggleSection('bathymetry')}
            icon={<div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#55a9df' }} />}
          />

          {expandedSections.bathymetry && (
            <div style={{ paddingLeft: '2px' }}>
              <div style={{ marginBottom: '8px' }}>
                <GradientBar
                  colors={['#84d2f6', '#55a9df', '#2f7eb8', '#255c95', '#1e3f72', '#172f58']}
                  height="8px"
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '3px',
                  fontSize: '10px',
                  color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                }}>
                  <span>10m</span>
                  <span>2000m</span>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
      <div style={{
        marginTop: '10px',
        fontSize: '10px',
        color: isDarkTheme ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
      }}>
        Data as of: {dataFreshnessLabel}
      </div>
    </div>
  );
});

EnhancedLegend.displayName = 'EnhancedLegend';

export default EnhancedLegend;