import { geoArea, geoBounds, geoMercator, geoPath } from 'd3';

// d3-geo reads a ring's winding to decide which side is inside; GeoJSON files often wind
// the other way, which d3 takes as "the whole globe minus this district". Rewind each polygon
// whose area comes out larger than a hemisphere.
const rewindPolygon = (rings) => {
  const polygon = { type: 'Polygon', coordinates: rings };
  return geoArea(polygon) > 2 * Math.PI ? rings.map((ring) => [...ring].reverse()) : rings;
};

export const rewindFeature = (feature) => {
  const geometry = feature?.geometry;
  if (!geometry) return feature;
  if (geometry.type === 'Polygon') {
    return { ...feature, geometry: { ...geometry, coordinates: rewindPolygon(geometry.coordinates) } };
  }
  if (geometry.type === 'MultiPolygon') {
    return { ...feature, geometry: { ...geometry, coordinates: geometry.coordinates.map(rewindPolygon) } };
  }
  return feature;
};

// Path data and projection for features drawn into a width x height box.
export const outlineFor = (features, width, height, margin = 6) => {
  const collection = { type: 'FeatureCollection', features: features.map(rewindFeature) };
  const projection = geoMercator().fitExtent([[margin, margin], [width - margin, height - margin]], collection);
  const path = geoPath(projection);
  return { collection, projection, path };
};

// [[west, south], [east, north]] of features, for map.fitBounds.
export const boundsOf = (features) => geoBounds({ type: 'FeatureCollection', features: features.map(rewindFeature) });
