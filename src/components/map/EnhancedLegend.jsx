import { memo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ACTIVITY_METRICS } from '../../utils/gridLayerConfig';
import { getMetricInfo, isCensusMetric } from '../../utils/formatters';
import { ACTIVITY_METRIC_METADATA, isRatioActivityField } from '../../utils/metricMetadata';
import {
  getBathymetryColors,
  getChoroplethColors,
  getEffortColors,
  getGroundsColors
} from '../../utils/mapPalette';

const HATCH = 'repeating-linear-gradient(135deg, var(--card) 0 3px, var(--muted-foreground) 3px 4px)';

const formatGradeValue = (value) => {
  if (!Number.isFinite(value) || value === 0) return '0';
  const absValue = Math.abs(value);
  if (absValue >= 100) return Math.round(value).toLocaleString('en-US');
  if (absValue >= 10) return value.toFixed(1);
  if (absValue >= 1) return value.toFixed(1);
  return value.toFixed(2);
};

const Ramp = ({ colors, start, end, label }) => (
  <div>
    <div className="flex h-2.5 border border-rule/40" role="img" aria-label={label}>
      {colors.map((color) => (
        <span key={color} className="flex-1" style={{ background: color }} />
      ))}
    </div>
    <div className="mt-0.5 flex justify-between text-xs text-muted-foreground">
      <span>{start}</span>
      <span>{end}</span>
    </div>
  </div>
);

