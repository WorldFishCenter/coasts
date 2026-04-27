import { useState, useEffect } from 'react';
import {
  loadMapDataGaul1,
  loadMapDataGaul2,
  loadTimeSeriesGaul1,
  loadTimeSeriesGaul2,
  loadPdsFishingGroundsData,
  loadPdsH3EffortData,
  loadFrameGearsData,
  aggregateFrameGearsData,
  getTimeSeriesKey,
  getTimeSeriesKeyGaul1,
  getLatestMetrics,
  getLatestMetricsGaul1
} from '../services/dataService';

export const useMapData = () => {
  const [boundariesGaul1, setBoundariesGaul1] = useState(null);
  const [boundariesGaul2, setBoundariesGaul2] = useState(null);
  const [timeSeriesGaul1, setTimeSeriesGaul1] = useState(null);
  const [timeSeriesGaul2, setTimeSeriesGaul2] = useState(null);

  const [pdsFishingGroundsData, setPdsFishingGroundsData] = useState(null);
  const [pdsH3EffortData, setPdsH3EffortData] = useState(null);
  const [frameGearsData, setFrameGearsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalValueGaul1, setTotalValueGaul1] = useState(0);
  const [totalValueGaul2, setTotalValueGaul2] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [mapGaul1, mapGaul2, tsGaul1, tsGaul2, fishingGrounds, h3EffortData, frameGearsRows] =
          await Promise.all([
          loadMapDataGaul1(),
          loadMapDataGaul2(),
          loadTimeSeriesGaul1(),
          loadTimeSeriesGaul2(),
          loadPdsFishingGroundsData(),
          loadPdsH3EffortData(),
          loadFrameGearsData()
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


        if (!fishingGrounds) {
          console.warn('PDS fishing grounds data not available');
        }
        if (!h3EffortData) {
          console.warn('PDS H3 effort data not available');
        }
        if (!frameGearsRows) {
          console.warn('Frame-gears data not available');
        }

        const frameGearsAggregates = aggregateFrameGearsData(frameGearsRows);

        // Enrich GAUL1 map with latest metrics
        const enrichedGaul1 = {
          ...mapGaul1,
          features: mapGaul1.features.map((feature) => {
            const { country, gaul1_name } = feature.properties;
            const latestMetrics = getLatestMetricsGaul1(tsGaul1, country, gaul1_name);
            const gaul1Key = getTimeSeriesKeyGaul1(country, gaul1_name);
            const frameMetrics = frameGearsAggregates.gaul1[gaul1Key] ?? null;
            return {
              ...feature,
              properties: {
                ...feature.properties,
                mean_cpue: latestMetrics?.mean_cpue,
                mean_cpua: latestMetrics?.mean_cpua,
                mean_rpue: latestMetrics?.mean_rpue,
                mean_rpua: latestMetrics?.mean_rpua,
                mean_price_kg: latestMetrics?.mean_price_kg,
                fishers_total: frameMetrics?.fishers_total ?? null,
                fishers_male: frameMetrics?.fishers_male ?? null,
                fishers_female: frameMetrics?.fishers_female ?? null,
                boats_total: frameMetrics?.boats_total ?? null
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
            const gaul2Key = getTimeSeriesKey(country, gaul1_name, gaul2_name);
            const frameMetrics = frameGearsAggregates.gaul2[gaul2Key] ?? null;
            return {
              ...feature,
              properties: {
                ...feature.properties,
                mean_cpue: latestMetrics?.mean_cpue,
                mean_cpua: latestMetrics?.mean_cpua,
                mean_rpue: latestMetrics?.mean_rpue,
                mean_rpua: latestMetrics?.mean_rpua,
                mean_price_kg: latestMetrics?.mean_price_kg,
                fishers_total: frameMetrics?.fishers_total ?? null,
                fishers_male: frameMetrics?.fishers_male ?? null,
                fishers_female: frameMetrics?.fishers_female ?? null,
                boats_total: frameMetrics?.boats_total ?? null
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
        setPdsFishingGroundsData(fishingGrounds);
        setPdsH3EffortData(Array.isArray(h3EffortData) ? h3EffortData : null);
        setFrameGearsData(frameGearsAggregates);
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
    pdsFishingGroundsData,
    pdsH3EffortData,
    frameGearsData,
    loading,
    error,
    totalValueGaul1,
    totalValueGaul2
  };
};
