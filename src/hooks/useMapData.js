import { useState, useEffect } from 'react';
import { loadMapData, loadTimeSeriesData, loadPdsGridsData } from '../services/dataService';

export const useMapData = () => {
  const [boundaries, setBoundaries] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [pdsGridsData, setPdsGridsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all data sources
        const [mapData, timeSeries, pdsGrids] = await Promise.all([
          loadMapData(),
          loadTimeSeriesData(),
          loadPdsGridsData()
        ]);

        if (!mapData) {
          throw new Error('Failed to load map data');
        }

        if (!timeSeries) {
          throw new Error('Failed to load time series data');
        }

        // PDS grids data is optional, so we don't throw error if it's missing
        if (!pdsGrids) {
          console.warn('PDS grids data not available');
        }

        // Calculate total value from the latest metrics
        const total = Object.values(timeSeries).reduce((sum, regionData) => {
          if (regionData.data && regionData.data.length > 0) {
            const latestData = regionData.data.sort((a, b) => 
              new Date(b.date) - new Date(a.date)
            )[0];
            return sum + (latestData.mean_cpue || 0);
          }
          return sum;
        }, 0);

        setBoundaries(mapData);
        setTimeSeriesData(timeSeries);
        setPdsGridsData(pdsGrids);
        setTotalValue(total);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    boundaries,
    timeSeriesData,
    pdsGridsData,
    loading,
    error,
    totalValue
  };
}; 