import { useState, useEffect, useLayoutEffect, useMemo, useRef, Fragment } from 'react';
import { ChevronDown } from 'lucide-react';
import Header from './Header';
import { loadFrameGearsData, loadMapDataGaul2, loadTimeSeriesGaul1, loadTimeSeriesGaul2, getFrameGearInsights } from '../services/dataService';
import CountryTimeSeriesChart from './CountryTimeSeriesChart';
import { getMetricInfo, formatCountryName, formatFigure } from '../utils/formatters';
import { outlineFor } from '../utils/geoOutline';
import { cn } from '../lib/utils';

const COUNTRY_VIEW_METRIC_IDS = ['mean_cpue', 'mean_rpue', 'mean_price_kg'];
const COUNTRY_ORDER = ['kenya', 'zanzibar', 'mozambique', 'timor'];
// The time series keys Zanzibar as "zanzibar"; the map boundaries key it as "tanzania".
const mapCountryKey = (country) => (country === 'zanzibar' ? 'tanzania' : country);
const RECENT_YEARS = 3;
const LEVELS = [
    { id: 'gaul2', label: 'Districts', single: 'District', one: 'district', many: 'districts' },
    { id: 'gaul1', label: 'Provinces', single: 'Province', one: 'province', many: 'provinces' }
];
// A district needs this many months in the period to be ranked; fewer are listed after, unranked.
const MIN_MONTHS = 6;

const toTitleCase = (value = '') =>
    value.toLowerCase().split(' ').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

