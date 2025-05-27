import { COLORS } from '../components/map/UnifiedLegend';

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
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / (COLORS.length - 1 || 1);
  const grades = COLORS.map((_, idx) => min + idx * step);
  const stops = grades.flatMap((g, idx) => [g, COLORS[idx]]);
  
  return { grades, stops };
}; 