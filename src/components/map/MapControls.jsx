import { memo } from 'react';
import { GeoJSON } from 'react-leaflet';

const MapControls = memo(({ 
  boundaries, 
  palmaArea, 
  style, 
  districtStyle, 
  onEachFeature, 
  onEachDistrictFeature 
}) => {
  return (
    <>
      {boundaries && (
        <GeoJSON
          data={boundaries}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
      {palmaArea && (
        <GeoJSON
          data={palmaArea}
          style={districtStyle}
          onEachFeature={onEachDistrictFeature}
        />
      )}
    </>
  );
});

MapControls.displayName = 'MapControls';

export default MapControls; 