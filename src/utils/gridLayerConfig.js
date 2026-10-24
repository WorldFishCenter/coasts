/**
 * Configuration for PDS Grid Layer visualization
 */

export const ACTIVITY_METRICS = [
  { id: 'fishing_hours', label: 'Fishing hours', format: (v) => v > 1000 ? `${(v/1000).toFixed(1)}k h` : `${v.toFixed(1)} h` },
  { id: 'avg_hours_per_day', label: 'Hours per active day', format: (v) => `${v.toFixed(2)} h/day` },
  { id: 'unique_trips', label: 'Trips', format: (v) => v > 1000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString() },
  { id: 'constancy', label: 'Constancy', format: (v) => v.toFixed(4) }
];

// Calculate statistics from H3 Effort data
export const calculateH3Stats = (h3Data) => {
  if (!h3Data || h3Data.length === 0) {
    return {
      activeCells: 0,
      totalFishingHours: 0,
      totalUniqueTrips: 0,
      avgVisitsPerDay: 0,
      maxFishingHours: 0,
    };
  }
  
  const totalFishingHours = h3Data.reduce((sum, d) => sum + (Number(d.fishing_hours) || 0), 0);
  const totalUniqueTrips = h3Data.reduce((sum, d) => sum + (Number(d.unique_trips) || 0), 0);
  const avgVisitsPerDay = h3Data.reduce((sum, d) => sum + (Number(d.avg_visits_per_day) || 0), 0) / h3Data.length;
  const maxFishingHours = Math.max(...h3Data.map(d => Number(d.fishing_hours) || 0));
  
  return {
    activeCells: h3Data.length,
    totalFishingHours,
    totalUniqueTrips,
    avgVisitsPerDay,
    maxFishingHours
  };
};

// Calculate statistics from Fishing Grounds data
export const calculateGroundsStats = (groundsData) => {
  if (!groundsData || !groundsData.features || groundsData.features.length === 0) {
    return {
      totalGrounds: 0,
      totalArea: 0,
      totalFishingHours: 0
    };
  }
  
  const features = groundsData.features;
  const totalArea = features.reduce((sum, f) => sum + (Number(f.properties?.area_km2) || 0), 0);
  const totalFishingHours = features.reduce((sum, f) => sum + (Number(f.properties?.fishing_hours) || 0), 0);
  
  return {
    totalGrounds: features.length,
    totalArea,
    totalFishingHours
  };
}; 