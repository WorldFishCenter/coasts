import { useState } from 'react';

const Header = ({ onThemeChange }) => {
  const [isDark, setIsDark] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    onThemeChange(!isDark);
  };

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        color: isDark ? '#fff' : '#2c3e50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 9999,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Left section with logo and title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            backgroundColor: '#3498db',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            C
          </div>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 'bold' 
            }}>
              Coastal Districts Explorer
            </h1>
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.7,
              marginTop: '2px'
            }}>
              Interactive Analysis Tool
            </div>
          </div>
        </div>

        {/* Right section with About and theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => setShowAbout(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: isDark ? '#fff' : '#2c3e50',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            About
          </button>
          <button
            onClick={handleThemeToggle}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isDark ? '#fff' : '#2c3e50',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
          >
            {isDark ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                Light Mode
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Dark Mode
              </>
            )}
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
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: isDark ? '#1a1a1a' : 'white',
            color: isDark ? '#fff' : '#2c3e50',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <button
              onClick={() => setShowAbout(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: isDark ? '#fff' : '#2c3e50',
                padding: '5px'
              }}
            >
              ×
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px' }}>About This Map</h2>
            <div style={{ lineHeight: '1.6' }}>
              <p>
                The Coastal Districts Explorer is an interactive mapping tool designed to visualize and analyze district-level data in coastal regions. This tool is part of a broader initiative to understand and monitor coastal development, resource distribution, and demographic patterns.
              </p>
              <h3 style={{ fontSize: '18px', marginTop: '20px' }}>Features</h3>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Interactive district selection and comparison</li>
                <li>Real-time data visualization with customizable parameters</li>
                <li>Advanced filtering and analysis tools</li>
                <li>Export capabilities for further analysis</li>
              </ul>
              <h3 style={{ fontSize: '18px', marginTop: '20px' }}>Data Sources</h3>
              <p>
                The map utilizes comprehensive district-level data collected from various sources, including:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Administrative boundaries from national mapping agencies</li>
                <li>Demographic data from recent census</li>
                <li>Economic indicators from regional development reports</li>
                <li>Environmental metrics from coastal monitoring stations</li>
              </ul>
              <p style={{ marginTop: '20px', fontSize: '14px', opacity: 0.7 }}>
                Version 1.0.0 | Last Updated: February 2024
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header; 