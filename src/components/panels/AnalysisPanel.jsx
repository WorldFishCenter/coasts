import { memo } from 'react';

const AnalysisPanel = memo(({ 
  isDarkTheme, 
  showPanel, 
  onTogglePanel,
  totalValue,
  coverage,
  onCoverageChange,
  radius,
  onRadiusChange,
  upperPercentile,
  onUpperPercentileChange,
  opacity,
  onOpacityChange,
  isMobile
}) => {
  return (
    <div style={{
      backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'white',
      color: isDarkTheme ? '#fff' : '#2c3e50',
      borderRadius: isMobile ? '12px' : '8px',
      boxShadow: isDarkTheme ? '0 2px 10px rgba(255,255,255,0.1)' : '0 2px 10px rgba(0,0,0,0.1)',
      width: isMobile ? '100%' : '300px',
      transition: 'all 0.3s ease',
      overflow: 'hidden'
    }}>
      {/* Panel Header */}
      <div 
        onClick={onTogglePanel}
        style={{
          padding: isMobile ? '15px' : '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: showPanel ? `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <span style={{ fontWeight: 'bold' }}>District Analysis</span>
        </div>
        <div style={{ 
          transform: `rotate(${showPanel ? 180 : 0}deg)`,
          transition: 'transform 0.3s ease',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none'
        }}>
          ▼
        </div>
      </div>
      
      {/* Panel Content */}
      <div style={{
        maxHeight: showPanel ? (isMobile ? '60vh' : '500px') : '0',
        opacity: showPanel ? 1 : 0,
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: isMobile ? '15px' : '20px',
          overflowY: 'auto',
          maxHeight: isMobile ? '58vh' : '480px', // Slightly less than container to prevent double scrollbars
          paddingRight: '10px', // Space for scrollbar
          marginRight: '-10px',  // Compensate padding to maintain alignment
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: 'bold',
              color: isDarkTheme ? '#fff' : '#2c3e50',
              marginBottom: '5px'
            }}>
              {totalValue.toLocaleString()}
            </div>
            <div style={{ 
              fontSize: isMobile ? '12px' : '14px',
              color: isDarkTheme ? '#bbb' : '#7f8c8d'
            }}>
              Total District Value
            </div>
          </div>

          {/* Sliders Container */}
          <div style={{
            width: '100%',
            boxSizing: 'border-box',
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: '5px' // Add slight padding to prevent slider thumb from touching edge
          }}>
            {/* Sliders */}
            <Slider
              label="Coverage"
              value={coverage}
              onChange={onCoverageChange}
              min={0}
              max={100}
              unit="%"
              isDarkTheme={isDarkTheme}
              isMobile={isMobile}
            />

            <Slider
              label="Radius"
              value={radius}
              onChange={onRadiusChange}
              min={10}
              max={100}
              unit="km"
              isDarkTheme={isDarkTheme}
              isMobile={isMobile}
            />

            <Slider
              label="Upper Percentile"
              value={upperPercentile}
              onChange={onUpperPercentileChange}
              min={50}
              max={100}
              unit="%"
              isDarkTheme={isDarkTheme}
              isMobile={isMobile}
            />

            <Slider
              label="Opacity"
              value={opacity * 100}
              onChange={(value) => onOpacityChange(value / 100)}
              min={0}
              max={100}
              unit="%"
              isDarkTheme={isDarkTheme}
              isMobile={isMobile}
            />
          </div>

          <div style={{
            fontSize: isMobile ? '11px' : '12px',
            color: isDarkTheme ? '#bbb' : '#95a5a6',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            Adjust parameters to analyze district data
          </div>
        </div>
      </div>
    </div>
  );
});

const Slider = memo(({ label, value, onChange, min, max, unit, isDarkTheme, isMobile }) => (
  <div style={{ 
    marginBottom: '15px',
    width: '100%',
    boxSizing: 'border-box'
  }}>
    <label style={{ 
      display: 'block', 
      marginBottom: '5px',
      fontSize: isMobile ? '12px' : '14px',
      color: isDarkTheme ? '#ddd' : '#34495e'
    }}>
      {label}: {value}{unit}
    </label>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ 
        width: '100%',
        accentColor: isDarkTheme ? '#3498db' : '#2980b9',
        boxSizing: 'border-box'
      }}
    />
  </div>
));

Slider.displayName = 'Slider';
AnalysisPanel.displayName = 'AnalysisPanel';

export default AnalysisPanel; 