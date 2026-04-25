import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header'; // Adjust path if needed
import { cn } from '../lib/utils';
import { useLocation } from 'react-router-dom';
import { loadTimeSeriesGaul1 } from '../services/dataService';
import { ChevronDown, BarChart3, Map, Filter, Layers } from 'lucide-react';
import CountryTimeSeriesChart from './CountryTimeSeriesChart';
import { METRIC_CONFIG, SELECTABLE_METRIC_IDS } from '../utils/formatters';

const CountryView = () => {
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        // Default to dark or read from localStorage equivalent if ThemeProvider handles it
        return document.documentElement.classList.contains('dark');
    });

    // State
    const [timeSeriesData, setTimeSeriesData] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedMetric, setSelectedMetric] = useState('mean_cpue');
    const [selectedDistrict, setSelectedDistrict] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDistrictOpen, setIsDistrictOpen] = useState(false);

    // Initial Data Load
    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            const data = await loadTimeSeriesGaul1();
            setTimeSeriesData(data);
            setIsLoading(false);
        };
        initData();
    }, []);

    // Compute unique countries from the GAUL1 timeseries data
    const availableCountries = useMemo(() => {
        if (!timeSeriesData) return [];
        const countries = new Set();
        Object.values(timeSeriesData).forEach(region => {
            if (region.country) countries.add(region.country);
        });
        return Array.from(countries).sort();
    }, [timeSeriesData]);

    // Compute unique districts for the selected country
    const availableDistricts = useMemo(() => {
        if (!selectedCountry || !timeSeriesData) return [];
        const districts = new Set();
        Object.values(timeSeriesData).forEach(region => {
            if (region.country?.toLowerCase() === selectedCountry.toLowerCase()) {
                if (region.gaul1_name) districts.add(region.gaul1_name);
            }
        });
        return Array.from(districts).sort();
    }, [selectedCountry, timeSeriesData]);

    // Reset district when country changes
    useEffect(() => {
        setSelectedDistrict('all');
    }, [selectedCountry]);

    // Compute aggregate stats for the selected country
    const nationalStats = useMemo(() => {
        if (!selectedCountry || !timeSeriesData) return null;

        let countryRegions = Object.values(timeSeriesData).filter(
            r => r.country?.toLowerCase() === selectedCountry.toLowerCase()
        );

        if (selectedDistrict !== 'all') {
            countryRegions = countryRegions.filter(r => r.gaul1_name === selectedDistrict);
        }

        let totalCpue = 0;
        let dataPoints = 0;
        const activeRegions = countryRegions.length;

        countryRegions.forEach(region => {
            region.data.forEach(d => {
                const val = d[selectedMetric];
                if (typeof val === 'number') {
                    totalCpue += val;
                    dataPoints++;
                }
            });
        });

        return {
            avgValue: dataPoints > 0 ? (totalCpue / dataPoints).toFixed(2) : '0.00',
            activeRegions,
            dataRetention: activeRegions > 0 ? 'High' : 'None'
        };
    }, [selectedCountry, timeSeriesData, selectedMetric]);

    const handleThemeChange = (dark) => {
        setIsDarkTheme(dark);
        if (dark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('coasts-ui-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('coasts-ui-theme', 'light');
        }
    };

    return (
        <div className={cn(
            "min-h-screen w-full flex flex-col font-sans transition-colors duration-300",
            isDarkTheme ? "bg-[#060b19] text-foreground" : "bg-[#f8fafc] text-slate-900"
        )}>
            {/* 
        We pass empty datasets for now just so the Header renders cleanly 
        without crashing the dynamicStats calculation.
      */}
            <Header
                isDarkTheme={isDarkTheme}
                onThemeChange={handleThemeChange}
                boundaries={null}
                timeSeriesData={null}
                pdsGridsData={null}
            />

            <main className="flex-1 flex overflow-hidden">
                {/* Left Sidebar Menu */}
                <aside className={cn(
                    "w-[340px] flex-none border-r flex flex-col pt-6 pb-6 px-4 z-40 transition-all duration-300",
                    isDarkTheme ? "bg-[#0a1930]/90 border-white/5" : "bg-white border-slate-200"
                )}>
                    <div className="glass-panel p-5 rounded-2xl mb-6 flex flex-col gap-4">
                        <h2 className="font-display font-bold text-lg m-0 text-foreground">Country Overview</h2>
                        <p className="text-sm text-muted-foreground m-0">
                            Select a country to explore detailed time-series of national fishing activity.
                        </p>

                        {/* Country Selector Dropdown */}
                        <div className="relative mt-2">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                disabled={isLoading}
                                className={cn(
                                    "h-11 w-full rounded-xl border flex items-center justify-between px-4 transition-all duration-300",
                                    isDarkTheme
                                        ? "bg-white/5 border-white/10 hover:bg-white/10"
                                        : "bg-black/5 border-black/10 hover:bg-black/10",
                                    isDropdownOpen && "ring-2 ring-primary border-primary"
                                )}
                            >
                                <span className={cn(
                                    "text-sm font-medium",
                                    selectedCountry ? "text-foreground" : "text-muted-foreground opacity-70"
                                )}>
                                    {isLoading ? 'Loading data...' : (selectedCountry || 'Select a country...')}
                                </span>
                                <ChevronDown size={16} className={cn(
                                    "text-muted-foreground transition-transform duration-300",
                                    isDropdownOpen && "rotate-180"
                                )} />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className={cn(
                                    "absolute top-[calc(100%+8px)] left-0 w-full rounded-xl border shadow-xl overflow-hidden z-50 animate-in slide-in-from-top-2",
                                    isDarkTheme ? "bg-[#0f172a] border-white/10" : "bg-white border-slate-200"
                                )}>
                                    <div className="max-h-[300px] overflow-y-auto py-2">
                                        {availableCountries.map((country) => (
                                            <button
                                                key={country}
                                                onClick={() => {
                                                    setSelectedCountry(country);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full px-4 py-2.5 text-left text-sm transition-colors",
                                                    selectedCountry === country
                                                        ? "bg-primary/20 text-primary font-bold"
                                                        : isDarkTheme ? "text-foreground hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                                                )}
                                            >
                                                {country.charAt(0).toUpperCase() + country.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filters Section */}
                    {selectedCountry && (
                        <div className="flex flex-col gap-6 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            {/* Metric Selector */}
                            <div className="flex flex-col gap-3">
                                <div className="px-1 flex items-center gap-2">
                                    <Layers size={12} className="text-primary" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Analysis Metric</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {SELECTABLE_METRIC_IDS.map(id => {
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

                            {/* District Selector */}
                            <div className="flex flex-col gap-3">
                                <div className="px-1 flex items-center gap-2">
                                    <Filter size={12} className="text-primary" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Regional Filter</span>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDistrictOpen(!isDistrictOpen)}
                                        className={cn(
                                            "h-11 w-full rounded-xl border flex items-center justify-between px-4 transition-all duration-300",
                                            isDarkTheme
                                                ? "bg-white/5 border-white/10 hover:bg-white/10"
                                                : "bg-black/5 border-black/10 hover:bg-black/10",
                                            isDistrictOpen && "ring-2 ring-primary border-primary"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-sm font-medium",
                                            selectedDistrict !== 'all' ? "text-foreground" : "text-muted-foreground opacity-70"
                                        )}>
                                            {selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}
                                        </span>
                                        <ChevronDown size={14} className={cn(
                                            "text-muted-foreground transition-transform duration-300",
                                            isDistrictOpen && "rotate-180"
                                        )} />
                                    </button>

                                    {isDistrictOpen && (
                                        <div className={cn(
                                            "absolute top-[calc(100%+8px)] left-0 w-full rounded-xl border shadow-xl overflow-hidden z-50 animate-in slide-in-from-top-2",
                                            isDarkTheme ? "bg-[#0f172a] border-white/10" : "bg-white border-slate-200"
                                        )}>
                                            <div className="max-h-[250px] overflow-y-auto py-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDistrict('all');
                                                        setIsDistrictOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full px-4 py-2 text-left text-sm transition-colors",
                                                        selectedDistrict === 'all'
                                                            ? "bg-primary/20 text-primary font-bold"
                                                            : isDarkTheme ? "text-foreground hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                                                    )}
                                                >
                                                    All Districts
                                                </button>
                                                {availableDistricts.map((district) => (
                                                    <button
                                                        key={district}
                                                        onClick={() => {
                                                            setSelectedDistrict(district);
                                                            setIsDistrictOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full px-4 py-2 text-left text-sm transition-colors",
                                                            selectedDistrict === district
                                                                ? "bg-primary/20 text-primary font-bold"
                                                                : isDarkTheme ? "text-foreground hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {district}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* National/Regional Summary Section */}
                    {selectedCountry && nationalStats && (
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="px-5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">
                                {selectedDistrict === 'all' ? 'National' : 'Regional'} Summary
                            </div>

                            <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-2 border-primary">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Avg. {METRIC_CONFIG[selectedMetric].label}</div>
                                    <div className="text-xl font-display font-bold text-primary">{nationalStats.avgValue}</div>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <BarChart3 size={16} className="text-primary" />
                                </div>
                            </div>

                            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Tracked Regions</div>
                                    <div className="text-xl font-display font-extrabold text-foreground">{nationalStats.activeRegions}</div>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
                                    <Map size={16} />
                                </div>
                            </div>

                            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Data Quality</div>
                                    <div className="text-sm font-bold text-foreground">{nationalStats.dataRetention}</div>
                                </div>
                                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    OPTIMAL
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Dashboard Canvas */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto flex flex-col gap-6">

                        {!selectedCountry ? (
                            <div className="glass-panel p-8 rounded-2xl min-h-[400px] flex items-center justify-center">
                                <div className="text-center">
                                    <h3 className="font-display font-medium text-xl text-muted-foreground mb-2">No Country Selected</h3>
                                    <p className="text-muted-foreground/60 text-sm">Please select a country from the sidebar to view insights.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel p-8 rounded-2xl min-h-[400px]">
                                <h2 className="font-display font-bold text-2xl text-foreground mb-1 capitalize">{selectedCountry}</h2>
                                <p className="text-muted-foreground text-sm mb-6">Detailed fishing activity analysis and historical trends.</p>

                                {/* Country Insights Chart */}
                                <div className="w-full mt-4">
                                    <CountryTimeSeriesChart
                                        data={timeSeriesData}
                                        selectedCountry={selectedCountry}
                                        selectedMetric={selectedMetric}
                                        selectedDistrict={selectedDistrict}
                                        isDarkTheme={isDarkTheme}
                                    />
                                </div>

                                {/* Placeholder Metrics Grid for "More Stuff" */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 group hover:bg-white/5 transition-colors">
                                        <div className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Fleet Registry</div>
                                        <div className="text-xl font-bold">Integration Pending</div>
                                        <div className="mt-auto pt-4 border-t border-border/20 text-xs text-muted-foreground">Vessel count and registration status.</div>
                                    </div>
                                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 group hover:bg-white/5 transition-colors">
                                        <div className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Policy Compliance</div>
                                        <div className="text-xl font-bold">Awaiting Data</div>
                                        <div className="mt-auto pt-4 border-t border-border/20 text-xs text-muted-foreground">Regulatory adherence by local catch.</div>
                                    </div>
                                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 group hover:bg-white/5 transition-colors">
                                        <div className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Port Activity</div>
                                        <div className="text-xl font-bold">Modules Loading...</div>
                                        <div className="mt-auto pt-4 border-t border-border/20 text-xs text-muted-foreground">Logistics and offloading frequency.</div>
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

