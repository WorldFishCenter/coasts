import { useState, useEffect } from 'react';
import {
  loadMapDataGaul1,
  loadMapDataGaul2,
  loadTimeSeriesGaul1,
  loadTimeSeriesGaul2,
  loadPdsGridsData,
  getLatestMetrics,
  getLatestMetricsGaul1
} from '../services/dataService';

export const useMapData = () => {
  const [boundariesGaul1, setBoundariesGaul1] = useState(null);
  const [boundariesGaul2, setBoundariesGaul2] = useState(null);
  const [timeSeriesGaul1, setTimeSeriesGaul1] = useState(null);
  const [timeSeriesGaul2, setTimeSeriesGaul2] = useState(null);
  const [pdsGridsData, setPdsGridsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalValueGaul1, setTotalValueGaul1] = useState(0);
  const [totalValueGaul2, setTotalValueGaul2] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [mapGaul1, mapGaul2, tsGaul1, tsGaul2, pdsGrids] = await Promise.all([
          loadMapDataGaul1(),
          loadMapDataGaul2(),
          loadTimeSeriesGaul1(),
          loadTimeSeriesGaul2(),
          loadPdsGridsData()
        ]);

        if (!mapGaul2) {
          throw new Error('Failed to load GAUL2 map data');
        }
        if (!tsGaul2) {
          throw new Error('Failed to load GAUL2 time series data');
        }
        if (!mapGaul1) {
          throw new Error('Failed to load GAUL1 map data');
        }
        if (!tsGaul1) {
          throw new Error('Failed to load GAUL1 time series data');
        }

        if (!pdsGrids) {
          console.warn('PDS grids data not available');
        }

        // Enrich GAUL1 map with latest metrics
        const enrichedGaul1 = {
          ...mapGaul1,
          features: mapGaul1.features.map((feature) => {
            const { country, gaul1_name } = feature.properties;
            const latestMetrics = getLatestMetricsGaul1(tsGaul1, country, gaul1_name);
            return {
              ...feature,
              properties: {
                ...feature.properties,
                mean_cpue: latestMetrics?.mean_cpue,
                mean_cpua: latestMetrics?.mean_cpua,
                mean_rpue: latestMetrics?.mean_rpue,
                mean_rpua: latestMetrics?.mean_rpua,
                mean_price_kg: latestMetrics?.mean_price_kg
              }
            };
          })
        };

        // Enrich GAUL2 map with latest metrics
        const enrichedGaul2 = {
          ...mapGaul2,
          features: mapGaul2.features.map((feature) => {
            const { country, gaul1_name, gaul2_name } = feature.properties;
            const latestMetrics = getLatestMetrics(tsGaul2, country, gaul1_name, gaul2_name);
            return {
              ...feature,
              properties: {
                ...feature.properties,
                mean_cpue: latestMetrics?.mean_cpue,
                mean_cpua: latestMetrics?.mean_cpua,
                mean_rpue: latestMetrics?.mean_rpue,
                mean_rpua: latestMetrics?.mean_rpua,
                mean_price_kg: latestMetrics?.mean_price_kg
              }
            };
          })
        };

        const total1 = enrichedGaul1.features.reduce(
          (sum, f) => sum + (f.properties.mean_cpue != null ? f.properties.mean_cpue : 0),
          0
        );
        const total2 = enrichedGaul2.features.reduce(
          (sum, f) => sum + (f.properties.mean_cpue != null ? f.properties.mean_cpue : 0),
          0
        );

        setBoundariesGaul1(enrichedGaul1);
        setBoundariesGaul2(enrichedGaul2);
        setTimeSeriesGaul1(tsGaul1);
        setTimeSeriesGaul2(tsGaul2);
        setPdsGridsData(pdsGrids);
        setTotalValueGaul1(total1);
        setTotalValueGaul2(total2);
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
    boundariesGaul1,
    boundariesGaul2,
    timeSeriesGaul1,
    timeSeriesGaul2,
    pdsGridsData,
    loading,
    error,
    totalValueGaul1,
    totalValueGaul2
  };
};