const EnhancedLegend = memo(({
  isDarkTheme,
  isSatellite = false,
  grades,
  selectedMetric,
  selectedActivityMetric,
  hasGridData,
  pdsH3EffortData,
  pdsFishingGroundsData,
  activeActivityLayers,
  showBathymetry = false,
  dataFreshnessLabel = 'Latest available export',
  surveyPeriodLabel = 'all years',
  yearScope = { isAllYears: true, label: 'all years' },
  gpsVisible = true,
  defaultMinimized = false
}) => {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);

  const metricInfo = getMetricInfo(selectedMetric);
  const census = isCensusMetric(selectedMetric);
  const activeMetricConfig = ACTIVITY_METRICS.find((m) => m.id === selectedActivityMetric) || ACTIVITY_METRICS[0];
  const activeMetricDocs = ACTIVITY_METRIC_METADATA[activeMetricConfig.id] ?? {};
  const choropleth = getChoroplethColors(isDarkTheme).slice(0, grades.length);

  const formatActivityValue = (value) => {
    if (!Number.isFinite(value)) return 'no value';
    return activeMetricConfig.format ? activeMetricConfig.format(value) : value.toFixed(2);
  };
  const extent = (values) => {
    const numbers = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
    return numbers.length ? [Math.min(...numbers), Math.max(...numbers)] : [NaN, NaN];
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="plate flex items-center gap-2 px-3 py-1.5 text-sm font-semibold"
        aria-label="Show legend"
      >
        Legend <ChevronUp size={14} aria-hidden="true" />
      </button>
    );
  }

  const showEffort = gpsVisible && hasGridData && activeActivityLayers?.hexagons !== false && pdsH3EffortData?.length > 0;
  const showGrounds = gpsVisible && hasGridData && activeActivityLayers?.grounds !== false && pdsFishingGroundsData?.features?.length > 0;
  const [effortMin, effortMax] = showEffort ? extent(pdsH3EffortData.map((d) => d[selectedActivityMetric])) : [];
  const [groundsMin, groundsMax] = showGrounds
    ? extent(pdsFishingGroundsData.features.map((f) => f.properties[selectedActivityMetric]))
    : [];

  return (
    <section className="plate w-[300px] max-h-[calc(100vh-9rem)] overflow-y-auto px-3.5 pb-3 pt-2.5 text-sm" aria-label="Legend">
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold leading-snug">
          {metricInfo.plainLabel ?? metricInfo.label}
          {metricInfo.plainUnit && !census ? <span className="font-normal text-muted-foreground">, {metricInfo.plainUnit}</span> : null}
        </h2>
        <button
            onClick={() => setIsMinimized(true)}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Hide legend"
          >
            <ChevronDown size={16} aria-hidden="true" />
          </button>
      </div>
      <p className="m-0 mt-0.5 text-[13px] text-muted-foreground">
        {census ? 'Frame survey (census). Not filtered by year.' : `Landing surveys, average for ${surveyPeriodLabel}.`}
      </p>

      <div className="mt-2.5 flex items-end gap-3">
        <div className="flex-1">
          <div className="flex h-3 border border-rule/40" role="img" aria-label={`${choropleth.length} classes from ${formatGradeValue(grades[0])} upward`}>
            {choropleth.map((color) => (
              <span key={color} className="flex-1" style={{ background: color }} />
            ))}
          </div>
          <div className="mt-0.5 flex text-xs tracking-tight text-muted-foreground">
            {grades.map((grade, i) => (
              <span key={i} className="flex-1 whitespace-nowrap">
                {formatGradeValue(grade)}{i === grades.length - 1 ? '+' : ''}
              </span>
            ))}
          </div>
        </div>
        <div className="w-14 text-center">
          <div className="h-3 border border-rule/40" style={{ background: HATCH }} />
          <div className="mt-0.5 text-xs text-muted-foreground">No data</div>
        </div>
      </div>

      {(showEffort || showGrounds) && (
        <div className="mt-3 space-y-2 border-t border-border pt-2.5">
          <div>
            <h3 className="m-0 text-sm font-semibold">Where tracked boats fish</h3>
            <p className="m-0 text-[13px] text-muted-foreground">{activeMetricConfig.label}, {activeMetricDocs.unit || 'GPS trackers'}</p>
          </div>
          {showEffort && (
            <div>
              <div className="mb-0.5 text-[13px]">Effort grid <span className="text-muted-foreground">· {yearScope.label}</span></div>
              <Ramp colors={getEffortColors(isDarkTheme || isSatellite)} start={formatActivityValue(effortMin)} end={formatActivityValue(effortMax)} label="Effort grid colour scale" />
            </div>
          )}
          {showGrounds && (
            <div>
              <div className="mb-0.5 text-[13px]">Fishing grounds <span className="text-muted-foreground">· all years</span></div>
              <Ramp colors={getGroundsColors(isDarkTheme || isSatellite)} start={formatActivityValue(groundsMin)} end={formatActivityValue(groundsMax)} label="Fishing grounds colour scale" />
              {isRatioActivityField(activeMetricConfig.id) && (
                <p className="m-0 text-xs text-muted-foreground">Averaged across each ground’s cells, not a ground total.</p>
              )}
            </div>
          )}
        </div>
      )}

      {hasGridData && !gpsVisible && (
        <p className="m-0 mt-3 border-t border-border pt-2.5 text-[13px] text-muted-foreground">
          Zoom in on the coast to see where tracked boats fish.
        </p>
      )}

      {showBathymetry && (
        <div className="mt-3 border-t border-border pt-2.5">
          <div className="mb-1 text-[13px]">Depth contours</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>5 m</span>
            <svg width="120" height="10" aria-hidden="true" className="flex-1">
              {getBathymetryColors(isDarkTheme).map((color, i) => (
                <line key={color} x1={i * 20} x2={i * 20 + 16} y1="5" y2="5" stroke={color} strokeWidth="2" />
              ))}
            </svg>
            <span>2,000 m</span>
          </div>
        </div>
      )}

      <p className="m-0 mt-3 flex justify-between text-xs text-muted-foreground">
        <span>Data to {dataFreshnessLabel}</span>
        <a href="/docs#layer-interpretation" className="font-semibold text-primary">How to read the map</a>
      </p>
    </section>
  );
});

EnhancedLegend.displayName = 'EnhancedLegend';

export default EnhancedLegend;
