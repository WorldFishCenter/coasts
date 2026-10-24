import { useMemo, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getMetricInfo, formatFigure, formatRegionName } from '../../utils/formatters';
import { getTimeSeriesForGaul, getTimeSeriesKey, getTimeSeriesForGaul1, getTimeSeriesKeyGaul1 } from '../../services/dataService';

const DistributionHistogram = memo(({
  isDarkTheme,
  boundaries,
  selectedMetric,
  selectedRegion,
  timeSeriesData,
  gaulLevel = 'gaul2'
}) => {
  const isGaul1 = gaulLevel === 'gaul1';
  // Calculate density plot data for time series (GAUL level–aware)
  const densityData = useMemo(() => {
    if (!boundaries || !boundaries.features || !timeSeriesData || !selectedRegion) return null;

    const { country: selectedCountry, gaul1_name: selectedGaul1, gaul2_name: selectedGaul2 } = selectedRegion.properties;
    const selectedKey = isGaul1
      ? getTimeSeriesKeyGaul1(selectedCountry, selectedGaul1)
      : getTimeSeriesKey(selectedCountry, selectedGaul1, selectedGaul2);
    const selectedTimeSeries = isGaul1
      ? getTimeSeriesForGaul1(timeSeriesData, selectedCountry, selectedGaul1)
      : getTimeSeriesForGaul(timeSeriesData, selectedCountry, selectedGaul1, selectedGaul2);
    if (!selectedTimeSeries || !selectedTimeSeries.data) return null;

    const selectedValues = selectedTimeSeries.data
      .map(entry => entry[selectedMetric])
      .filter(v => v != null && !isNaN(v));
    if (selectedValues.length === 0) return null;

    const otherRegionsData = [];
    boundaries.features.forEach(feature => {
      const { country, gaul1_name, gaul2_name } = feature.properties;
      const featureKey = isGaul1
        ? getTimeSeriesKeyGaul1(country, gaul1_name)
        : getTimeSeriesKey(country, gaul1_name, gaul2_name);
      if (featureKey === selectedKey) return;

      const regionTimeSeries = isGaul1
        ? getTimeSeriesForGaul1(timeSeriesData, country, gaul1_name)
        : getTimeSeriesForGaul(timeSeriesData, country, gaul1_name, gaul2_name);
      if (regionTimeSeries?.data) {
        regionTimeSeries.data.forEach(entry => {
          if (entry[selectedMetric] != null && !isNaN(entry[selectedMetric])) {
            otherRegionsData.push(entry[selectedMetric]);
          }
        });
      }
    });

    // Build range from selected + other (allow other to be empty)
    const allValues = otherRegionsData.length > 0 ? [...selectedValues, ...otherRegionsData] : selectedValues;
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;
    const bandwidth = range * 0.15;

    const numPoints = 50;
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = min + (i / numPoints) * range;
      let selectedDensity = 0;
      selectedValues.forEach(value => {
        const u = (x - value) / bandwidth;
        selectedDensity += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
      });
      selectedDensity = selectedDensity / (selectedValues.length * bandwidth);

      let otherDensity = 0;
      if (otherRegionsData.length > 0) {
        otherRegionsData.forEach(value => {
          const u = (x - value) / bandwidth;
          otherDensity += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
        });
        otherDensity = otherDensity / (otherRegionsData.length * bandwidth);
      }

      points.push({
        value: x,
        selectedDensity: selectedDensity * 100,
        otherDensity: otherDensity * 100,
        label: x.toFixed(1)
      });
    }

    const maxSelectedDensity = Math.max(...points.map(p => p.selectedDensity));
    const maxOtherDensity = Math.max(...points.map(p => p.otherDensity));
    const maxDensity = Math.max(maxSelectedDensity, maxOtherDensity, 1);
    points.forEach(p => {
      p.selectedDensity = (p.selectedDensity / maxDensity) * 100;
      p.otherDensity = (p.otherDensity / maxDensity) * 100;
    });

    return {
      points,
      selectedStats: {
        mean: selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length,
        min: Math.min(...selectedValues),
        max: Math.max(...selectedValues),
        count: selectedValues.length
      },
      otherStats: otherRegionsData.length > 0
        ? {
          mean: otherRegionsData.reduce((a, b) => a + b, 0) / otherRegionsData.length,
          min: Math.min(...otherRegionsData),
          max: Math.max(...otherRegionsData),
          count: otherRegionsData.length
        }
        : { mean: 0, min: 0, max: 0, count: 0 },
      min,
      max
    };
  }, [boundaries, selectedMetric, selectedRegion, timeSeriesData, isGaul1]);

  if (!densityData) return null;

  const metricInfo = getMetricInfo(selectedMetric);
  const name = formatRegionName(selectedRegion?.properties);
  const others = isGaul1 ? 'other provinces' : 'other districts';
  const teal = isDarkTheme ? '#8ccbd0' : '#006d77';
  const ink = isDarkTheme ? '#a4b1b3' : '#4b6170';
  const grid = isDarkTheme ? '#2e3a3c' : '#d5dfe1';
  const figure = (value) => {
    const parts = formatFigure(selectedMetric, value);
    return parts ? `${parts.number} ${parts.unit}` : 'no value';
  };

  return (
    <figure className="m-0 mt-5">
      <figcaption className="font-serif text-[15px] italic text-muted-foreground">
        Monthly {(metricInfo.plainLabel ?? metricInfo.label).toLowerCase()} in {name}, against all {others}
      </figcaption>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={densityData.points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="value"
            type="number"
            domain={[densityData.min, densityData.max]}
            tickFormatter={(value) => value.toFixed(value >= 100 ? 0 : 1)}
            tick={{ fill: ink, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: grid }}
          />
          <YAxis hide domain={[0, 105]} />
          <Line type="monotone" dataKey="otherDensity" stroke={ink} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="selectedDensity" stroke={teal} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-1 grid grid-cols-2 gap-4 border-t border-border pt-2 text-[13px]">
        <div>
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="inline-block h-0.5 w-4" style={{ background: teal }} aria-hidden="true" />
            {name}
          </div>
          <div className="text-muted-foreground">
            Mean {figure(densityData.selectedStats.mean)}, {densityData.selectedStats.count} months
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="inline-block h-0 w-4 border-t-[1.5px] border-dashed" style={{ borderColor: ink }} aria-hidden="true" />
            All {others}
          </div>
          <div className="text-muted-foreground">
            Mean {figure(densityData.otherStats.mean)}, {densityData.otherStats.count.toLocaleString('en-US')} months
          </div>
        </div>
      </div>
      <p className="m-0 mt-1.5 text-xs text-muted-foreground">
        How often each value occurs, as a smoothed curve. Units: {metricInfo.unit}.
      </p>
    </figure>
  );
});

DistributionHistogram.displayName = 'DistributionHistogram';

export default DistributionHistogram; 