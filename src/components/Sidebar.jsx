import { memo, useMemo, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { 
  SHARED_STYLES, 
  TIME_BREAKS, 
  COLOR_RANGE,
  calculateGridStats 
} from '../utils/gridLayerConfig';
import { METRIC_CONFIG, formatRegionName, formatCountryName } from '../utils/formatters';
import { 
  Filter, 
  BarChart3, 
  Layers, 
  ChevronDown, 
  ChevronRight,
  Info,
  Globe,
  Activity
} from 'lucide-react';

const METRICS = Object.entries(METRIC_CONFIG).map(([id, config]) => ({
  id,
  label: config.label,
  unit: config.unit,
  description: config.description || `${config.label} measurement`
}));

// Section Header Component
const SectionHeader = ({ title, icon: Icon, isDarkTheme, isExpanded, onToggle, subtitle }) => (
  <div 
    onClick={onToggle}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: isExpanded ? '12px' : '0',
      border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = isDarkTheme 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.04)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = isDarkTheme 
        ? 'rgba(255, 255, 255, 0.03)' 
        : 'rgba(0, 0, 0, 0.02)';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Icon size={18} style={{ color: isDarkTheme ? '#60a5fa' : '#3b82f6' }} />
      <div>
        <h3 style={{
          ...SHARED_STYLES.text.heading(isDarkTheme),
          margin: 0,
          fontSize: '14px',
          fontWeight: 600
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{
            ...SHARED_STYLES.text.muted(isDarkTheme),
            margin: '2px 0 0 0',
            fontSize: '11px'
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
  </div>
);

// Time Range Button Component (from GridInfoPanel)
const TimeRangeButton = ({ range, index, isSelected, colorRange, isDarkTheme, onToggle }) => {
  const timeValue = range.min + (range.max === Infinity ? 8 : range.max - range.min) / 2;
  const normalizedValue = Math.min(timeValue / 12, 1);
  const opacity = 0.3 + (normalizedValue * 0.6);
  
  return (
    <div
      onClick={() => onToggle(range)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        cursor: 'pointer',
        backgroundColor: isSelected ? 
          (isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)') : 
          'transparent',
        borderRadius: '6px',
        opacity: isSelected ? 1 : 0.7,
        transition: SHARED_STYLES.transitions.default,
        border: `1px solid ${isSelected 
          ? (isDarkTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)') 
          : 'transparent'}`
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = isDarkTheme 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.03)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: `rgba(${colorRange[index].join(',')}, ${opacity})`,
          marginRight: '8px',
          borderRadius: '3px',
          border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`
        }}
      />
      <span style={{ 
        ...SHARED_STYLES.text.body(isDarkTheme),
        fontSize: '13px'
      }}>
        {range.label}
      </span>
    </div>
  );
};

const Sidebar = memo(({
  isDarkTheme,
  isMobile,
  isOpen,
  boundaries,
  selectedMetric,
  onMetricChange,
  opacity,
  onOpacityChange,
  // Grid data props
  transformedPdsData,
  selectedRanges,
  onRangeToggle,
  // New comparison props
  selectedRegions = [],
  onRegionSelect,
  onRegionRemove,
  // Filter props
  selectedCountries = [],
  onCountryToggle
}) => {
  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    metrics: true,
    gridActivity: true,
    filters: false,
    comparison: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate grid statistics
  const gridStats = useMemo(() => {
    return calculateGridStats(transformedPdsData);
  }, [transformedPdsData]);

  // Get unique countries from boundaries
  const availableCountries = useMemo(() => {
    if (!boundaries || !boundaries.features) return [];
    const countries = [...new Set(boundaries.features.map(f => f.properties.country))];
    return countries.filter(Boolean).sort();
  }, [boundaries]);

  // Filter regions by selected countries
  const filteredRegions = useMemo(() => {
    if (!boundaries || !boundaries.features) return [];
    if (selectedCountries.length === 0) return boundaries.features;
    return boundaries.features.filter(f => 
      selectedCountries.includes(f.properties.country)
    );
  }, [boundaries, selectedCountries]);

  const containerStyle = {
    width: isOpen ? (isMobile ? '100%' : '420px') : '0',
    height: '100%',
    minHeight: 0,
    transform: isOpen ? 'translateX(0)' : `translateX(${isMobile ? '-100%' : '-420px'})`,
    ...SHARED_STYLES.glassPanel(isDarkTheme),
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 1000,
    overflow: 'hidden'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        flexShrink: 0
      }}>
        <h2 style={{
          ...SHARED_STYLES.text.heading(isDarkTheme),
          margin: 0,
          fontSize: '18px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Layers size={20} />
          Analysis Controls
        </h2>
        <p style={{
          ...SHARED_STYLES.text.muted(isDarkTheme),
          margin: '4px 0 0 0',
          fontSize: '13px'
        }}>
          Configure metrics, filters, and comparisons
        </p>
      </div>

      {/* Scrollable Content */}
      <SimpleBar style={{ flex: 1, minHeight: 0, padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Metrics Section */}
          <div>
            <SectionHeader
              title="Metrics"
              subtitle="Select data to visualize"
              icon={BarChart3}
              isDarkTheme={isDarkTheme}
              isExpanded={expandedSections.metrics}
              onToggle={() => toggleSection('metrics')}
            />
            
            {expandedSections.metrics && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {METRICS.map(metric => {
                  const isActive = selectedMetric === metric.id;
                  return (
                    <div
                      key={metric.id}
                      onClick={() => onMetricChange(metric.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: isActive 
                          ? (isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
                          : (isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                        border: `1px solid ${isActive 
                          ? (isDarkTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)')
                          : (isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')}`,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = isDarkTheme 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.04)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = isDarkTheme 
                            ? 'rgba(255, 255, 255, 0.03)' 
                            : 'rgba(0, 0, 0, 0.02)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{
                            ...SHARED_STYLES.text.body(isDarkTheme),
                            margin: 0,
                            fontWeight: 600,
                            fontSize: '14px'
                          }}>
                            {metric.label}
                          </h4>
                          <p style={{
                            ...SHARED_STYLES.text.muted(isDarkTheme),
                            margin: '2px 0 0 0',
                            fontSize: '12px'
                          }}>
                            {metric.description}
                          </p>
                        </div>
                        <span style={{
                          ...SHARED_STYLES.text.label(isDarkTheme),
                          fontSize: '11px',
                          padding: '2px 8px',
                          backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          borderRadius: '4px'
                        }}>
                          {metric.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Opacity Control */}
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '6px',
                  border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{
                      ...SHARED_STYLES.text.body(isDarkTheme),
                      fontSize: '13px',
                      fontWeight: 500
                    }}>
                      Layer Opacity
                    </label>
                    <span style={{
                      ...SHARED_STYLES.text.muted(isDarkTheme),
                      fontSize: '12px'
                    }}>
                      {(opacity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    value={opacity * 100} 
                    onChange={(e) => onOpacityChange(Number(e.target.value) / 100)} 
                    style={{ 
                      width: '100%', 
                      accentColor: isDarkTheme ? '#3b82f6' : '#2563eb',
                      cursor: 'pointer'
                    }} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Grid Activity Section */}
          <div>
            <SectionHeader
              title="Fishing Activity"
              subtitle={`${gridStats.totalCells.toLocaleString()} grid cells detected`}
              icon={Activity}
              isDarkTheme={isDarkTheme}
              isExpanded={expandedSections.gridActivity}
              onToggle={() => toggleSection('gridActivity')}
            />
            
            {expandedSections.gridActivity && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Grid Statistics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    padding: '10px',
                    backgroundColor: isDarkTheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                    borderRadius: '6px',
                    border: `1px solid ${isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`
                  }}>
                    <div style={{
                      ...SHARED_STYLES.text.muted(isDarkTheme),
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Avg Time
                    </div>
                    <div style={{
                      ...SHARED_STYLES.text.body(isDarkTheme),
                      fontSize: '16px',
                      fontWeight: 600,
                      marginTop: '2px'
                    }}>
                      {gridStats.avgTime.toFixed(2)}h
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '10px',
                    backgroundColor: isDarkTheme ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
                    borderRadius: '6px',
                    border: `1px solid ${isDarkTheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)'}`
                  }}>
                    <div style={{
                      ...SHARED_STYLES.text.muted(isDarkTheme),
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Total Visits
                    </div>
                    <div style={{
                      ...SHARED_STYLES.text.body(isDarkTheme),
                      fontSize: '16px',
                      fontWeight: 600,
                      marginTop: '2px'
                    }}>
                      {gridStats.totalVisits.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Time Range Filters */}
                <div>
                  <div style={{
                    ...SHARED_STYLES.text.label(isDarkTheme),
                    marginBottom: '8px',
                    fontSize: '12px'
                  }}>
                    FILTER BY TIME SPENT
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {TIME_BREAKS.map((range, index) => (
                      <TimeRangeButton
                        key={`${range.min}-${range.max}`}
                        range={range}
                        index={index}
                        isSelected={selectedRanges.some(r => r.min === range.min && r.max === range.max)}
                        colorRange={COLOR_RANGE}
                        isDarkTheme={isDarkTheme}
                        onToggle={onRangeToggle}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Country Filter Section */}
          <div>
            <SectionHeader
              title="Country Filter"
              subtitle={selectedCountries.length > 0 ? `${selectedCountries.length} selected` : 'All countries'}
              icon={Globe}
              isDarkTheme={isDarkTheme}
              isExpanded={expandedSections.filters}
              onToggle={() => toggleSection('filters')}
            />
            
            {expandedSections.filters && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableCountries.map(country => {
                  const isSelected = selectedCountries.includes(country);
                  return (
                    <label
                      key={country}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkTheme 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkTheme 
                          ? 'rgba(255, 255, 255, 0.03)' 
                          : 'rgba(0, 0, 0, 0.02)';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onCountryToggle(country)}
                        style={{
                          marginRight: '10px',
                          accentColor: isDarkTheme ? '#3b82f6' : '#2563eb'
                        }}
                      />
                      <span style={{
                        ...SHARED_STYLES.text.body(isDarkTheme),
                        fontSize: '13px'
                      }}>
                        {formatCountryName(country)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* District Comparison Section */}
          <div>
            <SectionHeader
              title="District Comparison"
              subtitle={selectedRegions.length > 0 ? `${selectedRegions.length} districts` : 'Click districts to compare'}
              icon={Filter}
              isDarkTheme={isDarkTheme}
              isExpanded={expandedSections.comparison}
              onToggle={() => toggleSection('comparison')}
            />
            
            {expandedSections.comparison && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedRegions.length === 0 ? (
                  <div style={{
                    ...SHARED_STYLES.text.muted(isDarkTheme),
                    fontSize: '13px',
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    Click on districts in the map to add them to comparison
                  </div>
                ) : (
                  selectedRegions.map((region, idx) => {
                    const metricValue = region.properties[selectedMetric];
                    const metricInfo = METRIC_CONFIG[selectedMetric];
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          backgroundColor: idx % 2 === 0 
                            ? (isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)')
                            : 'transparent',
                          borderRadius: '6px',
                          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{
                            ...SHARED_STYLES.text.body(isDarkTheme),
                            fontSize: '13px',
                            fontWeight: 600
                          }}>
                            {formatRegionName(region.properties)}
                          </div>
                          <div style={{
                            ...SHARED_STYLES.text.muted(isDarkTheme),
                            fontSize: '12px',
                            marginTop: '2px'
                          }}>
                            {metricInfo.format(metricValue)}
                          </div>
                        </div>
                        <button
                          onClick={() => onRegionRemove(region)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: isDarkTheme ? '#ef4444' : '#dc2626',
                            cursor: 'pointer',
                            fontSize: '18px',
                            lineHeight: 1,
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = isDarkTheme 
                              ? 'rgba(239, 68, 68, 0.1)' 
                              : 'rgba(220, 38, 38, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Future: Taxonomic Information Section */}
          <div style={{
            ...SHARED_STYLES.card(isDarkTheme),
            opacity: 0.5
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px'
            }}>
              <Info size={16} style={{ color: isDarkTheme ? '#60a5fa' : '#3b82f6' }} />
              <div>
                <h4 style={{
                  ...SHARED_STYLES.text.body(isDarkTheme),
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  Catch Information
                </h4>
                <p style={{
                  ...SHARED_STYLES.text.muted(isDarkTheme),
                  margin: '2px 0 0 0',
                  fontSize: '11px'
                }}>
                  Taxonomic data coming soon
                </p>
              </div>
            </div>
          </div>

        </div>
      </SimpleBar>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar; 