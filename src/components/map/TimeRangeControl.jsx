import { memo, useMemo, useState, useCallback } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Calendar, ChevronDown, Clock } from 'lucide-react';

const TimeRangeControl = memo(({
  timeSeriesData,
  dateRange,
  onDateRangeChange,
  isDarkTheme = true,
  isMobile = false,
  style = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract all unique sorted dates from timeSeriesData
  const allDates = useMemo(() => {
    if (!timeSeriesData) return [];
    const dates = Object.values(timeSeriesData)
      .flatMap(region => region.data.map(d => d.date))
      .filter(Boolean);
    return Array.from(new Set(dates)).sort((a, b) => new Date(a) - new Date(b));
  }, [timeSeriesData]);

  // Format date for display
  const formatDateLabel = useCallback((dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }, []);

  // Format date for compact display
  const formatDateCompact = useCallback((dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      year: '2-digit', 
      month: 'short'
    });
  }, []);

  // Clamp the dateRange to valid indices
  const clampedDateRange = useMemo(() => {
    if (!dateRange || allDates.length === 0) return [0, Math.max(0, allDates.length - 1)];
    return [
      Math.max(0, Math.min(dateRange[0], allDates.length - 1)),
      Math.max(0, Math.min(dateRange[1], allDates.length - 1))
    ];
  }, [dateRange, allDates.length]);

  // Generate slider marks for key dates
  const marks = useMemo(() => {
    if (allDates.length === 0) return {};
    
    const obj = {};
    const step = Math.max(1, Math.floor(allDates.length / 6)); // Show ~6 marks max
    
    // Always include first and last
    obj[0] = {
      label: <span style={{ 
        fontSize: '10px', 
        color: isDarkTheme ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
        fontWeight: 500
      }}>
        {formatDateCompact(allDates[0])}
      </span>
    };
    
    // Add intermediate marks
    for (let i = step; i < allDates.length - 1; i += step) {
      obj[i] = {
        label: <span style={{ 
          fontSize: '10px', 
          color: isDarkTheme ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
          fontWeight: 500
        }}>
          {formatDateCompact(allDates[i])}
        </span>
      };
    }
    
    if (allDates.length > 1) {
      obj[allDates.length - 1] = {
        label: <span style={{ 
          fontSize: '10px', 
          color: isDarkTheme ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
          fontWeight: 500
        }}>
          {formatDateCompact(allDates[allDates.length - 1])}
        </span>
      };
    }
    
    return obj;
  }, [allDates, isDarkTheme, formatDateCompact]);

  const handleRangeChange = useCallback((range) => {
    if (onDateRangeChange) {
      const [min, max] = range;
      const clampedMin = Math.max(0, Math.min(min, allDates.length - 1));
      const clampedMax = Math.max(clampedMin, Math.min(max, allDates.length - 1));
      onDateRangeChange([clampedMin, clampedMax]);
    }
  }, [onDateRangeChange, allDates.length]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  if (allDates.length <= 1) return null;

  const startDate = allDates[clampedDateRange[0]];
  const endDate = allDates[clampedDateRange[1]];

  return (
    <>
      {/* Add CSS animations inline */}
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
              max-height: 0;
            }
            to {
              opacity: 1;
              transform: translateY(0);
              max-height: 300px;
            }
          }
        `}
      </style>
      <div
        style={{
          position: 'absolute',
          top: isMobile ? '24px' : '84px', // 24px (MapStyleToggle top) + 48px (height) + 12px (gap)
          right: '24px',
          zIndex: 1000,
          width: isMobile ? 'auto' : '300px',
          left: isMobile ? '16px' : 'auto',
          ...style
        }}
      >
      {/* Single collapsible panel */}
      <div style={{
        backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRadius: '6px',
        border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        boxShadow: isDarkTheme 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden'
      }}>
        {/* Header - always visible */}
        <div 
          onClick={toggleExpanded}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            backgroundColor: isExpanded 
              ? (isDarkTheme ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)')
              : 'transparent',
            borderRadius: isExpanded ? '6px 6px 0 0' : '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: `1px solid ${isExpanded
              ? (isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
              : 'transparent'}`,
            borderBottom: isExpanded ? 'none' : undefined,
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (!isExpanded) {
              e.currentTarget.style.backgroundColor = isDarkTheme 
                ? 'rgba(255, 255, 255, 0.04)' 
                : 'rgba(0, 0, 0, 0.03)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isExpanded) {
              e.currentTarget.style.backgroundColor = isDarkTheme 
                ? 'rgba(255, 255, 255, 0.02)' 
                : 'rgba(0, 0, 0, 0.01)';
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ 
              color: isExpanded 
                ? (isDarkTheme ? '#60a5fa' : '#3b82f6')
                : (isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
              flexShrink: 0
            }} />
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 500,
                color: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
              }}>
                Time Range
              </h3>
              <p style={{
                margin: '1px 0 0 0',
                fontSize: '10px',
                color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
              }}>
                {formatDateCompact(startDate)} → {formatDateCompact(endDate)}
              </p>
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

        {/* Expanded content */}
        {isExpanded && (
          <div style={{
            padding: '12px',
            backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.3)',
            borderTop: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
            animation: 'slideDown 0.2s ease-out'
          }}>
            {/* Date range display */}
            <div style={{
              backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '4px',
              border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
              padding: '10px',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 500,
                color: isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: '6px'
              }}>
                Selected Range
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: isDarkTheme ? '#60a5fa' : '#3b82f6',
                marginBottom: '6px'
              }}>
                {formatDateLabel(startDate)} → {formatDateLabel(endDate)}
              </div>
              <div style={{
                fontSize: '10px',
                color: isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
              }}>
                {clampedDateRange[1] - clampedDateRange[0] + 1} time points ({((clampedDateRange[1] - clampedDateRange[0] + 1) / allDates.length * 100).toFixed(0)}% of data)
              </div>
            </div>

            {/* Slider */}
            <div style={{ 
              padding: '0 6px',
              marginBottom: '8px'
            }}>
              <Slider
                range
                min={0}
                max={allDates.length - 1}
                value={clampedDateRange}
                marks={marks}
                onChange={handleRangeChange}
                allowCross={false}
                trackStyle={[{ 
                  backgroundColor: isDarkTheme ? '#60a5fa' : '#3b82f6'
                }]}
                handleStyle={[
                  { 
                    borderColor: isDarkTheme ? '#60a5fa' : '#3b82f6', 
                    backgroundColor: isDarkTheme ? '#1e293b' : '#fff'
                  },
                  { 
                    borderColor: isDarkTheme ? '#60a5fa' : '#3b82f6', 
                    backgroundColor: isDarkTheme ? '#1e293b' : '#fff'
                  }
                ]}
                railStyle={{ 
                  backgroundColor: isDarkTheme ? '#334155' : '#cbd5e1'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
});

TimeRangeControl.displayName = 'TimeRangeControl';

export default TimeRangeControl;