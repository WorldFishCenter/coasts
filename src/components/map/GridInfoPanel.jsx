import React, { useMemo } from 'react';
import { 
  TIME_BREAKS, 
  SHARED_STYLES,
  calculateGridStats
} from '../../utils/gridLayerConfig';

// Time Range Button Component
const TimeRangeButton = ({ range, index, isSelected, colorRange, isDarkTheme, onToggle }) => (
  <div
    onClick={() => onToggle(range)}
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '6px 10px',
      cursor: 'pointer',
      backgroundColor: isSelected ? 
        (isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)') : 
        'transparent',
      borderRadius: '4px',
      opacity: isSelected ? 1 : 0.7,
      transition: SHARED_STYLES.transitions.default,
      border: `1px solid ${isSelected 
        ? (isDarkTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)') 
        : 'transparent'}`
    }}
  >
    <div
      style={{
        width: '10px',
        height: '10px',
        backgroundColor: `rgb(${colorRange[index].join(',')})`,
        marginRight: '6px',
        borderRadius: '2px'
      }}
    />
    <span style={{ 
      ...SHARED_STYLES.text.body(isDarkTheme),
      fontSize: '12px'
    }}>
      {range.label}
    </span>
  </div>
);

// Info Panel for grid statistics
const GridInfoPanel = ({ isDarkTheme, data, colorRange, selectedRanges, onRangeToggle, style }) => {
  const stats = useMemo(() => {
    const calculatedStats = calculateGridStats(data);
    return calculatedStats || {
      totalVisits: '0',
      avgTime: '0.0',
      maxTime: '0.0',
      gridCells: '0',
      avgSpeed: '0.0'
    };
  }, [data]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: 20,
        padding: '16px',
        width: '380px',
        zIndex: 1000,
        pointerEvents: 'auto',
        ...SHARED_STYLES.glassPanel(isDarkTheme),
        ...style
      }}
    >
      <h3 style={{ 
        margin: '0 0 16px 0',
        ...SHARED_STYLES.text.heading(isDarkTheme)
      }}>
        Fishing Effort Distribution (GPS Data)
      </h3>

      {/* Grid Info */}
      <div style={{ 
        marginBottom: '20px',
        ...SHARED_STYLES.card(isDarkTheme)
      }}>
        <div style={{ 
          marginBottom: '4px',
          ...SHARED_STYLES.text.subheading(isDarkTheme)
        }}>
          Grid Resolution: 1 × 1 km
        </div>
        <div style={{ 
          ...SHARED_STYLES.text.muted(isDarkTheme)
        }}>
          Each cell represents a 1 square kilometer area where fishing activity has been recorded
        </div>
      </div>

      {/* Color Scale Legend */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          marginBottom: '8px',
          ...SHARED_STYLES.text.label(isDarkTheme)
        }}>
          AVERAGE TIME SPENT
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <div style={{
            height: '8px',
            flex: 1,
            background: `linear-gradient(to right, ${colorRange.map(c => `rgb(${c.join(',')})`).join(', ')})`,
            borderRadius: '4px'
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          ...SHARED_STYLES.text.muted(isDarkTheme)
        }}>
          <span>Fewer Hours</span>
          <span>More Hours</span>
        </div>
      </div>

      {/* Time Range Filters */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          marginBottom: '8px',
          ...SHARED_STYLES.text.label(isDarkTheme)
        }}>
          TIME RANGES (SELECT TO FILTER)
        </div>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px'
        }}>
          {TIME_BREAKS.map((range, i) => (
            <TimeRangeButton
              key={range.label}
              range={range}
              index={i}
              isSelected={selectedRanges.some(r => r.min === range.min && r.max === range.max)}
              colorRange={colorRange}
              isDarkTheme={isDarkTheme}
              onToggle={onRangeToggle}
            />
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div style={{ 
        display: 'grid',
        gap: '16px'
      }}>
        <div>
          <div style={{ 
            marginBottom: '8px',
            ...SHARED_STYLES.text.label(isDarkTheme)
          }}>
            ACTIVITY
          </div>
          <div style={SHARED_STYLES.text.body(isDarkTheme)}>
            <strong>{stats.totalVisits}</strong> total visits recorded
          </div>
          <div style={SHARED_STYLES.text.body(isDarkTheme)}>
            <strong>{stats.gridCells}</strong> active grid cells
          </div>
        </div>

        <div>
          <div style={{ 
            marginBottom: '8px',
            ...SHARED_STYLES.text.label(isDarkTheme)
          }}>
            TIME & SPEED
          </div>
          <div style={SHARED_STYLES.text.body(isDarkTheme)}>
            <strong>{stats.avgTime}h</strong> average time per visit
          </div>
          <div style={SHARED_STYLES.text.body(isDarkTheme)}>
            <strong>{stats.maxTime}h</strong> maximum time recorded
          </div>
          <div style={SHARED_STYLES.text.body(isDarkTheme)}>
            <strong>{stats.avgSpeed} km/h</strong> average speed
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridInfoPanel; 