const monthLabel = (date) =>
    new Date(date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

const figureText = (metricId, value) => {
    const parts = formatFigure(metricId, value);
    return parts ? `${parts.number} ${parts.unit}` : '–';
};

// Rows glide to their new place when the ranking changes (FLIP on each row's offsetTop).
const useRankMotion = (orderKey) => {
    const rows = useRef(new Map());
    const tops = useRef(new Map());
    const lastOrder = useRef(orderKey);
    useLayoutEffect(() => {
        const reorder = lastOrder.current !== orderKey;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        rows.current.forEach((el, key) => {
            const top = el.offsetTop;
            const before = tops.current.get(key);
            if (reorder && !still && before !== undefined && before !== top) {
                el.animate(
                    [{ transform: `translateY(${before - top}px)` }, { transform: 'translateY(0)' }],
                    { duration: 480, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
                );
            }
            tops.current.set(key, top);
        });
        lastOrder.current = orderKey;
    });
    return (key) => (el) => {
        if (el) rows.current.set(key, el);
        else rows.current.delete(key);
    };
};

const SORTS = {
    avg: { label: 'Average', value: (row) => row.avg, defaultDir: 'desc' },
    latest: { label: 'Latest month', value: (row) => row.latest?.value ?? null, defaultDir: 'desc' },
    months: { label: 'Months', value: (row) => row.months, defaultDir: 'desc' },
    fishers: { label: 'Fishers', value: (row) => row.fishers, defaultDir: 'desc' },
    boats: { label: 'Boats', value: (row) => row.boats, defaultDir: 'desc' },
    name: { label: 'District', value: (row) => row.name, defaultDir: 'asc' }
};

// The last 12 months on the row's own range: the shape, not the level (the level is in Average).
const SPARK_MIN_POINTS = 6;
const Sparkline = ({ values }) => {
    const present = values.filter((value) => value != null);
    if (present.length < SPARK_MIN_POINTS) {
        return <span className="text-[13px] text-muted-foreground">{present.length} of 12 months</span>;
    }
    const width = 110;
    const height = 24;
    const low = Math.min(...present);
    const span = Math.max(...present) - low || 1;
    const step = width / Math.max(values.length - 1, 1);
    const y = (value) => (height - 3 - ((value - low) / span) * (height - 6)).toFixed(1);
    const segments = [];
    let current = [];
    values.forEach((value, i) => {
        if (value == null) {
            if (current.length) segments.push(current);
            current = [];
            return;
        }
        current.push([(i * step).toFixed(1), y(value)]);
    });
    if (current.length) segments.push(current);
    return (
        <svg width={width} height={height} aria-hidden="true" className="block">
            {segments.map((points, i) =>
                points.length > 1
                    ? <polyline key={i} points={points.map((point) => point.join(',')).join(' ')} fill="none" stroke="var(--primary)" strokeWidth="1.5" />
                    : <line key={i} x1={points[0][0]} x2={points[0][0]} y1={Number(points[0][1]) - 3} y2={Number(points[0][1]) + 3} stroke="var(--primary)" strokeWidth="2" />
            )}
        </svg>
    );
};

const SortHeader = ({ id, sort, onSort, className, children }) => {
    const active = sort.key === id;
    return (
        <th
            scope="col"
            aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
            className={cn('px-2 py-2 font-semibold', className)}
        >
            <button
                type="button"
                onClick={() => onSort(id)}
                className={cn('group inline-flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:text-foreground', active && 'text-foreground')}
            >
                {children}
                <ChevronDown
                    size={13}
                    aria-hidden="true"
                    className={cn('transition-transform', active ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 group-focus-visible:opacity-100', active && sort.dir === 'asc' && 'rotate-180')}
                />
            </button>
        </th>
    );
};

const CountryView = () => {
    const [timeSeriesData, setTimeSeriesData] = useState(null);
    const [timeSeriesGaul1, setTimeSeriesGaul1] = useState(null);
    const [level, setLevel] = useState('gaul2');
    const [boundaries, setBoundaries] = useState(null);
    const [frameGearRows, setFrameGearRows] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedMetric, setSelectedMetric] = useState('mean_cpue');
    const [range, setRange] = useState('recent');
    const [sort, setSort] = useState({ key: 'avg', dir: 'desc' });
    const [openKey, setOpenKey] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            const [timeSeries, timeSeries1, frameRows, mapData] = await Promise.all([
                loadTimeSeriesGaul2(),
                loadTimeSeriesGaul1(),
                loadFrameGearsData(),
                loadMapDataGaul2()
            ]);
            setTimeSeriesData(timeSeries);
            setTimeSeriesGaul1(timeSeries1);
            setFrameGearRows(frameRows ?? []);
            setBoundaries(mapData);
            setIsLoading(false);
        };
        initData();
    }, []);

    const availableCountries = useMemo(() => {
        if (!timeSeriesData) return [];
        const present = new Set(Object.values(timeSeriesData).map((region) => region.country).filter(Boolean));
        return COUNTRY_ORDER.filter((country) => present.has(country));
    }, [timeSeriesData]);

    useEffect(() => {
        if (!selectedCountry && availableCountries.length > 0) setSelectedCountry(availableCountries[0]);
    }, [selectedCountry, availableCountries]);

    useEffect(() => {
        setOpenKey(null);
    }, [selectedCountry, level]);

    const noun = LEVELS.find((item) => item.id === level);

    const silhouettes = useMemo(() => {
        if (!boundaries?.features) return {};
        return Object.fromEntries(availableCountries.map((country) => {
            const features = boundaries.features.filter((feature) => feature.properties.country === mapCountryKey(country));
            if (!features.length) return [country, []];
            const { collection, path } = outlineFor(features, 40, 26, 1);
            return [country, collection.features.map((feature) => path(feature))];
        }));
    }, [boundaries, availableCountries]);

    const regions = useMemo(() => {
        const series = level === 'gaul1' ? timeSeriesGaul1 : timeSeriesData;
        if (!selectedCountry || !series) return [];
        return Object.entries(series)
            .filter(([, region]) => region.country === selectedCountry)
            .map(([key, region]) => ({ key, ...region }));
    }, [selectedCountry, timeSeriesData, timeSeriesGaul1, level]);

    // Every month with a value for this figure, and where "recent" starts.
    const { allMonths, firstYear, recentStart } = useMemo(() => {
        const months = new Set();
        regions.forEach((region) => region.data.forEach((entry) => {
            if (typeof entry[selectedMetric] === 'number') months.add(entry.date.slice(0, 7));
        }));
        const sorted = Array.from(months).sort();
        const lastYear = sorted.length ? Number(sorted[sorted.length - 1].slice(0, 4)) : null;
        return {
            allMonths: sorted,
            firstYear: sorted.length ? Number(sorted[0].slice(0, 4)) : null,
            recentStart: lastYear ? `${lastYear - RECENT_YEARS + 1}-01` : null
        };
    }, [regions, selectedMetric]);

    const recentYear = recentStart ? Number(recentStart.slice(0, 4)) : null;
    const hasOlderRecord = firstYear !== null && recentYear !== null && firstYear < recentYear;
    // Strip and ranking always use the recent window, so districts are compared over one span;
    // the period switch only widens the trend charts.
    const periodStart = hasOlderRecord ? recentStart : allMonths[0];
    const chartStart = range === 'full' ? allMonths[0] : periodStart;
    const months = useMemo(() => allMonths.filter((month) => month >= periodStart), [allMonths, periodStart]);
    const chartMonths = useMemo(() => allMonths.filter((month) => month >= chartStart), [allMonths, chartStart]);
    const periodLabel = periodStart ? `${monthLabel(`${periodStart}-01`)} to ${monthLabel(`${months[months.length - 1] ?? periodStart}-01`)}` : '';

    const rows = useMemo(() => {
        const last12 = months.slice(-12);
        return regions.map((region) => {
            const allByMonth = new Map();
            region.data.forEach((entry) => {
                if (typeof entry[selectedMetric] === 'number') allByMonth.set(entry.date.slice(0, 7), entry[selectedMetric]);
            });
            const byMonth = new Map(Array.from(allByMonth).filter(([month]) => month >= periodStart));
            const values = Array.from(byMonth.values());
            const latestMonth = Array.from(byMonth.keys()).sort().pop();
            const frame = getFrameGearInsights(frameGearRows, selectedCountry, region.gaul1_name, level === 'gaul2' ? region.gaul2_name : null);
            return {
                key: region.key,
                name: toTitleCase(level === 'gaul2' ? region.gaul2_name : region.gaul1_name),
                province: level === 'gaul2' ? toTitleCase(region.gaul1_name) : '',
                gaul1: region.gaul1_name,
                gaul2: region.gaul2_name,
                byMonth,
                allByMonth,
                avg: mean(values),
                months: values.length,
                latest: latestMonth ? { month: latestMonth, value: byMonth.get(latestMonth) } : null,
                last12: last12.map((month) => byMonth.get(month) ?? null),
                fishers: frame.totals.fishers_total || null,
                fishersFemale: frame.totals.fishers_female || 0,
                boats: frame.totals.boats_total || null,
                gears: frame.hasGearBreakdown ? frame.gearBreakdown : []
            };
        });
    }, [regions, months, periodStart, selectedMetric, frameGearRows, selectedCountry, level]);

    const withData = rows.filter((row) => row.avg !== null);
    const withoutData = rows.filter((row) => row.avg === null);
    const ranked = withData.filter((row) => row.months >= MIN_MONTHS);
    const thin = withData.filter((row) => row.months < MIN_MONTHS);
    const rankOf = useMemo(
        () => new Map([...ranked].sort((a, b) => b.avg - a.avg).map((row, i) => [row.key, i + 1])),
        [ranked]
    );
    const sortRows = (list) => {
        const { value, defaultDir } = SORTS[sort.key];
        const factor = (sort.dir ?? defaultDir) === 'asc' ? 1 : -1;
        return [...list].sort((a, b) => {
            const va = value(a);
            const vb = value(b);
            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;
            return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * factor;
        });
    };
    const sortedRanked = sortRows(ranked);
    const sortedThin = sortRows(thin);
    const sortedRows = [...sortedRanked, ...sortedThin];
    // Bars share the ranked districts' scale; an unranked row past it runs to the end with a break mark.
    const barMax = Math.max(...ranked.map((row) => row.avg), 0) || Math.max(...withData.map((row) => row.avg), 0) || 1;
    const rowRef = useRankMotion(`${sortedRows.map((row) => row.key).join('|')}`);

    const countryPoints = useMemo(() => chartMonths.map((month) => {
        const values = rows.map((row) => row.allByMonth.get(month)).filter((v) => v != null);
        return { date: `${month}-01`, country: mean(values) };
    }), [chartMonths, rows]);

    const countryFrame = useMemo(
        () => (selectedCountry ? getFrameGearInsights(frameGearRows, selectedCountry) : null),
        [frameGearRows, selectedCountry]
    );

    const metricInfo = getMetricInfo(selectedMetric);
    const metricName = metricInfo.plainLabel ?? metricInfo.description;
    const unit = formatFigure(selectedMetric, 1);
    const unitText = unit ? `${unit.unit} ${unit.per}`.trim() : metricInfo.unit;
    const countryName = formatCountryName(selectedCountry);
    const countryAverage = mean(withData.map((row) => row.avg));
    const fishersTotal = countryFrame?.totals?.fishers_total || null;
    const boatsTotal = countryFrame?.totals?.boats_total || null;

    const onSort = (key) => setSort((prev) => (
        prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: SORTS[key].defaultDir }
    ));

    return (
        <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
            <Header boundaries={null} timeSeriesData={timeSeriesData} pdsH3EffortData={null} />

            <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
                {!selectedCountry ? (
                    <p className="m-0 py-16 text-center font-serif text-lg italic text-muted-foreground">
                        {isLoading ? 'Loading the country figures…' : 'No country data is available.'}
                    </p>
                ) : (
                    <>
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="m-0 text-4xl font-semibold leading-tight">{countryName}</h1>
                                <p className="m-0 mt-1 font-serif text-lg italic text-muted-foreground">
                                    {withData.length} {noun.many} with landing surveys{firstYear ? `, records since ${firstYear}` : ''}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex overflow-hidden rounded border border-input text-sm font-semibold" role="group" aria-label="Areas">
                                    {LEVELS.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            aria-pressed={level === item.id}
                                            onClick={() => setLevel(item.id)}
                                            className={cn('px-3 py-1 transition-colors', level === item.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2" role="group" aria-label="Figure">
                                    {COUNTRY_VIEW_METRIC_IDS.map((id) => {
                                        const info = getMetricInfo(id);
                                        return (
                                            <button key={id} type="button" className="pill" aria-pressed={selectedMetric === id} onClick={() => setSelectedMetric(id)}>
                                                {info.pillLabel ?? info.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div role="tablist" aria-label="Country" className="mt-4 flex flex-wrap gap-1 border-b-2 border-rule">
                            {availableCountries.map((country) => {
                                const active = country === selectedCountry;
                                return (
                                    <button
                                        key={country}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => setSelectedCountry(country)}
                                        className={cn(
                                            '-mb-[2px] flex items-center gap-2 border-b-[3px] px-3 py-2 text-[15px] font-semibold transition-colors',
                                            active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                                        )}
                                    >
                                        <svg width="40" height="26" aria-hidden="true">
                                            {(silhouettes[country] ?? []).map((d, i) => (
                                                <path key={i} d={d} fill="var(--primary)" stroke="var(--primary)" strokeWidth="0.9" strokeLinejoin="round" />
                                            ))}
                                        </svg>
                                        {formatCountryName(country)}
                                    </button>
                                );
                            })}
                        </div>

                        <section aria-label={`${countryName} figures`} className="mt-4 grid items-start gap-x-10 gap-y-5 xl:grid-cols-[auto_minmax(420px,1fr)]">
                            <dl className="m-0 grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
                                <div className="col-span-2 sm:col-span-1">
                                    <dt className="text-[13px] text-muted-foreground">Average {(metricInfo.pillLabel ?? metricName).toLowerCase()}</dt>
                                    <dd className="m-0 whitespace-nowrap text-[28px] font-bold leading-tight text-primary">
                                        {formatFigure(selectedMetric, countryAverage)?.number ?? '–'}
                                        <span className="ml-1 text-base font-semibold">{unitText}</span>
                                    </dd>
                                </div>
                                {(fishersTotal ? [
                                    ['Fishers', fishersTotal.toLocaleString('en-US')],
                                    ['Boats', boatsTotal ? boatsTotal.toLocaleString('en-US') : '–']
                                ] : []).map(([label, value]) => (
                                    <div key={label}>
                                        <dt className="text-[13px] text-muted-foreground">{label}</dt>
                                        <dd className="m-0 text-[28px] font-bold leading-tight text-primary">{value}</dd>
                                    </div>
                                ))}
                                <p className="col-span-2 m-0 max-w-[60ch] text-xs text-muted-foreground sm:col-span-3">
                                    Average: mean of the {noun.one} averages, {periodLabel}. Fishers and boats from the frame survey (census){fishersTotal ? '' : ', none on file for this country'}.{' '}
                                    <a href="/docs#metric-definitions" className="font-semibold text-primary">How these are measured</a>
                                </p>
                            </dl>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="m-0 font-serif italic text-muted-foreground">Monthly {metricName.toLowerCase()}, {countryName}</p>
                                    {hasOlderRecord && (
                                        <div className="inline-flex overflow-hidden rounded border border-input text-sm font-semibold" role="group" aria-label="Chart period">
                                            {[['recent', `Since ${recentYear}`], ['full', `Full record, from ${firstYear}`]].map(([id, label]) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    aria-pressed={range === id}
                                                    onClick={() => setRange(id)}
                                                    className={cn('px-3 py-1 transition-colors', range === id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <CountryTimeSeriesChart
                                    points={countryPoints}
                                    unit={unitText}
                                    countryLabel={`${countryName}, average of ${noun.many}`}
                                    height={150}
                                    showLegend={false}
                                />
                            </div>
                        </section>

                        <section aria-labelledby="districts-title" className="mt-8">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-rule pb-2">
                                <h2 id="districts-title" className="m-0 text-2xl font-semibold">{noun.label} ranked by {metricName.toLowerCase()}</h2>
                                <p className="m-0 text-[13px] text-muted-foreground">
                                    Average for {periodLabel}, {unitText}. {noun.label} need {MIN_MONTHS} months of data to be ranked. <span className="sm:hidden">Tap</span><span className="hidden sm:inline">Click</span> a {noun.one} to see its trend and gears.
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[15px]">
                                    <thead>
                                        <tr className="border-b border-rule text-left text-[13px] text-muted-foreground">
                                            <th scope="col" className="w-10 px-2 py-2 font-semibold">#</th>
                                            <SortHeader id="name" sort={sort} onSort={onSort}>{noun.single}</SortHeader>
                                            <SortHeader id="avg" sort={sort} onSort={onSort} className="min-w-[200px]">
                                                Average <span className="hidden font-normal sm:inline">· line marks the country average</span>
                                            </SortHeader>
                                            <SortHeader id="latest" sort={sort} onSort={onSort} className="hidden text-right md:table-cell">Latest month</SortHeader>
                                            <th scope="col" className="hidden px-2 py-2 font-semibold lg:table-cell">Last 12 months</th>
                                            <SortHeader id="months" sort={sort} onSort={onSort} className="hidden text-right lg:table-cell">Months</SortHeader>
                                            <SortHeader id="fishers" sort={sort} onSort={onSort} className="hidden text-right md:table-cell">Fishers</SortHeader>
                                            <SortHeader id="boats" sort={sort} onSort={onSort} className="hidden text-right md:table-cell">Boats</SortHeader>
                                            <th scope="col" className="w-10 px-2 py-2"><span className="sr-only">Details</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedRows.map((row) => {
                                            const open = openKey === row.key;
                                            const toggle = () => setOpenKey(open ? null : row.key);
                                            const districtPoints = countryPoints.map((point) => ({
                                                ...point,
                                                district: row.allByMonth.get(point.date.slice(0, 7)) ?? null
                                            }));
                                            const isThin = row.months < MIN_MONTHS;
                                            return (
                                                <Fragment key={row.key}>
                                                    {isThin && row.key === sortedThin[0]?.key && (
                                                        <tr className="border-b border-rule">
                                                            <td colSpan={9} className="px-2 pb-1.5 pt-4 text-[13px] font-semibold text-muted-foreground">
                                                                Fewer than {MIN_MONTHS} months of data in this period, so not ranked
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr
                                                        ref={rowRef(row.key)}
                                                        onClick={toggle}
                                                        className={cn('cursor-pointer border-b border-border transition-colors hover:bg-secondary', open && 'bg-card')}
                                                    >
                                                        <td className="px-2 py-2 text-muted-foreground">{rankOf.get(row.key) ?? '–'}</td>
                                                        <td className="px-2 py-2">
                                                            <button
                                                                type="button"
                                                                aria-expanded={open}
                                                                aria-controls={`detail-${row.key}`}
                                                                onClick={(event) => { event.stopPropagation(); toggle(); }}
                                                                className="rounded text-left"
                                                            >
                                                                <span className="font-semibold">{row.name}</span>{' '}
                                                                {row.province && row.province !== row.name && <span className="font-serif italic text-muted-foreground">{row.province}</span>}
                                                            </button>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative h-2.5 flex-1 bg-secondary" aria-hidden="true">
                                                                    <div className={cn('absolute inset-y-0 left-0', isThin ? 'bg-muted-foreground/50' : 'bg-primary')} style={{ width: `${Math.min(row.avg / barMax, 1) * 100}%` }} />
                                                                    {row.avg > barMax && (
                                                                        <span className="absolute -inset-y-0.5 right-3 w-1.5 -skew-x-[24deg] bg-background" title="Beyond the scale of the ranked districts" />
                                                                    )}
                                                                    {countryAverage != null && (
                                                                        <div className="absolute -inset-y-1 w-0.5 bg-foreground" style={{ left: `${(countryAverage / barMax) * 100}%` }} />
                                                                    )}
                                                                </div>
                                                                <span className="w-16 text-right font-semibold">{formatFigure(selectedMetric, row.avg)?.number}</span>
                                                            </div>
                                                        </td>
                                                        <td className="hidden px-2 py-2 text-right md:table-cell">
                                                            {row.latest ? (
                                                                <>
                                                                    {formatFigure(selectedMetric, row.latest.value)?.number}{' '}
                                                                    <span className="text-[13px] text-muted-foreground">{monthLabel(`${row.latest.month}-01`)}</span>
                                                                </>
                                                            ) : '–'}
                                                        </td>
                                                        <td className="hidden px-2 py-2 lg:table-cell"><Sparkline values={row.last12} /></td>
                                                        <td className="hidden px-2 py-2 text-right lg:table-cell">{row.months}</td>
                                                        <td className="hidden px-2 py-2 text-right md:table-cell">{row.fishers ? row.fishers.toLocaleString('en-US') : <span className="text-muted-foreground">–</span>}</td>
                                                        <td className="hidden px-2 py-2 text-right md:table-cell">{row.boats ? row.boats.toLocaleString('en-US') : <span className="text-muted-foreground">–</span>}</td>
                                                        <td className="px-2 py-2 text-right">
                                                            <ChevronDown size={16} aria-hidden="true" className={cn('inline text-muted-foreground transition-transform', open && 'rotate-180 text-foreground')} />
                                                        </td>
                                                    </tr>
                                                    {open && (
                                                        <tr id={`detail-${row.key}`} className="border-b border-t-2 border-border border-t-rule bg-card">
                                                            <td />
                                                            <td colSpan={8} className="px-2 pb-5 pt-2">
                                                                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                                                                    <div className="min-w-0">
                                                                        <p className="m-0 font-serif italic text-muted-foreground">
                                                                            Monthly {metricName.toLowerCase()}, {row.name} against the {countryName} average
                                                                        </p>
                                                                        <CountryTimeSeriesChart
                                                                            points={districtPoints}
                                                                            unit={unitText}
                                                                            countryLabel={`${countryName} average`}
                                                                            districtLabel={row.name}
                                                                            height={180}
                                                                            dashedCountry
                                                                        />
                                                                    </div>
                                                                    <div className="text-sm">
                                                                        <p className="m-0 font-semibold">{row.months} months with data, average {figureText(selectedMetric, row.avg)}</p>
                                                                        {row.fishers ? (
                                                                            <p className="m-0 mt-2">
                                                                                <span className="font-semibold">{row.fishers.toLocaleString('en-US')} fishers</span>
                                                                                <span className="text-muted-foreground"> ({row.fishersFemale.toLocaleString('en-US')} women)</span>
                                                                                {row.boats ? <span className="font-semibold"> · {row.boats.toLocaleString('en-US')} boats</span> : null}
                                                                            </p>
                                                                        ) : (
                                                                            <p className="m-0 mt-2 text-muted-foreground">No frame survey (census) for this {noun.one}.</p>
                                                                        )}
                                                                        {row.gears.length > 0 && (
                                                                            <ul className="m-0 mt-3 list-none space-y-1.5 p-0">
                                                                                {row.gears.slice(0, 5).map((gear) => {
                                                                                    const share = row.fishers ? (gear.fishers_total / row.fishers) * 100 : 0;
                                                                                    return (
                                                                                        <li key={gear.gear_name}>
                                                                                            <div className="flex justify-between text-[13px]"><span>{gear.gear_name}</span><span className="text-muted-foreground">{share.toFixed(0)}%</span></div>
                                                                                            <div className="h-1.5 bg-secondary"><div className="h-full bg-primary" style={{ width: `${share}%` }} /></div>
                                                                                        </li>
                                                                                    );
                                                                                })}
                                                                            </ul>
                                                                        )}
                                                                        <p className="m-0 mt-2 text-xs text-muted-foreground">Fishers, boats and gears: frame survey (census), not filtered by date.</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                        {withoutData.map((row) => (
                                            <tr key={row.key} className="border-b border-border text-muted-foreground">
                                                <td className="px-2 py-2">–</td>
                                                <td className="px-2 py-2"><span className="font-semibold">{row.name}</span> {row.province && row.province !== row.name && <span className="font-serif italic">{row.province}</span>}</td>
                                                <td className="px-2 py-2" colSpan={7}>No surveys in this period</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="m-0 mt-2 text-[13px] text-muted-foreground">
                                Each {noun.one}’s average is the mean of its monthly values in the period. <a href="/docs#metric-definitions" className="font-semibold text-primary">How these figures are made</a>
                            </p>
                        </section>

                        <section aria-labelledby="gears-title" className="mt-10 border-t-2 border-rule pt-4">
                            <h2 id="gears-title" className="m-0 text-2xl font-semibold">Fishing gears in {countryName}</h2>
                            <p className="m-0 mb-3 text-[13px] text-muted-foreground">Share of fishers by main gear. Frame survey (census), not filtered by date.</p>
                            {countryFrame?.hasGearBreakdown && countryFrame.gearBreakdown.length > 0 ? (
                                <ul className="m-0 grid list-none gap-x-10 gap-y-2 p-0 md:grid-cols-2">
                                    {countryFrame.gearBreakdown.slice(0, 8).map((gear) => {
                                        const share = countryFrame.totals.fishers_total ? (gear.fishers_total / countryFrame.totals.fishers_total) * 100 : 0;
                                        return (
                                            <li key={gear.gear_name}>
                                                <div className="flex items-baseline justify-between gap-4 text-sm">
                                                    <span className="font-semibold">{gear.gear_name}</span>
                                                    <span className="text-muted-foreground">
                                                        {gear.fishers_total.toLocaleString('en-US')} fishers · {share.toFixed(1)}% · {gear.boats_total.toLocaleString('en-US')} boats
                                                    </span>
                                                </div>
                                                <div className="mt-1 h-1.5 bg-secondary"><div className="h-full bg-primary" style={{ width: `${share}%` }} /></div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="m-0 text-sm text-muted-foreground">
                                    {fishersTotal
                                        ? 'The census here counts fishers and boats but not their gears.'
                                        : 'No frame survey (census) of fishers, boats and gears here.'}
                                </p>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default CountryView;
