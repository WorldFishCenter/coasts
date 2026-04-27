import { useState, useEffect, useMemo, useRef } from 'react';
import Header from './Header';
import { cn } from '../lib/utils';
import { loadFrameGearsData, loadTimeSeriesGaul2, getFrameGearInsights } from '../services/dataService';
import { ChevronDown, BarChart3, MapPin, Layers, Users, Ship, Activity, TrendingUp, SlidersHorizontal, Globe2 } from 'lucide-react';
import CountryTimeSeriesChart from './CountryTimeSeriesChart';
import { useTheme } from './ThemeProvider';
import { METRIC_CONFIG, formatCountryName } from '../utils/formatters';

const COUNTRY_VIEW_METRIC_IDS = ['mean_cpue', 'mean_rpue', 'mean_price_kg'];
const MOZAMBIQUE_NO_GEAR = 'mozambique';

const toTitleCase = (value = '') =>
    value
        .toLowerCase()
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const formatMetricValue = (metricId, value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    const config = METRIC_CONFIG[metricId];
    if (!config?.format) return value.toFixed(2);
    return config.format(value);
};

const getPercentileBand = (percentile) => {
    if (percentile >= 75) return 'Top Quartile';
    if (percentile <= 25) return 'Bottom Quartile';
    return 'Middle Band';
};

const getMedian = (values) => {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
};

