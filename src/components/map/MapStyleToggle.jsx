import React, { memo } from 'react';
import { Satellite, Map as MapIcon } from 'lucide-react';

const MapStyleToggle = memo(({ isDarkTheme, isSatellite, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      title={isSatellite ? 'Switch to standard view' : 'Switch to satellite view'}
      className="absolute top-6 right-6 w-12 h-12 p-2 glass-panel rounded-xl z-[1000] flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 group cursor-pointer"
    >
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
      {isSatellite ? (
        <MapIcon size={24} strokeWidth={2} className="text-foreground/70 group-hover:text-primary transition-colors relative z-10" />
      ) : (
        <Satellite size={24} strokeWidth={2} className="text-foreground/70 group-hover:text-primary transition-colors relative z-10" />
      )}
    </button>
  );
});

export default MapStyleToggle; 