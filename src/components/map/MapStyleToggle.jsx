import React, { memo } from 'react';
import { Satellite, Map as MapIcon } from 'lucide-react';

const MapStyleToggle = memo(({ isDarkTheme, isSatellite, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      title={isSatellite ? 'Switch to standard view' : 'Switch to satellite view'}
      style={{
        position: 'absolute',
        top: 24,
        right: 24,
        width: '48px',
        height: '48px',
        padding: '8px',
        backgroundColor: isDarkTheme ? 'rgba(28, 28, 28, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        boxShadow: isDarkTheme 
          ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)' 
          : '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)',
        border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        cursor: 'pointer',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
        color: isDarkTheme ? '#ffffff' : '#000000'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.backgroundColor = isDarkTheme 
          ? 'rgba(31, 41, 55, 0.9)' 
          : 'rgba(255, 255, 255, 0.95)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.backgroundColor = isDarkTheme 
          ? 'rgba(28, 28, 28, 0.9)' 
          : 'rgba(255, 255, 255, 0.9)';
      }}
    >
      {isSatellite ? (
        <MapIcon size={28} strokeWidth={1.5} />
      ) : (
        <Satellite size={28} strokeWidth={1.5} />
      )}
    </button>
  );
});

export default MapStyleToggle; 