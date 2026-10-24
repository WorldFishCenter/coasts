import { CHOROPLETH_CLASSES, getChoroplethColors } from './mapPalette';

const COLORS = getChoroplethColors(false);

/**
 * Calculate quantile breaks for better data distribution representation
 */
const calculateQuantileBreaks = (values, numBreaks) => {
  const sortedValues = [...values].sort((a, b) => a - b);
  const breaks = [];
  
  for (let i = 0; i < numBreaks; i++) {
    // Class starts at 0, 1/n, ..., (n-1)/n, so the top class holds the top nth of districts, not just the maximum.
    const quantile = i / numBreaks;
    const index = Math.floor(quantile * sortedValues.length);
    breaks.push(sortedValues[index]);
  }
  
  return breaks;
};

const calculateLinearBreaks = (min, max, numBreaks) => {
  if (max <= min) return Array.from({ length: numBreaks }, () => min);
  const span = max - min;
  return Array.from({ length: numBreaks }, (_, i) => min + (span * i) / numBreaks);
};

const ensureIncreasingBreaks = (breaks, min, max) => {
  const safeBreaks = [...breaks];
  const epsilon = Math.max((max - min) / 1000, 1e-6);
  for (let i = 1; i < safeBreaks.length; i++) {
    if (safeBreaks[i] <= safeBreaks[i - 1]) {
      safeBreaks[i] = safeBreaks[i - 1] + epsilon;
    }
  }
  return safeBreaks;
};

export const calculateMetricStats = (boundaries, selectedMetric) => {
  if (!boundaries || !boundaries.features) {
    return { 
      grades: [0, 1, 2, 3, 4, 5, 6, 7], 
      stops: Array.from({length: 8}, (_, i) => [i, COLORS[i]]).flat()
    };
  }
  
  const values = boundaries.features
    .map(f => f.properties[selectedMetric])
    .filter(v => v !== null && v !== undefined && !Number.isNaN(Number(v)))
    .map(Number);
    
  if (values.length === 0) {
    return { 
      grades: [0, 1, 2, 3, 4, 5, 6, 7], 
      stops: Array.from({length: 8}, (_, i) => [i, COLORS[i]]).flat()
    };
  }
  
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Start with quantiles, but fallback if too many duplicate breakpoints.
  const quantileGrades = calculateQuantileBreaks(values, CHOROPLETH_CLASSES);
  const uniqueQuantiles = new Set(quantileGrades.map((v) => Number(v.toFixed(6))));
  const shouldFallbackToLinear =
    uniqueQuantiles.size < Math.min(4, CHOROPLETH_CLASSES) && maxValue > minValue;

  const rawGrades = shouldFallbackToLinear
    ? calculateLinearBreaks(minValue, maxValue, CHOROPLETH_CLASSES)
    : quantileGrades;

  const grades = ensureIncreasingBreaks(rawGrades, minValue, maxValue);
  const stops = grades.flatMap((g, idx) => [g, COLORS[idx]]);
  
  return { grades, stops };
}; 