import { lazy, Suspense, useMemo } from 'react';
import { geoContains } from 'd3';
import { ArrowLeft, ArrowRight, MousePointerClick, X } from 'lucide-react';
import { outlineFor } from '../../utils/geoOutline';
import { formatCountryName, formatFigure, formatRegionName, getMetricInfo, isCensusMetric } from '../../utils/formatters';
import { getFrameGearInsights, getTimeSeriesForGaul, getTimeSeriesForGaul1 } from '../../services/dataService';

const DistributionHistogram = lazy(() => import('../map/DistributionHistogram'));

const OUTLINE_W = 372;
const OUTLINE_H = 210;
const DRAWING_W = 190;
const LABEL_X = 212;
const CALLOUTS = [
  { metric: 'mean_cpue', y: 34 },
  { metric: 'mean_price_kg', y: 104 },
  { metric: 'mean_rpue', y: 174 }
];

const monthLabel = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

// A point inside the outline on the row nearest to y, so each leader line starts on the drawing.
const anchorFor = (y, feature, projection, path) => {
  const [[x0, y0], [x1, y1]] = path.bounds(feature);
  const row = Math.min(Math.max(y, y0 + 4), y1 - 4);
  for (let x = x1 - 4; x > x0; x -= 3) {
    if (geoContains(feature, projection.invert([x, row]))) return [x, row];
  }
  return path.centroid(feature);
};

const Callout = ({ metric, value, y, anchor }) => {
  const figure = formatFigure(metric, value);
  const label = getMetricInfo(metric).plainLabel;
  const [ax, ay] = anchor;
  return (
    <g>
      <polyline
        points={`${ax},${ay} ${LABEL_X - 14},${y} ${LABEL_X - 4},${y}`}
        fill="none"
        stroke="var(--coral)"
        strokeWidth="1.25"
      />
      <circle cx={ax} cy={ay} r="3" fill="var(--coral)" />
      {figure ? (
        <text x={LABEL_X} y={y + 6} className="fill-primary text-[22px] font-bold">
          {figure.number}
          <tspan className="text-[14px] font-semibold"> {figure.unit}</tspan>
        </text>
      ) : (
        <text x={LABEL_X} y={y + 5} className="fill-muted-foreground text-[14px]">no survey data</text>
      )}
      <text x={LABEL_X} y={y + 24} className="fill-muted-foreground text-[13px]">
        {figure?.per ? figure.per : label.toLowerCase()}
      </text>
    </g>
  );
};

export const DistrictSheet = ({
  feature,
  gaulLevel,
  selectedMetric,
  boundaries,
  timeSeriesData,
  frameGearsRows,
  surveyPeriodLabel,
  isDarkTheme,
  onClose
}) => {
  const props = feature.properties;
  const isGaul1 = gaulLevel === 'gaul1';
  const name = isGaul1 ? props.gaul1_name : formatRegionName(props);
  const place = [isGaul1 ? null : props.gaul1_name, formatCountryName(props.country)].filter(Boolean).join(', ');

  const drawing = useMemo(() => {
    const { collection, projection, path } = outlineFor([feature], DRAWING_W, OUTLINE_H, 8);
    const shape = collection.features[0];
    return {
      d: path(shape),
      anchors: CALLOUTS.map(({ y }) => anchorFor(y, shape, projection, path))
    };
  }, [feature]);

  // Months with survey data, for the source line.
  const record = useMemo(() => {
    const series = isGaul1
      ? getTimeSeriesForGaul1(timeSeriesData, props.country, props.gaul1_name)
      : getTimeSeriesForGaul(timeSeriesData, props.country, props.gaul1_name, props.gaul2_name);
    const months = (series?.data ?? []).filter((entry) => entry.mean_cpue != null || entry.mean_price_kg != null);
    if (!months.length) return null;
    return { count: months.length, first: monthLabel(months[0].date), last: monthLabel(months[months.length - 1].date) };
  }, [isGaul1, timeSeriesData, props.country, props.gaul1_name, props.gaul2_name]);

  const gears = useMemo(() => {
    const country = props.country === 'tanzania' ? 'zanzibar' : props.country;
    const insights = getFrameGearInsights(frameGearsRows, country, props.gaul1_name, isGaul1 ? null : props.gaul2_name);
    return insights.gearBreakdown.slice(0, 3).map((gear) => gear.gear_name.toLowerCase());
  }, [frameGearsRows, props.country, props.gaul1_name, props.gaul2_name, isGaul1]);

  const hasCensus = props.fishers_total != null || props.boats_total != null;
  const comparisonMetric = isCensusMetric(selectedMetric) ? 'mean_cpue' : selectedMetric;
  const fishers = formatFigure('fishers_total', props.fishers_total);
  const women = formatFigure('fishers_female', props.fishers_female);
  const boats = formatFigure('boats_total', props.boats_total);

  return (
    <section aria-labelledby="district-sheet-name" className="mt-6">
      <div className="flex items-center justify-between bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
        <button onClick={onClose} className="flex items-center gap-1.5 rounded">
          <ArrowLeft size={15} aria-hidden="true" /> All countries
        </button>
        <button onClick={onClose} className="rounded p-0.5" aria-label="Close district sheet">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <h2 id="district-sheet-name" className="m-0 mt-3 text-[28px] font-semibold leading-tight">{name}</h2>
      <p className="m-0 font-serif text-base italic text-muted-foreground">{place}</p>

      <svg
        width={OUTLINE_W}
        height={OUTLINE_H}
        viewBox={`0 0 ${OUTLINE_W} ${OUTLINE_H}`}
        className="mt-3 block max-w-full"
        role="img"
        aria-label={`Outline of ${name} with its catch, price and revenue`}
      >
        <path d={drawing.d} fill="var(--secondary)" stroke="var(--foreground)" strokeWidth="1.25" strokeLinejoin="round" />
        {CALLOUTS.map((callout, i) => (
          <Callout key={callout.metric} metric={callout.metric} value={props[callout.metric]} y={callout.y} anchor={drawing.anchors[i]} />
        ))}
      </svg>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 border-t border-border pt-3 text-[15px]">
        <span className="text-muted-foreground">Catch, price, revenue</span>
        <span className="text-right font-semibold">Landing surveys</span>
        <p className="col-span-2 m-0 border-b border-border pb-2 text-[13px] text-muted-foreground">
          Average for {surveyPeriodLabel}.
          {record ? ` ${record.count} months with data, ${record.first} to ${record.last}.` : ' No months with survey data.'}{' '}
          <a href="/docs#metric-definitions" className="font-semibold text-primary">How these are measured</a>
        </p>

        {hasCensus ? (
          <>
            <span className="text-muted-foreground">Fishers</span>
            <span className="text-right font-semibold">
              {fishers?.number ?? '–'}
              {women ? <span className="font-normal text-muted-foreground"> ({women.number} women)</span> : null}
            </span>
            <span className="text-muted-foreground">Boats</span>
            <span className="text-right font-semibold">{boats?.number ?? '–'}</span>
            {gears.length > 0 && (
              <>
                <span className="text-muted-foreground">Main gears</span>
                <span className="text-right font-semibold first-letter:uppercase">{gears.join(', ')}</span>
              </>
            )}
            <p className="col-span-2 m-0 border-b border-border pb-2 text-[13px] text-muted-foreground">
              Frame survey (census). Not filtered by year.
            </p>
          </>
        ) : (
          <p className="col-span-2 m-0 border-b border-border pb-2 text-[13px] text-muted-foreground">
            No frame survey (census) of fishers and boats for this {isGaul1 ? 'province' : 'district'}.
          </p>
        )}
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading comparison…</p>}>
        <DistributionHistogram
          isDarkTheme={isDarkTheme}
          boundaries={boundaries}
          selectedMetric={comparisonMetric}
          selectedRegion={feature}
          timeSeriesData={timeSeriesData}
          gaulLevel={gaulLevel}
        />
      </Suspense>
    </section>
  );
};

