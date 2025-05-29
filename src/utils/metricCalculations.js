import { COLORS } from '../components/map/UnifiedLegend';

/**
 * Calculate quantile breaks for better data distribution representation
 */
const calculateQuantileBreaks = (values, numBreaks) => {
  const sortedValues = [...values].sort((a, b) => a - b);
  const breaks = [];
  
  for (let i = 0; i < numBreaks; i++) {
    const quantile = i / (numBreaks - 1);
    const index = Math.floor(quantile * (sortedValues.length - 1));
    breaks.push(sortedValues[index]);
  }
  
  return breaks;
};

export const calculateMetricStats = (boundaries, selectedMetric) => {
  if (!boundaries || !boundaries.features) {
    return { 
      grades: [0, 1, 2, 3, 4, 5, 6, 7], 
      stops: Array.from({length: 8}, (_, i) => [i, COLORS[i]]).flat()
    };
  }
  
  const values = boundaries.features
    .map(f => Number(f.properties[selectedMetric]))
    .filter(v => !Number.isNaN(v));
    
  if (values.length === 0) {
    return { 
      grades: [0, 1, 2, 3, 4, 5, 6, 7], 
      stops: Array.from({length: 8}, (_, i) => [i, COLORS[i]]).flat()
    };
  }
  
  // Use quantile breaks for better data distribution representation
  const grades = calculateQuantileBreaks(values, COLORS.length);
  const stops = grades.flatMap((g, idx) => [g, COLORS[idx]]);
  
  return { grades, stops };
}; 