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
      padding: '14px 16px',
      backgroundColor: isExpanded 
        ? (isDarkTheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)')
        : (isDarkTheme ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'),
      borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: isExpanded ? '0' : '0',
      border: `1px solid ${isExpanded
        ? (isDarkTheme ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)')
        : (isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')}`,
      borderBottom: isExpanded ? 'none' : undefined,
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      if (!isExpanded) {
        e.currentTarget.style.backgroundColor = isDarkTheme 
          ? 'rgba(255, 255, 255, 0.04)' 
          : 'rgba(0, 0, 0, 0.03)';
        e.currentTarget.style.borderColor = isDarkTheme
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.1)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isExpanded) {
        e.currentTarget.style.backgroundColor = isDarkTheme 
          ? 'rgba(255, 255, 255, 0.02)' 
          : 'rgba(0, 0, 0, 0.01)';
        e.currentTarget.style.borderColor = isDarkTheme
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(0, 0, 0, 0.06)';
      }
    }}
  >
    {/* Active indicator bar */}
    {isExpanded && (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
        borderRadius: '8px 8px 0 0'
      }} />
    )}
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        backgroundColor: isExpanded
          ? (isDarkTheme ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)')
          : (isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
      }}>
        <Icon size={18} style={{ 
          color: isExpanded 
            ? (isDarkTheme ? '#60a5fa' : '#3b82f6')
            : (isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)')
        }} />
      </div>
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
    <div style={{
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
      color: isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
    }}>
      <ChevronDown size={16} />
    </div>
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
  onCountryToggle,
  // Style prop
  style = {}
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
    width: isOpen ? (isMobile ? '100%' : '460px') : '0',
    height: '100%',
    minHeight: 0,
    transform: isOpen ? 'translateX(0)' : `translateX(${isMobile ? '-100%' : '-460px'})`,
    ...SHARED_STYLES.glassPanel(isDarkTheme),
    backgroundColor: isDarkTheme ? 'rgba(28, 28, 28, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 1000,
    overflow: 'hidden',
    borderRadius: 0,
    borderRight: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    boxShadow: isDarkTheme 
      ? '2px 0 8px rgba(0, 0, 0, 0.3)' 
      : '2px 0 8px rgba(0, 0, 0, 0.08)',
    ...style
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '28px 24px 20px',
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        flexShrink: 0
      }}>
        <h2 style={{
          ...SHARED_STYLES.text.heading(isDarkTheme),
          margin: 0,
          fontSize: '20px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Layers size={22} />
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
          <div style={{
            backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            borderRadius: '8px',
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            overflow: 'hidden'
          }}>
            <SectionHeader
              title="Metrics"
              subtitle="Select data to visualize"
              icon={BarChart3}
              isDarkTheme={isDarkTheme}
              isExpanded={expandedSections.metrics}
              onToggle={() => toggleSection('metrics')}
            />
            
            {expandedSections.metrics && (
              <div style={{ 
                padding: '20px',
                backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                borderTop: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
              }}>
                {/* Metrics Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '20px'
                }}>
                  {METRICS.map(metric => {
                    const isActive = selectedMetric === metric.id;
                    return (
                      <div
                        key={metric.id}
                        onClick={() => onMetricChange(metric.id)}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          backgroundColor: isActive 
                            ? (isDarkTheme ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)')
                            : 'transparent',
                          border: `1.5px solid ${isActive 
                            ? (isDarkTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.35)')
                            : (isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')}`,
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = isDarkTheme 
                              ? 'rgba(255, 255, 255, 0.04)' 
                              : 'rgba(0, 0, 0, 0.02)';
                            e.currentTarget.style.borderColor = isDarkTheme
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.12)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = isDarkTheme
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.08)';
                          }
                        }}
                      >
                        {/* Selection indicator dot */}
                        {isActive && (
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isDarkTheme ? '#60a5fa' : '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)'
                          }} />
                        )}
                        
                        <h4 style={{
                          ...SHARED_STYLES.text.body(isDarkTheme),
                          margin: 0,
                          fontWeight: 600,
                          fontSize: '14px',
                          marginBottom: '4px',
                          color: isActive 
                            ? (isDarkTheme ? '#60a5fa' : '#3b82f6')
                            : (isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)')
                        }}>
                          {metric.label}
                        </h4>
                        <p style={{
                          ...SHARED_STYLES.text.muted(isDarkTheme),
                          margin: 0,
                          fontSize: '11px',
                          lineHeight: '1.5',
                          marginBottom: '8px'
                        }}>
                          {metric.description}
                        </p>
                        <div style={{
                          display: 'inline-block',
                          ...SHARED_STYLES.text.label(isDarkTheme),
                          fontSize: '10px',
                          padding: '3px 8px',
                          backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderRadius: '12px',
                          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`
                        }}>
                          {metric.unit}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Divider */}
                <div style={{
                  height: '1px',
                  backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                  margin: '0 -20px 20px'
                }} />

                {/* Opacity Control */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '12px' 
                  }}>
                    <div>
                      <label style={{
                        ...SHARED_STYLES.text.body(isDarkTheme),
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'block'
                      }}>
                        Layer Opacity
                      </label>
                      <span style={{
                        ...SHARED_STYLES.text.muted(isDarkTheme),
                        fontSize: '11px'
                      }}>
                        Adjust choropleth transparency
                      </span>
                    </div>
                    <span style={{
                      ...SHARED_STYLES.text.body(isDarkTheme),
                      fontSize: '14px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      backgroundColor: isDarkTheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                      borderRadius: '16px',
                      color: isDarkTheme ? '#60a5fa' : '#3b82f6'
                    }}>
                      {(opacity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{
                    position: 'relative',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: '4px',
                      backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '2px'
                    }} />
                    <input 
                      type="range" 
                      min={0} 
                      max={100} 
                      value={opacity * 100} 
                      onChange={(e) => onOpacityChange(Number(e.target.value) / 100)} 
                      style={{ 
                        position: 'relative',
                        width: '100%', 
                        height: '4px',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: 'transparent',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                      className="custom-slider"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grid Activity Section */}
          <div style={{
            backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            borderRadius: '8px',
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            overflow: 'hidden'
          }}>
            <SectionHeader
              title="Fishing Activity"
              subtitle={`${gridStats.totalCells.toLocaleString()} grid cells detected`}
              icon={Activity}
              isDarkTheme={isDarkTheme}
              isExpanded={expandedSections.gridActivity}
              onToggle={() => toggleSection('gridActivity')}
            />
            
            {expandedSections.gridActivity && (
              <div style={{
                padding: '20px',
                backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                borderTop: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
              }}>
                {/* Statistics Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    padding: '16px',
                    background: `linear-gradient(135deg, 
                      ${isDarkTheme ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'} 0%, 
                      ${isDarkTheme ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)'} 100%)`,
                    borderRadius: '12px',
                    border: `1px solid ${isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`
                  }}>
                    <div style={{
                      ...SHARED_STYLES.text.label(isDarkTheme),
                      fontSize: '10px',
                      marginBottom: '6px',
                      opacity: 0.8
                    }}>
                      AVERAGE TIME
                    </div>
                    <div style={{
                      ...SHARED_STYLES.text.body(isDarkTheme),
                      fontSize: '24px',
                      fontWeight: 700,
                      color: isDarkTheme ? '#60a5fa' : '#3b82f6',
                      lineHeight: 1
                    }}>
                      {gridStats.avgTime.toFixed(2)}
                      <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '2px' }}>h</span>
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '16px',
                    background: `linear-gradient(135deg, 
                      ${isDarkTheme ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'} 0%, 
                      ${isDarkTheme ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.05)'} 100%)`,
                    borderRadius: '12px',
                    border: `1px solid ${isDarkTheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)'}`
                  }}>
                    <div style={{
                      ...SHARED_STYLES.text.label(isDarkTheme),
                      fontSize: '10px',
                      marginBottom: '6px',
                      opacity: 0.8
                    }}>
                      TOTAL VISITS
                    </div>
                    <div style={{
                      ...SHARED_STYLES.text.body(isDarkTheme),
                      fontSize: '24px',
                      fontWeight: 700,
                      color: isDarkTheme ? '#22c55e' : '#16a34a',
                      lineHeight: 1
                    }}>
                      {gridStats.totalVisits.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Divider with label */}
                <div style={{ 
                  position: 'relative', 
                  marginBottom: '16px'
                }}>
                  <div style={{
                    height: '1px',
                    backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                    padding: '0 12px'
                  }}>
                    <span style={{
                      ...SHARED_STYLES.text.label(isDarkTheme),
                      fontSize: '10px',
                      opacity: 0.7
                    }}>
                      FILTER BY TIME
                    </span>
                  </div>
                </div>

                {/* Time Range Filters */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px'
                }}>
                  {TIME_BREAKS.map((range, index) => {
                    const isSelected = selectedRanges.some(r => r.min === range.min && r.max === range.max);
                    const timeValue = range.min + (range.max === Infinity ? 8 : range.max - range.min) / 2;
                    const normalizedValue = Math.min(timeValue / 12, 1);
                    const opacity = 0.4 + (normalizedValue * 0.5);
                    
                    return (
                      <div
                        key={`${range.min}-${range.max}`}
                        onClick={() => onRangeToggle(range)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '12px 8px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 
                            (isDarkTheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)') : 
                            'transparent',
                          borderRadius: '10px',
                          border: `1.5px solid ${isSelected 
                            ? (isDarkTheme ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)') 
                            : (isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')}`,
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = isDarkTheme 
                              ? 'rgba(255, 255, 255, 0.04)' 
                              : 'rgba(0, 0, 0, 0.02)';
                            e.currentTarget.style.borderColor = isDarkTheme
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.12)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = isDarkTheme
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.08)';
                          }
                        }}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isDarkTheme ? '#60a5fa' : '#3b82f6'
                          }} />
                        )}
                        
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: `rgba(${COLOR_RANGE[index].join(',')}, ${opacity})`,
                            borderRadius: '8px',
                            marginBottom: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        />
                        <span style={{ 
                          ...SHARED_STYLES.text.body(isDarkTheme),
                          fontSize: '11px',
                          fontWeight: isSelected ? 600 : 400,
                          textAlign: 'center',
                          color: isSelected 
                            ? (isDarkTheme ? '#60a5fa' : '#3b82f6')
                            : undefined
                        }}>
                          {range.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Country Filter Section */}
          <div style={{
            backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            borderRadius: '8px',
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            overflow: 'hidden'
          }}>
            <SectionHeader
              title="Country Filter"
              subtitle={selectedCountries.length > 0 ? `${selectedCountries.length} selected` : 'All countries'}
              icon={Globe}
              isDarkTheme={isDarkTheme}
              isExpanded={expandedSections.filters}
              onToggle={() => toggleSection('filters')}
            />
            
            {expandedSections.filters && (
              <div style={{
                padding: '20px',
                backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                borderTop: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
              }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  {availableCountries.map(country => {
                    const isSelected = selectedCountries.includes(country);
                    return (
                      <label
                        key={country}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          backgroundColor: isSelected
                            ? (isDarkTheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)')
                            : 'transparent',
                          border: `1.5px solid ${isSelected
                            ? (isDarkTheme ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)')
                            : (isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')}`,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = isDarkTheme
                              ? 'rgba(255, 255, 255, 0.04)'
                              : 'rgba(0, 0, 0, 0.02)';
                            e.currentTarget.style.borderColor = isDarkTheme
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.12)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = isDarkTheme
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.08)';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onCountryToggle(country)}
                          style={{
                            marginRight: '10px',
                            width: '18px',
                            height: '18px',
                            accentColor: isDarkTheme ? '#3b82f6' : '#2563eb',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{
                          ...SHARED_STYLES.text.body(isDarkTheme),
                          fontSize: '13px',
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected 
                            ? (isDarkTheme ? '#60a5fa' : '#3b82f6')
                            : (isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)')
                        }}>
                          {formatCountryName(country)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* District Comparison Section */}
          <div style={{
            backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            borderRadius: '8px',
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            overflow: 'hidden'
          }}>
            <SectionHeader
              title="District Comparison"
              subtitle={selectedRegions.length > 0 ? `${selectedRegions.length} districts` : 'Click districts to compare'}
              icon={Filter}
              isDarkTheme={isDarkTheme}
              isExpanded={expandedSections.comparison}
              onToggle={() => toggleSection('comparison')}
            />
            
            {expandedSections.comparison && (
              <div style={{
                padding: '20px',
                backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                borderTop: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
              }}>
                {selectedRegions.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    borderRadius: '10px',
                    border: `2px dashed ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'
                  }}>
                    <div style={{ 
                      fontSize: '32px',
                      marginBottom: '12px',
                      opacity: 0.3,
                      filter: 'grayscale(100%)'
                    }}>
                      🗺️
                    </div>
                    <div style={{
                      ...SHARED_STYLES.text.body(isDarkTheme),
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '4px'
                    }}>
                      No districts selected
                    </div>
                    <div style={{
                      ...SHARED_STYLES.text.muted(isDarkTheme),
                      fontSize: '12px'
                    }}>
                      Click on districts in the map to compare
                    </div>
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '360px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    marginRight: '-8px',
                    paddingRight: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {selectedRegions.map((region, idx) => {
                        const metricValue = region.properties[selectedMetric];
                        const metricInfo = METRIC_CONFIG[selectedMetric];
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '14px',
                              backgroundColor: 'transparent',
                              borderRadius: '10px',
                              border: `1.5px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkTheme 
                                ? 'rgba(255, 255, 255, 0.04)' 
                                : 'rgba(0, 0, 0, 0.02)';
                              e.currentTarget.style.borderColor = isDarkTheme
                                ? 'rgba(255, 255, 255, 0.12)'
                                : 'rgba(0, 0, 0, 0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = isDarkTheme
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.08)';
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                ...SHARED_STYLES.text.body(isDarkTheme),
                                fontSize: '13px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginBottom: '4px'
                              }}>
                                {formatRegionName(region.properties)}
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}>
                                <span style={{
                                  ...SHARED_STYLES.text.muted(isDarkTheme),
                                  fontSize: '11px'
                                }}>
                                  {formatCountryName(region.properties.country)}
                                </span>
                                <span style={{
                                  ...SHARED_STYLES.text.body(isDarkTheme),
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: isDarkTheme ? '#60a5fa' : '#3b82f6',
                                  backgroundColor: isDarkTheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                  padding: '2px 8px',
                                  borderRadius: '12px'
                                }}>
                                  {metricInfo.format(metricValue)}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => onRegionRemove(region)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: isDarkTheme ? '#6b7280' : '#9ca3af',
                                cursor: 'pointer',
                                fontSize: '18px',
                                lineHeight: 1,
                                padding: '6px',
                                borderRadius: '6px',
                                transition: 'all 0.2s',
                                marginLeft: '12px',
                                flexShrink: 0
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = isDarkTheme 
                                  ? 'rgba(239, 68, 68, 0.1)' 
                                  : 'rgba(220, 38, 38, 0.1)';
                                e.target.style.color = isDarkTheme ? '#ef4444' : '#dc2626';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = isDarkTheme ? '#6b7280' : '#9ca3af';
                              }}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Future: Taxonomic Information Section */}
          <div style={{
            backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            borderRadius: '8px',
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            opacity: 0.5
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 16px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Info size={18} style={{ color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }} />
              </div>
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