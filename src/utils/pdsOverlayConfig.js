import keplerStyle from '../../kepler_style.json';

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ];
};

const visState = keplerStyle?.config?.visState ?? {};
const mapState = keplerStyle?.config?.mapState ?? {};
const filters = Array.isArray(visState.filters) ? visState.filters : [];
const layers = Array.isArray(visState.layers) ? visState.layers : [];

const effortLayerConfig = layers.find((layer) => layer?.type === 'hexagonId') ?? {};
const groundsLayerConfig = layers.find((layer) => layer?.type === 'geojson') ?? {};

const effortVisConfig = effortLayerConfig?.config?.visConfig ?? {};
const groundsVisConfig = groundsLayerConfig?.config?.visConfig ?? {};
const effortColorField = effortLayerConfig?.visualChannels?.colorField?.name ?? 'avg_hours_per_day';
const groundsColorField = groundsLayerConfig?.visualChannels?.colorField?.name ?? 'avg_hours_per_day';
const tripsFilter = filters.find((filter) => filter?.name?.[0] === 'unique_trips');
const tripsFilterRange = Array.isArray(tripsFilter?.value) ? tripsFilter.value : [4, 3055];

/** Kepler `visState.layerBlending` — drives deck.gl `parameters` for PDS layers only. */
export const KEPLER_LAYER_BLENDING =
  typeof visState.layerBlending === 'string' ? visState.layerBlending : 'additive';

/**
 * Kepler `LAYER_BLENDINGS.additive` → deck.gl 9 / luma.gl 9 `parameters` (WebGPU-style strings).
 * Matches kepler.gl `getLayerBlendingParameters('additive')` — legacy `blendFunc` + GL enums are ignored in v9.
 * @see https://github.com/keplergl/kepler.gl/blob/master/src/utils/src/gl-utils.ts
 * @see https://github.com/keplergl/kepler.gl/blob/master/src/constants/src/default-settings.ts (LAYER_BLENDINGS)
 */
const KEPLER_ADDITIVE_DECK_PARAMETERS = Object.freeze({
  blend: true,
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'dst-alpha',
  blendAlphaSrcFactor: 'src-alpha',
  blendAlphaDstFactor: 'dst-alpha',
  blendColorOperation: 'add',
  blendAlphaOperation: 'add'
});

export const getKeplerPdsLayerParameters = () =>
  KEPLER_LAYER_BLENDING === 'additive' ? KEPLER_ADDITIVE_DECK_PARAMETERS : undefined;

export const KEPLER_INITIAL_VIEW_STATE = {
  longitude: Number.isFinite(mapState.longitude) ? mapState.longitude : 39.20268284002571,
  latitude: Number.isFinite(mapState.latitude) ? mapState.latitude : -6.240651321759819,
  zoom: Number.isFinite(mapState.zoom) ? mapState.zoom : 8.972491655516384,
  pitch: Number.isFinite(mapState.pitch) ? mapState.pitch : 56.337196916920675,
  bearing: Number.isFinite(mapState.bearing) ? mapState.bearing : -2.1198738170347013
};

export const PDS_GROUNDS_COLOR_HEX =
  groundsVisConfig?.colorRange?.colors ?? ['#00939C', '#8BC6C9', '#EB9373', '#C22E00'];
export const PDS_EFFORT_COLOR_HEX =
  effortVisConfig?.colorRange?.colors ?? ['#184E77', '#1584A8', '#59C09C', '#D9ED92'];

export const PDS_GROUNDS_COLOR_RANGE = PDS_GROUNDS_COLOR_HEX.map(hexToRgb);
export const PDS_EFFORT_COLOR_RANGE = PDS_EFFORT_COLOR_HEX.map(hexToRgb);

export const PDS_GROUNDS_METRIC = groundsColorField;
export const PDS_EFFORT_METRIC = effortColorField;

export const PDS_GROUNDS_OPACITY =
  Number.isFinite(groundsVisConfig.opacity) ? groundsVisConfig.opacity : 0.8;
export const PDS_EFFORT_OPACITY =
  Number.isFinite(effortVisConfig.opacity) ? effortVisConfig.opacity : 0.51;
export const PDS_EFFORT_ELEVATION_SCALE =
  Number.isFinite(effortVisConfig.elevationScale) ? effortVisConfig.elevationScale : 54.8;
export const PDS_EFFORT_COVERAGE =
  Number.isFinite(effortVisConfig.coverage) ? effortVisConfig.coverage : 0.5;
export const PDS_EFFORT_SIZE_RANGE =
  Array.isArray(effortVisConfig.sizeRange) && effortVisConfig.sizeRange.length === 2
    ? effortVisConfig.sizeRange
    : [0, 500];
export const PDS_MIN_UNIQUE_TRIPS = 3;
export const PDS_GROUNDS_UNIQUE_TRIPS_FILTER = {
  min: PDS_MIN_UNIQUE_TRIPS,
  max: tripsFilterRange[1] ?? 3055
};

export const getQuantileThresholds = (values, buckets) => {
  if (!Array.isArray(values) || values.length === 0 || buckets <= 1) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const thresholds = [];
  for (let i = 1; i < buckets; i++) {
    const index = Math.floor((i * (sorted.length - 1)) / buckets);
    thresholds.push(sorted[index]);
  }
  return thresholds;
};

export const getColorByQuantile = (value, thresholds, colorRange, alpha = 255) => {
  if (value == null || Number.isNaN(value)) return [0, 0, 0, 0];
  let idx = 0;
  while (idx < thresholds.length && value > thresholds[idx]) {
    idx++;
  }
  const base = colorRange[Math.min(idx, colorRange.length - 1)];
  return [...base, alpha];
};
