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
      padding: '4px 8px',
      cursor: 'pointer',
      backgroundColor: isSelected ? 
        (isDarkTheme ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)') : 
        'transparent',
      borderRadius: '4px',
      opacity: isSelected ? 1 : 0.6,
      transition: SHARED_STYLES.transitions.default
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
      fontSize: '12px',
      color: isDarkTheme ? '#ffffff' : '#000000'
    }}>
      {range.label}
    </span>
  </div>
);

// Info Panel for grid statistics
const GridInfoPanel = ({ isDarkTheme, data, colorRange, selectedRanges, onRangeToggle, isVisible }) => {
  const stats = useMemo(() => calculateGridStats(data), [data]);

  if (!isVisible || !stats) return null;

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
        ...SHARED_STYLES.glassPanel(isDarkTheme)
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
        padding: '8px 12px',
        backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
        borderRadius: '4px',
        fontSize: '13px'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Grid Resolution:</strong> 1 × 1 km
        </div>
        <div style={{ 
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
          fontSize: '12px',
          lineHeight: '1.4'
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
          ...SHARED_STYLES.text.label(isDarkTheme)
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
          TIME RANGES (select to filter)
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
        fontSize: '14px', 
        lineHeight: '1.6',
        display: 'grid',
        gap: '12px'
      }}>
        <div>
          <div style={{ 
            marginBottom: '4px',
            ...SHARED_STYLES.text.label(isDarkTheme)
          }}>
            ACTIVITY
          </div>
          <div><strong>{stats.totalVisits}</strong> total visits recorded</div>
          <div><strong>{stats.gridCells}</strong> active grid cells</div>
        </div>

        <div>
          <div style={{ 
            marginBottom: '4px',
            ...SHARED_STYLES.text.label(isDarkTheme)
          }}>
            TIME & SPEED
          </div>
          <div><strong>{stats.avgTime}h</strong> average time per visit</div>
          <div><strong>{stats.maxTime}h</strong> maximum time recorded</div>
          <div><strong>{stats.avgSpeed} km/h</strong> average speed</div>
        </div>
      </div>
    </div>
  );
};

export default GridInfoPanel; 