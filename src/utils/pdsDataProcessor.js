// Process and filter H3 Effort data
export const processH3EffortData = (h3Data, selectedYear) => {
  if (!h3Data || !Array.isArray(h3Data)) {
    return [];
  }
  
  if (!selectedYear || selectedYear === 'all') {
    return h3Data;
  }
  
  const targetYear = parseInt(selectedYear, 10);
  if (isNaN(targetYear)) {
    return h3Data;
  }
  
  const filtered = h3Data.filter(d => parseInt(d.year, 10) === targetYear);
  return filtered;
};
 