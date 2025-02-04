import { useState, useEffect, useCallback } from 'react';
import { loadBoundaries, loadFisheryData, mergeBoundaryAndFisheryData, loadPalmaArea, loadDistrictValues, mergePalmaWithDistrictValues } from '../services/dataService';

export const useMapData = () => {
  const [boundaries, setBoundaries] = useState(null);
  const [fisheryData, setFisheryData] = useState(null);
  const [palmaArea, setPalmaArea] = useState(null);
  const [districtValues, setDistrictValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalValue, setTotalValue] = useState(0);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [boundaryData, fisheryValues, palmaData, districtData] = await Promise.all([
          loadBoundaries(),
          loadFisheryData(),
          loadPalmaArea(),
          loadDistrictValues()
        ]);

        if (boundaryData && fisheryValues) {
          const mergedData = mergeBoundaryAndFisheryData(boundaryData, fisheryValues);
          setBoundaries(mergedData);
          setFisheryData(fisheryValues);
        }

        if (palmaData && districtData) {
          const mergedPalmaData = mergePalmaWithDistrictValues(palmaData, districtData);
          setPalmaArea(mergedPalmaData);
          setDistrictValues(districtData);
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

  // Calculate total value
  useEffect(() => {
    if (palmaArea?.features) {
      const total = palmaArea.features.reduce((sum, feature) => {
        return sum + (feature.properties.value || 0);
      }, 0);
      setTotalValue(total);
    }
  }, [palmaArea]);

  // Calculate center of Palma area
  const getPalmaCenter = useCallback(() => {
    if (!palmaArea?.features?.[0]?.geometry?.coordinates?.[0]) {
      return [-12.5, 40.2]; // Default center
    }

    const coords = palmaArea.features[0].geometry.coordinates[0];
    return [
      (coords[0][1] + coords[coords.length-1][1]) / 2,
      (coords[0][0] + coords[coords.length-1][0]) / 2
    ];
  }, [palmaArea]);

  return {
    boundaries,
    fisheryData,
    palmaArea,
    districtValues,
    loading,
    error,
    totalValue,
    getPalmaCenter
  };
}; 