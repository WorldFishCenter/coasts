import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '../lib/utils';
import { METRIC_CONFIG } from '../utils/formatters';

// Extract the exact distinct colors from our theme
const CHART_COLORS = [
    '#00f5ff', // primary cyan
    '#00e676', // success green
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // purple
];

const CountryTimeSeriesChart = ({ data, selectedCountry, selectedMetric = 'mean_cpue', selectedDistrict = 'all', isDarkTheme }) => {

    const chartData = useMemo(() => {
        if (!data || !selectedCountry) return [];

        // Filter regions belonging to selected country
        let countryRegions = Object.entries(data).filter(([key, region]) =>
            region.country?.toLowerCase() === selectedCountry.toLowerCase()
        );

        // Filter by district if not 'all'
        if (selectedDistrict !== 'all') {
            countryRegions = countryRegions.filter(([key, regionDesc]) =>
                regionDesc.gaul1_name === selectedDistrict
            );
        }

        if (countryRegions.length === 0) return [];

        const dateMap = new Map();

        countryRegions.forEach(([key, regionDesc]) => {
            const regionName = regionDesc.gaul1_name || key;

            regionDesc.data.forEach(entry => {
                const metricValue = entry[selectedMetric];
                if (!entry.date || typeof metricValue !== 'number') return;

                let point = dateMap.get(entry.date) || {
                    date: entry.date,
                    timestamp: new Date(entry.date).getTime()
                };
                point[regionName] = metricValue;
                dateMap.set(entry.date, point);
            });
        });

        return Array.from(dateMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    }, [data, selectedCountry, selectedMetric, selectedDistrict]);

    const metricConfig = useMemo(() => METRIC_CONFIG[selectedMetric] || { label: 'Metric', unit: '' }, [selectedMetric]);

    const regions = useMemo(() => {
        if (chartData.length === 0) return [];
        const seriesKeys = new Set();
        chartData.forEach((point) => {
            Object.keys(point).forEach((key) => {
                if (key !== 'date' && key !== 'timestamp') {
                    seriesKeys.add(key);
                }
            });
        });
        return Array.from(seriesKeys);
    }, [chartData]);


    if (!data) return null;

    if (chartData.length === 0) {
        return (
            <div className="w-full h-[400px] flex items-center justify-center bg-black/5 rounded-xl border border-dashed border-border/50">
                <span className="text-muted-foreground">No {metricConfig.label} data available for {selectedDistrict === 'all' ? selectedCountry : selectedDistrict}</span>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        return (
            <div className={cn(
                "p-4 rounded-xl border shadow-xl",
                isDarkTheme ? "bg-[#0f172a]/95 border-white/10 backdrop-blur-md" : "bg-white/95 border-slate-200 backdrop-blur-md"
            )}>
                <p className="font-bold text-sm mb-3 pb-2 border-b border-border/50 text-foreground">{label}</p>
                <div className="flex flex-col gap-2">
                    {payload.sort((a, b) => b.value - a.value).map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-muted-foreground">{entry.name}</span>
                            </div>
                            <span className="font-mono font-medium text-foreground">{entry.value.toFixed(2)} <span className="text-[10px] opacity-70 ml-1">{metricConfig.unit}</span></span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        {regions.map((region, index) => (
                            <linearGradient key={`grad-${region}`} id={`fill-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDarkTheme ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                    />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                        tick={{ fill: isDarkTheme ? '#94a3b8' : '#64748b', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        minTickGap={30}
                    />
                    <YAxis
                        tick={{ fill: isDarkTheme ? '#94a3b8' : '#64748b', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(tick) => tick.toFixed(1)}
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', color: isDarkTheme ? '#cbd5e1' : '#475569' }}
                    />
                    {regions.map((region, index) => (
                        <Area
                            key={region}
                            type="monotone"
                            dataKey={region}
                            name={region}
                            stroke={CHART_COLORS[index % CHART_COLORS.length]}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#fill-${index})`}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CountryTimeSeriesChart;
