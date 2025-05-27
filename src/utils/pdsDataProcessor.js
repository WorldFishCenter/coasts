// Singleton to store filtered PDS data
let FILTERED_PDS_DATA = [];

export const processPdsData = (pdsGridsData) => {
  if (pdsGridsData && Array.isArray(pdsGridsData)) {
    FILTERED_PDS_DATA = pdsGridsData
      .filter(d => !d.type?.includes('metadata'))
      .map(d => ({
        position: [parseFloat(d.lng_grid_1km), parseFloat(d.lat_grid_1km)],
        avgTimeHours: parseFloat(d.avg_time_hours) || 0,
        totalVisits: parseInt(d.total_visits) || 0,
        avgSpeed: parseFloat(d.avg_speed) || 0,
        originalCells: parseInt(d.original_cells) || 0
      }))
      .filter(d => 
        !isNaN(d.position[0]) && 
        !isNaN(d.position[1]) &&
        isFinite(d.position[0]) &&
        isFinite(d.position[1])
      );
    console.log('Pre-filtered PDS data:', FILTERED_PDS_DATA.length);
    return true;
  }
  return false;
};

export const getFilteredPdsData = () => FILTERED_PDS_DATA;

export const transformPdsData = (selectedRanges) => {
  if (!FILTERED_PDS_DATA || !Array.isArray(FILTERED_PDS_DATA)) {
    console.log('No filtered PDS data available');
    return [];
  }
  
  const filtered = FILTERED_PDS_DATA.filter(d => 
    selectedRanges.some(range => 
      d.avgTimeHours >= range.min && (
        range.max === Infinity ? true : d.avgTimeHours < range.max
      )
    )
  );
  console.log('Transformed PDS data length:', filtered.length);
  console.log('Sample data:', filtered[0]);
  return filtered || [];
}; 