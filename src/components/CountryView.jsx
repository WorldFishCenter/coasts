import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header'; // Adjust path if needed
import { cn } from '../lib/utils';
import { useLocation } from 'react-router-dom';
import { loadTimeSeriesGaul1 } from '../services/dataService';
import { ChevronDown } from 'lucide-react';
import CountryTimeSeriesChart from './CountryTimeSeriesChart';

const CountryView = () => {
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        // Default to dark or read from localStorage equivalent if ThemeProvider handles it
        return document.documentElement.classList.contains('dark');
    });

    // State
    const [timeSeriesData, setTimeSeriesData] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
                        </div>            </div>
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
                                        isDarkTheme={isDarkTheme}
                                    />
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
