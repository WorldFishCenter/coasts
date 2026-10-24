// Map colours for the species-sheet world, from the Peskas brand kit.
// Districts are teal (the survey figures), GPS effort is navy ink, fishing grounds are coral.

const CHOROPLETH_LIGHT = ['#eef6f6', '#d6ebec', '#bddfe1', '#a9d1d4', '#7fbcc1', '#5aa8af', '#2f8a93', '#006d77'];
const CHOROPLETH_DARK = ['#223638', '#284446', '#2f5355', '#356366', '#3d7a80', '#4f969c', '#7ab9be', '#c1e2e4'];

const EFFORT_LIGHT = ['#a3b3bf', '#6a8295', '#34506a', '#0b2233'];
const EFFORT_DARK = ['#5e6e71', '#8b9a9d', '#c0cbcd', '#ffffff'];

const GROUNDS_LIGHT = ['#f4d6cc', '#eaa48e', '#d96c50', '#a8452c'];
const GROUNDS_DARK = ['#6e3a2d', '#a85c47', '#e69f8d', '#f7d3c9'];

// Depth contours: darker near the coast, fading with depth, like a chart's soundings.
const BATHYMETRY_LIGHT = ['#7fa9ae', '#93b6ba', '#a8c4c7', '#bccfd2', '#cddcde', '#dbe6e7'];
const BATHYMETRY_DARK = ['#3f7378', '#386770', '#315b62', '#2b4f55', '#27454a', '#233c40'];

export const BATHYMETRY_DEPTHS = [5, 40, 120, 300, 1000, 2000];

// Number of classes the district shading uses (calculateMetricStats sizes its breaks from this).
export const CHOROPLETH_CLASSES = CHOROPLETH_LIGHT.length;

export const getChoroplethColors = (isDark) => (isDark ? CHOROPLETH_DARK : CHOROPLETH_LIGHT);
export const getEffortColors = (isDark) => (isDark ? EFFORT_DARK : EFFORT_LIGHT);
export const getGroundsColors = (isDark) => (isDark ? GROUNDS_DARK : GROUNDS_LIGHT);
export const getBathymetryColors = (isDark) => (isDark ? BATHYMETRY_DARK : BATHYMETRY_LIGHT);

// Districts without survey data: a pale fill under a hatch (see useMapLayers).
export const getNoDataColor = (isDark) => (isDark ? [164, 177, 179] : [75, 97, 112]);

export const hexToRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16)
];

// Index of the class a value falls in, given ascending class starts.
export const gradeIndex = (value, grades) => {
  let index = 0;
  for (let i = 0; i < grades.length; i++) {
    if (value >= grades[i]) index = i;
  }
  return index;
};