const CountryView = () => {
    const { theme } = useTheme();
    const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const [timeSeriesData, setTimeSeriesData] = useState(null);
    const [frameGearRows, setFrameGearRows] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedMetric, setSelectedMetric] = useState('mean_cpue');
    const [selectedGaul2Key, setSelectedGaul2Key] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [isGaul2Open, setIsGaul2Open] = useState(false);
    const [showExtendedComparison, setShowExtendedComparison] = useState(false);
    const countryScopeRef = useRef(null);

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            const [timeSeries, frameRows] = await Promise.all([
                loadTimeSeriesGaul2(),
                loadFrameGearsData()
            ]);
            setTimeSeriesData(timeSeries);
            setFrameGearRows(frameRows ?? []);
            setIsLoading(false);
        };
        initData();
    }, []);

    const availableCountries = useMemo(() => {
        if (!timeSeriesData) return [];
        const countries = new Set();
        Object.values(timeSeriesData).forEach(region => {
            if (region.country) countries.add(region.country);
        });
        return Array.from(countries).sort();
    }, [timeSeriesData]);

    useEffect(() => {
        if (!selectedCountry && availableCountries.length > 0) {
            setSelectedCountry(availableCountries[0]);
        }
    }, [selectedCountry, availableCountries]);

    const gaul2Regions = useMemo(() => {
        if (!selectedCountry || !timeSeriesData) return [];
        return Object.entries(timeSeriesData)
            .filter(([, region]) => region.country?.toLowerCase() === selectedCountry.toLowerCase())
            .map(([key, region]) => ({
                key,
                country: region.country,
                gaul1_name: region.gaul1_name,
                gaul2_name: region.gaul2_name,
                data: region.data
            }))
            .sort((a, b) => {
                if (a.gaul1_name === b.gaul1_name) {
                    return a.gaul2_name.localeCompare(b.gaul2_name);
                }
                return a.gaul1_name.localeCompare(b.gaul1_name);
            });
    }, [selectedCountry, timeSeriesData]);

    useEffect(() => {
        setSelectedGaul2Key('');
        setIsCountryOpen(false);
        setIsGaul2Open(false);
    }, [selectedCountry]);

    useEffect(() => {
        if (!gaul2Regions.some((region) => region.key === selectedGaul2Key)) {
            setSelectedGaul2Key(gaul2Regions[0]?.key ?? '');
        }
    }, [gaul2Regions, selectedGaul2Key]);

    useEffect(() => {
        const handleDocumentMouseDown = (event) => {
            if (!countryScopeRef.current?.contains(event.target)) {
                setIsCountryOpen(false);
                setIsGaul2Open(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsCountryOpen(false);
                setIsGaul2Open(false);
            }
        };

        document.addEventListener('mousedown', handleDocumentMouseDown);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleDocumentMouseDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const selectedGaul2Region = useMemo(() => {
        return gaul2Regions.find((region) => region.key === selectedGaul2Key) ?? null;
    }, [gaul2Regions, selectedGaul2Key]);

    const selectedGaul2MetricSummary = useMemo(() => {
        if (!selectedGaul2Region?.data?.length) return null;
        const validEntries = selectedGaul2Region.data.filter((entry) => typeof entry[selectedMetric] === 'number');
        if (!validEntries.length) return null;

        const latestEntry = [...validEntries].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const avgValue = validEntries.reduce((sum, entry) => sum + entry[selectedMetric], 0) / validEntries.length;

        return {
            latestValue: latestEntry[selectedMetric],
            latestDate: latestEntry.date,
            averageValue: avgValue,
            observations: validEntries.length
        };
    }, [selectedGaul2Region, selectedMetric]);

    const countryMetricSummary = useMemo(() => {
        if (!gaul2Regions.length) return null;
        const values = [];
        gaul2Regions.forEach((region) => {
            const numeric = region.data
                .map((entry) => entry[selectedMetric])
                .filter((value) => typeof value === 'number' && !Number.isNaN(value));
            if (!numeric.length) return;
            values.push(numeric.reduce((sum, value) => sum + value, 0) / numeric.length);
        });

        if (!values.length) return null;
        return {
            average: values.reduce((sum, value) => sum + value, 0) / values.length,
            median: getMedian(values),
            count: values.length
        };
    }, [gaul2Regions, selectedMetric]);

    const benchmarkData = useMemo(() => {
        if (!selectedGaul2Region || !gaul2Regions.length) return null;
        const entries = gaul2Regions.map((region) => {
            const numeric = region.data
                .map((entry) => entry[selectedMetric])
                .filter((value) => typeof value === 'number' && !Number.isNaN(value));
            const avg = numeric.length ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : null;
            return { key: region.key, name: region.gaul2_name, avg };
        }).filter((item) => item.avg !== null);

        if (!entries.length) return null;
        const sorted = [...entries].sort((a, b) => b.avg - a.avg);
        const selected = sorted.find((entry) => entry.key === selectedGaul2Region.key);
        if (!selected) return null;

        const rank = sorted.findIndex((entry) => entry.key === selected.key) + 1;
        const percentile = Math.round(((sorted.length - rank) / Math.max(sorted.length - 1, 1)) * 100);
        const median = getMedian(sorted.map((entry) => entry.avg));
        const diffMedian = selected.avg - median;
        return {
            rank,
            total: sorted.length,
            percentile,
            band: getPercentileBand(percentile),
            diffMedian,
            median,
            top: sorted.slice(0, 3),
            bottom: sorted.slice(-3).reverse()
        };
    }, [selectedGaul2Region, gaul2Regions, selectedMetric]);

    const countryFrameInsights = useMemo(() => {
        if (!selectedCountry) return null;
        return getFrameGearInsights(frameGearRows, selectedCountry);
    }, [frameGearRows, selectedCountry]);

    const selectedFrameInsights = useMemo(() => {
        if (!selectedCountry || !selectedGaul2Region) return null;
        return getFrameGearInsights(
            frameGearRows,
            selectedCountry,
            selectedGaul2Region.gaul1_name,
            selectedGaul2Region.gaul2_name
        );
    }, [frameGearRows, selectedCountry, selectedGaul2Region]);

    const showGearBreakdown = useMemo(() => {
        if (!selectedCountry || !selectedFrameInsights) return false;
        if (selectedCountry.toLowerCase() === MOZAMBIQUE_NO_GEAR) return false;
        return selectedFrameInsights.hasGearBreakdown && selectedFrameInsights.gearBreakdown.length > 0;
    }, [selectedCountry, selectedFrameInsights]);

    return (
        <div className={cn(
            "min-h-screen w-full flex flex-col font-sans transition-colors duration-300",
            isDarkTheme ? "bg-[#060b19] text-foreground" : "bg-[#f8fafc] text-slate-900"
        )}>
            <Header
                boundaries={null}
                timeSeriesData={null}
                pdsH3EffortData={null}
            />

            <main className="flex-1 flex overflow-hidden">
                <aside className={cn(
                    "w-[380px] flex-none border-r flex flex-col overflow-hidden z-40 transition-all duration-300 shadow-2xl",
                    isDarkTheme ? "bg-[#060b19]/90 border-white/5 backdrop-blur-2xl" : "bg-white/90 border-slate-200 backdrop-blur-2xl"
                )}>
                    <div className={cn(
                        "px-6 pt-8 pb-6 border-b shrink-0",
                        isDarkTheme ? "border-white/5 bg-black/20" : "border-black/5 bg-black/5"
                    )}>
                        <h2 className="m-0 text-xl font-display font-semibold flex items-center gap-3 text-foreground tracking-tight">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                                <SlidersHorizontal className="w-4 h-4 text-primary" />
                            </div>
                            Country Panel
                        </h2>
                        <p className="m-0 mt-3 text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-80">
                            Scope, metric and focus area
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        <div className="flex flex-col gap-6">
                            <div className={cn(
                                "rounded-2xl border p-4 flex flex-col gap-4",
                                isDarkTheme ? "bg-white/[0.02] border-white/30" : "bg-black/[0.02] border-black/30"
                            )} ref={countryScopeRef}>
                                <div className="flex items-center gap-2 px-1">
                                    <Globe2 size={14} className="text-primary" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-80">Country Scope</span>
                                </div>
                                <div className="relative mt-2">
                            <button
                                onClick={() => {
                                    setIsCountryOpen((prev) => !prev);
                                    setIsGaul2Open(false);
                                }}
                                disabled={isLoading}
                                className={cn(
                                    "h-11 w-full rounded-xl border flex items-center justify-between px-4 transition-all duration-300",
                                    isDarkTheme
                                        ? "bg-white/5 border-white/10 hover:bg-white/10"
                                        : "bg-black/5 border-black/10 hover:bg-black/10",
                                    isCountryOpen && "ring-2 ring-primary border-primary"
                                )}
                            >
                                <span className={cn(
                                    "text-sm font-medium",
                                    selectedCountry ? "text-foreground" : "text-muted-foreground opacity-70"
                                )}>
                                    {isLoading ? 'Loading data...' : (selectedCountry ? formatCountryName(selectedCountry) : 'Select a country...')}
                                </span>
                                <ChevronDown size={16} className={cn(
                                    "text-muted-foreground transition-transform duration-300",
                                    isCountryOpen && "rotate-180"
                                )} />
                            </button>

                            {isCountryOpen && (
                                <div className={cn(
                                    "relative mt-2 w-full rounded-xl border shadow-xl overflow-hidden z-50 animate-in slide-in-from-top-2",
                                    isDarkTheme ? "bg-[#0f172a] border-white/10" : "bg-white border-slate-200"
                                )}>
                                    <div className="max-h-[300px] overflow-y-auto py-2">
                                        {availableCountries.map((country) => (
                                            <button
                                                key={country}
                                                onClick={() => {
                                                    setSelectedCountry(country);
                                                    setIsCountryOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full px-4 py-2.5 text-left text-sm transition-colors",
                                                    selectedCountry === country
                                                        ? "bg-primary/20 text-primary font-bold"
                                                        : isDarkTheme ? "text-foreground hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                                                )}
                                            >
                                                {formatCountryName(country)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedCountry && (
                                <div className="relative mt-4 pt-4 border-t border-border/40">
                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground/80 font-semibold px-1 mb-2">GAUL2 Area</div>
                                    <button
                                        onClick={() => {
                                            setIsGaul2Open((prev) => !prev);
                                            setIsCountryOpen(false);
                                        }}
                                        className={cn(
                                            "h-11 w-full rounded-xl border flex items-center justify-between px-4 transition-all duration-300",
                                            isDarkTheme
                                                ? "bg-white/5 border-white/10 hover:bg-white/10"
                                                : "bg-black/5 border-black/10 hover:bg-black/10",
                                            isGaul2Open && "ring-2 ring-primary border-primary"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-sm font-medium truncate",
                                            selectedGaul2Region ? "text-foreground" : "text-muted-foreground opacity-70"
                                        )}>
                                            {selectedGaul2Region ? `${selectedGaul2Region.gaul2_name} (${selectedGaul2Region.gaul1_name})` : 'No GAUL2 available'}
                                        </span>
                                        <ChevronDown size={14} className={cn(
                                            "text-muted-foreground transition-transform duration-300",
                                            isGaul2Open && "rotate-180"
                                        )} />
                                    </button>
                                    {isGaul2Open && (
                                        <div className={cn(
                                            "relative mt-2 w-full rounded-xl border shadow-xl overflow-hidden z-50 animate-in slide-in-from-top-2",
                                            isDarkTheme ? "bg-[#0f172a] border-white/10" : "bg-white border-slate-200"
                                        )}>
                                            <div className="max-h-[260px] overflow-y-auto py-2">
                                                {gaul2Regions.map((region) => (
                                                    <button
                                                        key={region.key}
                                                        onClick={() => {
                                                            setSelectedGaul2Key(region.key);
                                                            setIsGaul2Open(false);
                                                        }}
                                                        className={cn(
                                                            "w-full px-4 py-2 text-left text-sm transition-colors",
                                                            selectedGaul2Key === region.key
                                                                ? "bg-primary/20 text-primary font-bold"
                                                                : isDarkTheme ? "text-foreground hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {region.gaul2_name}
                                                        <span className="ml-1 text-xs opacity-60">({region.gaul1_name})</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                                </div>
                            </div>

                            {selectedCountry && (
                                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className={cn(
                                        "rounded-2xl border p-4 flex flex-col gap-3",
                                        isDarkTheme ? "bg-white/[0.02] border-white/30" : "bg-black/[0.02] border-black/30"
                                    )}>
                                <div className="px-1 flex items-center gap-2">
                                    <Layers size={12} className="text-primary" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Analysis Metric</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {COUNTRY_VIEW_METRIC_IDS.map(id => {
                                        const config = METRIC_CONFIG[id];
                                        const isActive = selectedMetric === id;
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => setSelectedMetric(id)}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl border text-left transition-all duration-300 flex flex-col gap-0.5",
                                                    isActive
                                                        ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(0,245,255,0.1)]"
                                                        : isDarkTheme ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-black/5 border-black/5 hover:bg-black/10"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={cn("text-xs font-bold", isActive ? "text-primary" : "text-foreground")}>{config.label}</span>
                                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,245,255,1)]" />}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground opacity-70">{config.description}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                                </div>
                            )}

                            {selectedCountry && countryMetricSummary && (
                                <div className={cn(
                                    "rounded-2xl border p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500",
                                    isDarkTheme ? "bg-white/[0.02] border-white/30" : "bg-black/[0.02] border-black/30"
                                )}>
                                    <div className="px-1 text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">
                                Country Snapshot
                                    </div>

                            <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-2 border-primary">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Avg. {METRIC_CONFIG[selectedMetric].label}</div>
                                    <div className="text-xl font-display font-bold text-primary">{formatMetricValue(selectedMetric, countryMetricSummary.average)}</div>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <BarChart3 size={16} className="text-primary" />
                                </div>
                            </div>

                            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Tracked GAUL2</div>
                                    <div className="text-xl font-display font-extrabold text-foreground">{countryMetricSummary.count}</div>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
                                    <MapPin size={16} />
                                </div>
                            </div>

                            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Fishers / Boats</div>
                                    <div className="text-sm font-bold text-foreground">
                                        {(countryFrameInsights?.totals?.fishers_total ?? 0).toLocaleString()} / {(countryFrameInsights?.totals?.boats_total ?? 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    FRAME
                                </div>
                            </div>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto flex flex-col gap-6">
                        {!selectedCountry ? (
                            <div className="glass-panel p-8 rounded-2xl min-h-[400px] flex items-center justify-center">
                                <div className="text-center">
                                    <h3 className="font-display font-medium text-xl text-muted-foreground mb-2">No Country Selected</h3>
                                    <p className="text-muted-foreground/60 text-sm">Please select a country from the sidebar to view insights.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="min-h-[400px]">
                                <h2 className="font-display font-bold text-2xl text-foreground mb-1">{formatCountryName(selectedCountry)}</h2>
                                <p className="text-muted-foreground text-sm mb-6">Country and GAUL2 details with trend, comparison and gear data.</p>

                                <div className="glass-panel p-5 rounded-2xl mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-base font-display font-semibold text-foreground m-0">Time Series</h3>
                                    </div>
                                    <CountryTimeSeriesChart
                                        data={timeSeriesData}
                                        selectedCountry={selectedCountry}
                                        selectedMetric={selectedMetric}
                                        selectedGaul2={selectedGaul2Region}
                                        isDarkTheme={isDarkTheme}
                                        compact
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                                    <div className="glass-panel p-4 rounded-xl">
                                        <div className="text-[10px] uppercase text-muted-foreground tracking-widest font-bold mb-2">Selected Metric</div>
                                        <div className="text-lg font-display font-bold text-primary">{METRIC_CONFIG[selectedMetric].label}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{METRIC_CONFIG[selectedMetric].description}</div>
                                    </div>
                                    <div className="glass-panel p-4 rounded-xl">
                                        <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground tracking-widest font-bold mb-2"><Users size={12} /> Fishers</div>
                                        <div className="text-lg font-display font-bold text-foreground">{(selectedFrameInsights?.totals?.fishers_total ?? 0).toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Male {(selectedFrameInsights?.totals?.fishers_male ?? 0).toLocaleString()} | Female {(selectedFrameInsights?.totals?.fishers_female ?? 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="glass-panel p-4 rounded-xl">
                                        <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground tracking-widest font-bold mb-2"><Ship size={12} /> Boats</div>
                                        <div className="text-lg font-display font-bold text-foreground">{(selectedFrameInsights?.totals?.boats_total ?? 0).toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground mt-1">For selected GAUL2 area</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-2">
                                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-display font-bold text-foreground m-0">GAUL2 Informative Card</h3>
                                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">Selected Area</span>
                                        </div>
                                        {selectedGaul2Region ? (
                                            <>
                                                <div className="text-sm text-muted-foreground">
                                                    <span className="font-semibold text-foreground">{toTitleCase(selectedGaul2Region.gaul2_name)}</span>
                                                    <span className="mx-1.5">·</span>
                                                    {toTitleCase(selectedGaul2Region.gaul1_name)}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="rounded-xl border border-border/20 p-3">
                                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Latest {METRIC_CONFIG[selectedMetric].label}</div>
                                                        <div className="text-base font-semibold mt-1">{formatMetricValue(selectedMetric, selectedGaul2MetricSummary?.latestValue)}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">{selectedGaul2MetricSummary?.latestDate ?? 'N/A'}</div>
                                                    </div>
                                                    <div className="rounded-xl border border-border/20 p-3">
                                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Average in Series</div>
                                                        <div className="text-base font-semibold mt-1">{formatMetricValue(selectedMetric, selectedGaul2MetricSummary?.averageValue)}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">{selectedGaul2MetricSummary?.observations ?? 0} observations</div>
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-border/20 p-3">
                                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Quick Comparison</div>
                                                    {benchmarkData ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">Rank {benchmarkData.rank}/{benchmarkData.total}</span>
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">{benchmarkData.band}</span>
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
                                                                {benchmarkData.diffMedian >= 0 ? '+' : ''}{benchmarkData.diffMedian.toFixed(2)} vs median
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">Not enough data to compare.</div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">Select a GAUL2 area to view details.</div>
                                        )}
                                    </div>

                                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 xl:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-display font-bold text-foreground m-0">Comparison and Gear</h3>
                                            <button
                                                onClick={() => setShowExtendedComparison((prev) => !prev)}
                                                className="text-xs px-2.5 py-1 rounded-lg border border-border/25 hover:border-primary/40 transition-colors text-muted-foreground hover:text-foreground"
                                            >
                                                {showExtendedComparison ? 'Hide details' : 'See full comparison'}
                                            </button>
                                        </div>

                                        <div className="rounded-xl border border-border/20 p-3">
                                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2"><TrendingUp size={12} /> Benchmark chips</div>
                                            {benchmarkData ? (
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-2 py-1 rounded-full text-xs bg-primary/15 text-primary">{benchmarkData.percentile}th percentile</span>
                                                    <span className="px-2 py-1 rounded-full text-xs bg-sky-500/15 text-sky-300">Median {benchmarkData.median.toFixed(2)}</span>
                                                    <span className="px-2 py-1 rounded-full text-xs bg-violet-500/15 text-violet-300">{benchmarkData.total} GAUL2 compared</span>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground">Benchmark data unavailable for current filter.</div>
                                            )}
                                            {showExtendedComparison && benchmarkData && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                                    <div className="rounded-lg border border-border/20 p-3">
                                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Top peers</div>
                                                        <div className="space-y-1.5 text-sm">
                                                            {benchmarkData.top.map((item) => (
                                                                <div key={item.key} className="flex items-center justify-between">
                                                                    <span>{item.name}</span>
                                                                    <span className="font-medium">{item.avg.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg border border-border/20 p-3">
                                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Bottom peers</div>
                                                        <div className="space-y-1.5 text-sm">
                                                            {benchmarkData.bottom.map((item) => (
                                                                <div key={item.key} className="flex items-center justify-between">
                                                                    <span>{item.name}</span>
                                                                    <span className="font-medium">{item.avg.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-border/20 p-3">
                                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2"><Activity size={12} /> Gear composition</div>
                                            {showGearBreakdown ? (
                                                <div className="space-y-2">
                                                    {selectedFrameInsights.gearBreakdown.slice(0, 6).map((gear) => {
                                                        const fishersShare = selectedFrameInsights.totals.fishers_total > 0
                                                            ? (gear.fishers_total / selectedFrameInsights.totals.fishers_total) * 100
                                                            : 0;
                                                        return (
                                                            <div key={gear.gear_name} className="rounded-lg border border-border/20 p-2.5">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="font-medium">{gear.gear_name}</span>
                                                                    <span className="text-muted-foreground">{gear.fishers_total.toLocaleString()} fishers</span>
                                                                </div>
                                                                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(fishersShare, 100)}%` }} />
                                                                </div>
                                                                <div className="mt-1 text-[11px] text-muted-foreground">{fishersShare.toFixed(1)}% of fishers | {gear.boats_total.toLocaleString()} boats</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground">
                                                    {selectedCountry.toLowerCase() === MOZAMBIQUE_NO_GEAR
                                                        ? 'Gear-level breakdown unavailable for Mozambique; only fishers and boats totals are provided.'
                                                        : 'No gear-level breakdown available for this area.'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
};

export default CountryView;

