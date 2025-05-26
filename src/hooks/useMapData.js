import { useState, useEffect } from 'react';
import { loadMapData, loadTimeSeriesData, loadPdsGridsData, getLatestMetrics } from '../services/dataService';

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

        // Add latest metrics to each feature from time series data
        const enrichedMapData = {
          ...mapData,
          features: mapData.features.map(feature => {
            const country = feature.properties.country;
            const region = feature.properties.region;
            const latestMetrics = getLatestMetrics(timeSeries, country, region);
            
            return {
              ...feature,
              properties: {
                ...feature.properties,
                // Add metrics if they exist, otherwise they'll be undefined
                mean_cpue: latestMetrics?.mean_cpue,
                mean_cpua: latestMetrics?.mean_cpua,
                mean_rpue: latestMetrics?.mean_rpue,
                mean_rpua: latestMetrics?.mean_rpua,
                mean_price_kg: latestMetrics?.mean_price_kg
              }
            };
          })
        };

        // Calculate total value from the enriched map data
        const total = enrichedMapData.features.reduce((sum, feature) => {
          const value = feature.properties.mean_cpue;
          return sum + (value !== null && value !== undefined ? value : 0);
        }, 0);

        setBoundaries(enrichedMapData);
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