import { memo } from 'react';

const SelectionPanel = memo(({ 
  isDarkTheme, 
  showPanel, 
  onTogglePanel, 
  selectedDistricts, 
  onClearSelection,
  selectedTotal,
  totalValue,
  onRemoveDistrict,
  onExportSelection,
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
      overflow: 'hidden',
      marginBottom: isMobile ? '10px' : '0'
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontWeight: 'bold' }}>Selected Districts</span>
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
          maxHeight: isMobile ? '58vh' : '480px' // Slightly less than container to prevent double scrollbars
        }}>
          {selectedDistricts.length === 0 ? (
            <div style={{ 
              color: '#95a5a6',
              textAlign: 'center',
              padding: isMobile ? '15px 0' : '20px 0',
              fontSize: isMobile ? '14px' : '16px'
            }}>
              Click on districts to select them
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              paddingRight: '10px', // Space for scrollbar
              marginRight: '-10px'  // Compensate padding to maintain alignment
            }}>
              <div style={{ 
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <div style={{ fontSize: isMobile ? '12px' : '14px', color: isDarkTheme ? '#ddd' : '#7f8c8d' }}>Selected Total</div>
                <div style={{ 
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: 'bold',
                  color: isDarkTheme ? '#fff' : '#2c3e50'
                }}>
                  {selectedTotal.toLocaleString()}
                </div>
                <div style={{ 
                  fontSize: isMobile ? '11px' : '12px',
                  color: isDarkTheme ? '#bbb' : '#95a5a6',
                  marginTop: '5px'
                }}>
                  {((selectedTotal / totalValue) * 100).toFixed(1)}% of total
                </div>
              </div>

              <div style={{ 
                marginBottom: '15px',
                maxHeight: isMobile ? '30vh' : 'none',
                overflowY: isMobile ? 'auto' : 'visible'
              }}>
                {selectedDistricts.map((district, index) => (
                  <div
                    key={district.properties.ADM2_PCODE}
                    style={{
                      padding: isMobile ? '8px' : '10px',
                      backgroundColor: isDarkTheme 
                        ? index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                        : index % 2 === 0 ? '#f8f9fa' : 'white',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      fontSize: isMobile ? '13px' : '14px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: isDarkTheme ? '#fff' : '#2c3e50' }}>
                        {district.properties.ADM2_PT}
                      </div>
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: isDarkTheme ? '#bbb' : '#7f8c8d' }}>
                        Value: {district.properties.value?.toLocaleString() || 0}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveDistrict(district.properties.ADM2_PCODE)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#e74c3c',
                        cursor: 'pointer',
                        padding: '5px',
                        fontSize: isMobile ? '16px' : '18px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div style={{
                borderTop: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#eee'}`,
                paddingTop: '15px',
                display: 'flex',
                gap: '10px'
              }}>
                <button
                  onClick={onExportSelection}
                  style={{
                    flex: 1,
                    padding: isMobile ? '10px' : '8px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '14px' : 'inherit'
                  }}
                >
                  Export Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SelectionPanel.displayName = 'SelectionPanel';

export default SelectionPanel; 