const ROW_GRID = 'grid grid-cols-[44px_minmax(0,1fr)_2.75rem_2.75rem_3.75rem_28px] items-center gap-x-2.5';

export const CoverageSheet = ({ coverage, onShowCountry, onHoverCountry }) => {
  if (!coverage?.countries?.length) return null;
  const preview = (country) => () => onHoverCountry?.(country);
  return (
    <section aria-labelledby="coverage-title" className="mt-6 border-t-2 border-rule pt-4">
      <h2 id="coverage-title" className="m-0 text-[28px] font-semibold leading-tight">
        {coverage.districts} districts in {coverage.countries.length} countries
      </h2>
      <p className="m-0 mt-1 text-[15px] text-muted-foreground">
        Where Peskas landing surveys record catch, price and revenue.
      </p>
      <p className="m-0 mt-3 flex items-center gap-2 text-[15px] font-semibold text-primary">
        <MousePointerClick size={18} aria-hidden="true" />
        Choose a country to take the map there
      </p>

      <div className={`${ROW_GRID} mt-2 border-b border-rule px-2 pb-1.5 text-[13px] font-semibold text-muted-foreground`} aria-hidden="true">
        <span />
        <span>Country</span>
        <span className="text-right">Districts</span>
        <span className="text-right">Since</span>
        <span className="text-right">Fishers</span>
        <span />
      </div>
      <ul className="m-0 list-none p-0">
        {coverage.countries.map((row) => (
          <li key={row.country} className="border-b border-border">
            <button
              onClick={() => {
                onHoverCountry?.(null);
                onShowCountry(row.country);
              }}
              onMouseEnter={preview(row.country)}
              onMouseLeave={preview(null)}
              onFocus={preview(row.country)}
              onBlur={preview(null)}
              aria-label={`Show ${row.name} on the map: ${row.districts} districts, surveys since ${row.since}${row.fishers ? `, ${row.fishers.toLocaleString('en-US')} fishers` : ''}`}
              className={`${ROW_GRID} group w-full px-2 py-2 text-left text-[15px] transition-colors hover:bg-secondary focus-visible:bg-secondary`}
            >
              <svg width="44" height="32" viewBox="0 0 44 32" aria-hidden="true" className="opacity-80 transition-opacity group-hover:opacity-100">
                {row.silhouette.map((d, i) => (
                  <path key={i} d={d} fill="var(--primary)" stroke="var(--primary)" strokeWidth="0.9" strokeLinejoin="round" />
                ))}
              </svg>
              <span className="truncate font-semibold">{row.name}</span>
              <span className="text-right">{row.districts}</span>
              <span className="text-right">{row.since}</span>
              <span className="text-right">
                {row.fishers ? row.fishers.toLocaleString('en-US') : <span className="text-muted-foreground">–</span>}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-focus-visible:bg-primary group-focus-visible:text-primary-foreground">
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-2 text-[13px] text-muted-foreground">
        Districts with landing survey data, and the year surveys began. Fishers from frame surveys (censuses) in Kenya, Zanzibar and Mozambique.
      </p>
    </section>
  );
};
