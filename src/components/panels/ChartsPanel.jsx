import { memo } from 'react';
import ReactApexChart from 'react-apexcharts';

const ChartsPanel = memo(({ 
  isDarkTheme, 
  showPanel, 
  onTogglePanel,
  selectedDistricts,
  totalValue,
  isMobile
}) => {
  const districtValues = selectedDistricts.map(d => ({
    name: d.properties.ADM2_PT,
    value: d.properties.value || 0
  }));

  const barChartOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false
      },
      background: isDarkTheme ? '#1a1a1a' : '#ffffff'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4
      }
    },
    colors: ['#3498db'],
    dataLabels: {
      enabled: true,
      formatter: (val) => val.toLocaleString(),
      style: {
        colors: [isDarkTheme ? '#fff' : '#2c3e50']
      }
    },
    xaxis: {
      categories: districtValues.map(d => d.name),
      labels: {
        style: {
          colors: isDarkTheme ? '#fff' : '#2c3e50'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDarkTheme ? '#fff' : '#2c3e50'
        }
      }
    }
  };

  const pieChartOptions = {
    chart: {
      type: 'donut',
      background: isDarkTheme ? '#1a1a1a' : '#ffffff'
    },
    labels: districtValues.map(d => d.name),
    colors: ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'],
    legend: {
      position: 'bottom',
      labels: {
        colors: isDarkTheme ? '#fff' : '#2c3e50'
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => val.toFixed(1) + '%'
    },
    tooltip: {
      y: {
        formatter: (val) => val.toLocaleString()
      }
    }
  };

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
            <path d="M18 20V10M12 20V4M6 20v-6"/>
          </svg>
          <span style={{ fontWeight: 'bold' }}>District Charts</span>
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
      
      <div style={{
        maxHeight: showPanel ? '500px' : '0',
        opacity: showPanel ? 1 : 0,
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '20px',
          overflowY: 'auto',
          maxHeight: '480px'
        }}>
          {selectedDistricts.length === 0 ? (
            <div style={{ 
              color: '#95a5a6',
              textAlign: 'center',
              padding: '20px 0',
              fontSize: '16px'
            }}>
              Select districts to view charts
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px'
            }}>
              <div>
                <h3 style={{ 
                  fontSize: '16px',
                  marginBottom: '10px',
                  color: isDarkTheme ? '#fff' : '#2c3e50'
                }}>
                  Value Distribution
                </h3>
                <ReactApexChart
                  options={barChartOptions}
                  series={[{
                    name: 'Value',
                    data: districtValues.map(d => d.value)
                  }]}
                  type="bar"
                  height={Math.max(150, districtValues.length * 40)}
                />
              </div>

              <div>
                <h3 style={{ 
                  fontSize: '16px',
                  marginBottom: '10px',
                  color: isDarkTheme ? '#fff' : '#2c3e50'
                }}>
                  Percentage Distribution
                </h3>
                <ReactApexChart
                  options={pieChartOptions}
                  series={districtValues.map(d => d.value)}
                  type="donut"
                  height={300}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChartsPanel.displayName = 'ChartsPanel';

export default ChartsPanel; 