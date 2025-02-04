import { useState, useEffect } from 'react';
import { loadBoundaries, loadFisheryData, mergeBoundaryAndFisheryData } from '../services/dataService';

export const useMapData = () => {
  const [boundaries, setBoundaries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalValue, setTotalValue] = useState(0);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [boundaryData, fisheryValues] = await Promise.all([
          loadBoundaries(),
          loadFisheryData()
        ]);

        if (boundaryData && fisheryValues) {
          const mergedData = mergeBoundaryAndFisheryData(boundaryData, fisheryValues);
          setBoundaries(mergedData);
          
          // Calculate total value
          const total = Object.values(fisheryValues).reduce((sum, value) => sum + value, 0);
          setTotalValue(total);
        }
      } catch (err) {
        setError('Error loading map data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    boundaries,
    loading,
    error,
    totalValue
  };
}; 