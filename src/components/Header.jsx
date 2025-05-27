import { useState } from 'react';
import { Info, Sun, Moon } from 'lucide-react';
import { SHARED_STYLES } from '../utils/gridLayerConfig';

const Header = ({ 
  isDarkTheme,
  onThemeChange
}) => {
  const [showAbout, setShowAbout] = useState(false);

  const handleThemeToggle = () => {
    onThemeChange(!isDarkTheme);
  };

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
                marginBottom: '16px'
              }}>
                The SSFs explorer is an interactive mapping tool designed to visualize and analyze small scale fisheries data in coastal regions. This tool is part of a broader initiative to understand and monitor coastal development, resource distribution, and demographic patterns.
              </p>

              {/* Features section */}
              <div style={{
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                borderRadius: '10px',
                padding: '20px',
                marginBottom: '20px',
                border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
              }}>
                <h3 style={{ 
                  ...SHARED_STYLES.text.subheading(isDarkTheme),
                  fontSize: '16px',
                  marginTop: 0,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>✨</span> Key Features
                </h3>
                <ul style={{ 
                  margin: 0,
                  paddingLeft: '20px',
                  ...SHARED_STYLES.text.body(isDarkTheme),
                  fontSize: '13px'
                }}>
                  <li style={{ marginBottom: '8px' }}>Interactive district selection and comparison</li>
                  <li style={{ marginBottom: '8px' }}>Real-time data visualization with customizable parameters</li>
                  <li style={{ marginBottom: '8px' }}>Advanced filtering and analysis tools</li>
                  <li>Export capabilities for further analysis</li>
                </ul>
              </div>

              {/* Data sources section */}
              <div style={{
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                borderRadius: '10px',
                padding: '20px',
                marginBottom: '20px',
                border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
              }}>
                <h3 style={{ 
                  ...SHARED_STYLES.text.subheading(isDarkTheme),
                  fontSize: '16px',
                  marginTop: 0,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>📊</span> Data Sources
                </h3>
                <p style={{
                  ...SHARED_STYLES.text.body(isDarkTheme),
                  fontSize: '13px',
                  marginBottom: '12px'
                }}>
                  The map utilizes district-level data collected from various sources:
                </p>
                <ul style={{ 
                  margin: 0,
                  paddingLeft: '20px',
                  ...SHARED_STYLES.text.body(isDarkTheme),
                  fontSize: '13px'
                }}>
                  <li style={{ marginBottom: '8px' }}>Administrative boundaries from national mapping agencies</li>
                  <li style={{ marginBottom: '8px' }}>Demographic data from recent census</li>
                  <li style={{ marginBottom: '8px' }}>Economic indicators from regional development reports</li>
                  <li>Environmental metrics from coastal monitoring stations</li>
                </ul>
              </div>

              {/* Version info */}
              <div style={{
                borderTop: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  ...SHARED_STYLES.text.muted(isDarkTheme),
                  fontSize: '12px'
                }}>
                  Version 1.0.0
                </span>
                <span style={{
                  ...SHARED_STYLES.text.muted(isDarkTheme),
                  fontSize: '12px'
                }}>
                  Last Updated: February 2024
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header; 