import { memo } from 'react';
import { Satellite } from 'lucide-react';

const MapStyleToggle = memo(({ isSatellite, onToggle }) => (
  <button
    onClick={onToggle}
    aria-pressed={isSatellite}
    aria-label="Satellite imagery"
    title={isSatellite ? 'Back to the plain map' : 'Satellite imagery'}
    className="map-button"
  >
    <Satellite size={18} strokeWidth={1.75} aria-hidden="true" />
  </button>
));

MapStyleToggle.displayName = 'MapStyleToggle';

export default MapStyleToggle;
