import { useState, useMemo } from 'react';
import { Info, Sun, Moon } from 'lucide-react';
import { SHARED_STYLES } from '../utils/gridLayerConfig';
import { getLatestDate, getUniqueCountries } from '../services/dataService';

const Header = ({ 
  isDarkTheme,
  onThemeChange,
  // Dynamic data props
  boundaries,
  timeSeriesData,
  pdsGridsData
}) => {
  const [showAbout, setShowAbout] = useState(false);

  const handleThemeToggle = () => {
    onThemeChange(!isDarkTheme);
  };

  // Calculate dynamic statistics
  const dynamicStats = useMemo(() => {
    const stats = {
      totalRegions: 0,
      totalCountries: 0,
      lastSyncDate: 'Loading...',
      totalGridCells: 0
    };

    if (boundaries?.features) {
      stats.totalRegions = boundaries.features.length;
      stats.totalCountries = getUniqueCountries(boundaries).length;
    }

    if (timeSeriesData) {
      const latestDate = getLatestDate(timeSeriesData);
      if (latestDate) {
        const date = new Date(latestDate);
        stats.lastSyncDate = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
      }
    }

    if (pdsGridsData?.length) {
      stats.totalGridCells = pdsGridsData.length;
    }

    return stats;
  }, [boundaries, timeSeriesData, pdsGridsData]);

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: isDarkTheme ? 'rgba(28, 28, 28, 0.8)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 9999,
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        boxShadow: isDarkTheme 
          ? '0 1px 3px rgba(0, 0, 0, 0.3)' 
          : '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Left section with logo and title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Modern logo design */}
          <div style={{ 
            width: '100px', 
            height: '40px', 
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            overflow: 'hidden'
          }}>
            {/* Subtle pattern overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)',
              pointerEvents: 'none'
            }} />
            <span style={{
              color: 'white',
              fontWeight: 700,
              fontSize: '18px',
              letterSpacing: '0.5px',
              position: 'relative',
              zIndex: 1
            }}>
              PESKAS
            </span>
          </div>
          
          {/* Title section */}
          <div style={{ 
            borderLeft: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            paddingLeft: '16px',
            height: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h1 style={{ 
              ...SHARED_STYLES.text.heading(isDarkTheme),
              margin: 0, 
              fontSize: '20px', 
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}>
              SSFs explorer
            </h1>
            <div style={{ 
              ...SHARED_STYLES.text.muted(isDarkTheme),
              fontSize: '12px',
              marginTop: '2px',
              letterSpacing: '0.02em'
            }}>
              Interactive Analysis Tool
            </div>
          </div>
        </div>

        {/* Right section with actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* About button */}
          <button
            onClick={() => setShowAbout(true)}
            style={{
              background: 'transparent',
              border: `1.5px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
              transition: 'all 0.2s ease',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
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
            <Info size={16} strokeWidth={2} />
            <span>About</span>
          </button>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '24px',
            backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            margin: '0 4px'
          }} />

          {/* Theme toggle */}
          <button
            onClick={handleThemeToggle}
            style={{
              background: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1.5px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDarkTheme ? '#60a5fa' : '#f59e0b',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkTheme 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.borderColor = isDarkTheme
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkTheme 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = isDarkTheme
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.08)';
            }}
          >
            {isDarkTheme ? (
              <Moon size={20} strokeWidth={2} />
            ) : (
              <Sun size={20} strokeWidth={2} />
            )}
            {/* Active indicator dot */}
            <div style={{
              position: 'absolute',
              bottom: '6px',
              right: '6px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isDarkTheme ? '#60a5fa' : '#f59e0b',
              boxShadow: `0 0 0 2px ${isDarkTheme ? 'rgba(96, 165, 250, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
            }} />
          </button>
        </div>
      </header>

      {/* About Modal */}
      {showAbout && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            ...SHARED_STYLES.glassPanel(isDarkTheme),
            backgroundColor: isDarkTheme ? 'rgba(28, 28, 28, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            padding: '32px',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowAbout(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: `1.5px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                fontSize: '20px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
                e.currentTarget.style.borderColor = isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
              }}
            >
              ×
            </button>

            {/* Modal content */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              marginBottom: '24px' 
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <Info size={24} color="white" strokeWidth={2} />
              </div>
              <h2 style={{ 
                ...SHARED_STYLES.text.heading(isDarkTheme),
                margin: 0,
                fontSize: '24px',
                fontWeight: 700
              }}>
                About SSFs Explorer
              </h2>
            </div>
            
            <div style={{ lineHeight: '1.6' }}>
              <p style={{
                ...SHARED_STYLES.text.body(isDarkTheme),
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                The <strong>Small Scale Fisheries (SSFs) Explorer</strong> is a research platform that transforms GPS tracking data and fisheries surveys into actionable insights for coastal communities, researchers, and policymakers across the Western Indian Ocean region.
              </p>

              {/* What you can discover section */}
              <div style={{
                backgroundColor: isDarkTheme ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: `1px solid ${isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`
              }}>
                <h3 style={{ 
                  ...SHARED_STYLES.text.subheading(isDarkTheme),
                  fontSize: '16px',
                  marginTop: 0,
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isDarkTheme ? '#60a5fa' : '#3b82f6'
                }}>
                  <span style={{ fontSize: '20px' }}>🎯</span> What You Can Discover
                </h3>
                <ul style={{ 
                  margin: 0,
                  paddingLeft: '20px',
                  ...SHARED_STYLES.text.body(isDarkTheme),
                  fontSize: '13px'
                }}>
                  <li style={{ marginBottom: '8px' }}><strong>Fishing Hotspots:</strong> Identify where fishers spend the most time and effort using GPS heat maps</li>
                  <li style={{ marginBottom: '8px' }}><strong>Catch Efficiency:</strong> Compare CPUE (Catch Per Unit Effort) across different coastal regions</li>
                  <li style={{ marginBottom: '8px' }}><strong>Economic Patterns:</strong> Analyze fish prices and revenue trends over time</li>
                  <li><strong>Regional Comparisons:</strong> Benchmark fishing performance between Western Indian Ocean districts</li>
                </ul>
              </div>

              {/* Interactive tools section */}
              <div style={{
                backgroundColor: isDarkTheme ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: `1px solid ${isDarkTheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)'}`
              }}>
                <h3 style={{ 
                  ...SHARED_STYLES.text.subheading(isDarkTheme),
                  fontSize: '16px',
                  marginTop: 0,
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isDarkTheme ? '#4ade80' : '#22c55e'
                }}>
                  <span style={{ fontSize: '20px' }}>🛠️</span> Interactive Analysis Tools
                </h3>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  ...SHARED_STYLES.text.body(isDarkTheme),
                  fontSize: '13px'
                }}>
                  <div>
                    <strong>3D Fishing Effort Visualization</strong><br/>
                    <span style={{ opacity: 0.8 }}>Column heights show time spent fishing in 1km² grid cells</span>
                  </div>
                  <div>
                    <strong>Time-based Filtering</strong><br/>
                    <span style={{ opacity: 0.8 }}>Filter by fishing duration (0.5h to 8+ hours)</span>
                  </div>
                  <div>
                    <strong>Metric Comparison</strong><br/>
                    <span style={{ opacity: 0.8 }}>Switch between CPUE, CPUA, RPUE, and price data</span>
                  </div>
                  <div>
                    <strong>Regional Selection</strong><br/>
                    <span style={{ opacity: 0.8 }}>Click districts to view detailed statistics</span>
                  </div>
                </div>
              </div>

              {/* Data insights section */}
              <div style={{
                backgroundColor: isDarkTheme ? 'rgba(168, 85, 247, 0.08)' : 'rgba(168, 85, 247, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: `1px solid ${isDarkTheme ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.15)'}`
              }}>
                <h3 style={{ 
                  ...SHARED_STYLES.text.subheading(isDarkTheme),
                  fontSize: '16px',
                  marginTop: 0,
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isDarkTheme ? '#a855f7' : '#8b5cf6'
                }}>
                  <span style={{ fontSize: '20px' }}>📈</span> Real-Time Data Sources
                </h3>
                <p style={{
                  ...SHARED_STYLES.text.body(isDarkTheme),
                  fontSize: '13px',
                  marginBottom: '12px'
                }}>
                  Our platform integrates multiple data streams updated every 2 days:
                </p>
                <ul style={{ 
                  margin: 0,
                  paddingLeft: '20px',
                  ...SHARED_STYLES.text.body(isDarkTheme),
                  fontSize: '13px'
                }}>
                  <li style={{ marginBottom: '8px' }}><strong>GPS Tracking Data:</strong> {dynamicStats.totalGridCells.toLocaleString()} vessel movement patterns aggregated into 1km grids</li>
                  <li style={{ marginBottom: '8px' }}><strong>Fisheries Surveys:</strong> Catch, effort, and economic data from {dynamicStats.totalRegions} coastal communities</li>
                  <li style={{ marginBottom: '8px' }}><strong>Administrative Boundaries:</strong> Official district boundaries for {dynamicStats.totalCountries} countries</li>
                  <li><strong>Market Data:</strong> Fish price trends and revenue calculations across all regions</li>
                </ul>
              </div>

              {/* Use cases section */}
              <div style={{
                backgroundColor: isDarkTheme ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: `1px solid ${isDarkTheme ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)'}`
              }}>
                <h3 style={{ 
                  ...SHARED_STYLES.text.subheading(isDarkTheme),
                  fontSize: '16px',
                  marginTop: 0,
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isDarkTheme ? '#fbbf24' : '#f59e0b'
                }}>
                  <span style={{ fontSize: '20px' }}>🎓</span> Who Uses This Tool
                </h3>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  ...SHARED_STYLES.text.body(isDarkTheme),
                  fontSize: '13px'
                }}>
                  <div>
                    <strong>Marine Researchers</strong><br/>
                    <span style={{ opacity: 0.8 }}>Study fishing patterns and ecosystem impacts</span>
                  </div>
                  <div>
                    <strong>Policy Makers</strong><br/>
                    <span style={{ opacity: 0.8 }}>Design evidence-based fisheries management</span>
                  </div>
                  <div>
                    <strong>Conservation Groups</strong><br/>
                    <span style={{ opacity: 0.8 }}>Monitor fishing pressure in protected areas</span>
                  </div>
                  <div>
                    <strong>Fishing Communities</strong><br/>
                    <span style={{ opacity: 0.8 }}>Understand local fishing dynamics</span>
                  </div>
                </div>
              </div>

              {/* Quick start guide */}
              <div style={{
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
              }}>
                <h3 style={{ 
                  ...SHARED_STYLES.text.subheading(isDarkTheme),
                  fontSize: '16px',
                  marginTop: 0,
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>🚀</span> Quick Start Guide
                </h3>
                <ol style={{ 
                  margin: 0,
                  paddingLeft: '20px',
                  ...SHARED_STYLES.text.body(isDarkTheme),
                  fontSize: '13px'
                }}>
                  <li style={{ marginBottom: '8px' }}>Click any district on the map to view detailed fisheries data</li>
                  <li style={{ marginBottom: '8px' }}>Toggle between satellite and street view using the map style button</li>
                  <li style={{ marginBottom: '8px' }}>Switch visualization modes between 3D columns and heat maps</li>
                  <li style={{ marginBottom: '8px' }}>Use the legend panel to filter fishing effort by time ranges</li>
                  <li>Compare different metrics (CPUE, prices) using the dropdown selector</li>
                </ol>
              </div>

              {/* Footer with version and credits */}
              <div style={{
                borderTop: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{
                    ...SHARED_STYLES.text.muted(isDarkTheme),
                    fontSize: '12px'
                  }}>
                    PESKAS SSFs Explorer v1.0.0
                  </span>
                  <span style={{
                    ...SHARED_STYLES.text.muted(isDarkTheme),
                    fontSize: '11px'
                  }}>
                    Data updated every 2 days • Last sync: {dynamicStats.lastSyncDate}
                  </span>
                </div>
                <div style={{
                  ...SHARED_STYLES.text.muted(isDarkTheme),
                  fontSize: '11px',
                  textAlign: 'right'
                }}>
                  Covering {dynamicStats.totalCountries} countries<br/>
                  {dynamicStats.totalRegions} regions • {dynamicStats.totalGridCells.toLocaleString()} GPS grid cells
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header; 