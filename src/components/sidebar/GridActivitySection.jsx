import { useMemo } from 'react';
import { Activity, Box, Flame, Hexagon, Map as MapIcon, Layers, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ACTIVITY_METRICS, calculateH3Stats, calculateGroundsStats } from '../../utils/gridLayerConfig';

const FishingActivitySection = ({
    isDarkTheme,
    transformedH3Data,
    pdsFishingGroundsData,
    visualizationMode,
    onVisualizationModeChange,
    selectedActivityMetric,
    onActivityMetricChange,
    activeActivityLayers,
    onLayerToggle
}) => {
    const h3Stats = useMemo(() => {
        return calculateH3Stats(transformedH3Data);
    }, [transformedH3Data]);

    const groundsStats = useMemo(() => {
        return calculateGroundsStats(pdsFishingGroundsData);
    }, [pdsFishingGroundsData]);

    return (
        <div className="flex flex-col gap-5">
            {/* Section Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(0,245,255,0.1)]">
                    <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="m-0 text-base font-display font-semibold text-foreground tracking-wide">Fishing Activity</h3>
                    <p className="m-0 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest opacity-80 mt-1">
                        {h3Stats.activeCells.toLocaleString()} H3 Cells • {groundsStats.totalGrounds.toLocaleString()} Grounds
                    </p>
                </div>
            </div>

            {/* Layer Visibility Toggles */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onLayerToggle('hexagons')}
                    className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
                        activeActivityLayers?.hexagons
                            ? isDarkTheme ? "bg-white/10 border-white/20" : "bg-black/10 border-black/20"
                            : isDarkTheme ? "bg-white/5 border-white/5 opacity-60" : "bg-black/5 border-black/5 opacity-60"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Hexagon className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-foreground">Activity Grid</span>
                    </div>
                    {activeActivityLayers?.hexagons ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button
                    onClick={() => onLayerToggle('grounds')}
                    className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
                        activeActivityLayers?.grounds
                            ? isDarkTheme ? "bg-white/10 border-white/20" : "bg-black/10 border-black/20"
                            : isDarkTheme ? "bg-white/5 border-white/5 opacity-60" : "bg-black/5 border-black/5 opacity-60"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <MapIcon className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-foreground">Fishing Grounds</span>
                    </div>
                    {activeActivityLayers?.grounds ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </button>
            </div>

            {/* Visualization Mode Selector */}
            <div className={cn(
                "p-1.5 flex gap-1.5 rounded-2xl border backdrop-blur-md",
                isDarkTheme ? "bg-black/40 border-white/5" : "bg-black/5 border-black/5"
            )}>
                <button
                    onClick={() => onVisualizationModeChange?.('column')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-xl h-9 transition-all duration-300 font-bold text-xs tracking-wide",
                        visualizationMode === 'column'
                            ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(0,245,255,0.3)] ring-1 ring-primary/50"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                >
                    <Box className="w-3.5 h-3.5" /> 3D Columns
                </button>
                <button
                    onClick={() => onVisualizationModeChange?.('heatmap')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-xl h-9 transition-all duration-300 font-bold text-xs tracking-wide",
                        visualizationMode === 'heatmap'
                            ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(0,245,255,0.3)] ring-1 ring-primary/50"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                >
                    <Flame className="w-3.5 h-3.5" /> Flat
                </button>
            </div>

            {/* Statistics Cards - Activity Grid */}
            {/* <div className="grid grid-cols-2 gap-3 mt-1">
                <div className={cn(
                    "p-4 rounded-2xl border transition-colors",
                    isDarkTheme ? "bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10" : "bg-blue-50 border-blue-100 hover:bg-blue-100/50"
                )}>
                    <div className="flex items-center gap-1.5 text-[9px] text-blue-500/80 mb-1 uppercase tracking-[0.2em] font-bold">
                        <Hexagon className="w-3 h-3" /> Total Fishing
                    </div>
                    <div className="text-3xl font-display font-bold text-blue-500 tracking-tight truncate">
                        {h3Stats.totalFishingHours > 1000 ? `${(h3Stats.totalFishingHours / 1000).toFixed(1)}k` : h3Stats.totalFishingHours.toFixed(0)}<span className="text-base font-medium ml-1 opacity-60">h</span>
                    </div>
                </div>
                <div className={cn(
                    "p-4 rounded-2xl border transition-colors",
                    isDarkTheme ? "bg-green-500/5 border-green-500/10 hover:bg-green-500/10" : "bg-green-50 border-green-100 hover:bg-green-100/50"
                )}>
                    <div className="text-[9px] text-green-500/80 mb-1 uppercase tracking-[0.2em] font-bold">Total Unique Trips</div>
                    <div className="text-3xl font-display font-bold text-green-500 tracking-tight truncate">
                        {h3Stats.totalUniqueTrips > 1000 ? `${(h3Stats.totalUniqueTrips / 1000).toFixed(1)}k` : h3Stats.totalUniqueTrips.toLocaleString()}
                    </div>
                </div>
            </div> */}

            {/* Statistics Cards - Fishing Grounds */}
            {/* <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                    "p-4 rounded-2xl border transition-colors",
                    isDarkTheme ? "bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10" : "bg-amber-50 border-amber-100 hover:bg-amber-100/50"
                )}>
                    <div className="flex items-center gap-1.5 text-[9px] text-amber-500/80 mb-1 uppercase tracking-[0.2em] font-bold">
                        <MapIcon className="w-3 h-3" /> Grounds Area
                    </div>
                    <div className="text-3xl font-display font-bold text-amber-500 tracking-tight truncate">
                        {groundsStats.totalArea > 1000 ? `${(groundsStats.totalArea / 1000).toFixed(1)}k` : groundsStats.totalArea.toFixed(0)}<span className="text-base font-medium ml-1 opacity-60">km²</span>
                    </div>
                </div>
                <div className={cn(
                    "p-4 rounded-2xl border transition-colors",
                    isDarkTheme ? "bg-purple-500/5 border-purple-500/10 hover:bg-purple-500/10" : "bg-purple-50 border-purple-100 hover:bg-purple-100/50"
                )}>
                    <div className="text-[9px] text-purple-500/80 mb-1 uppercase tracking-[0.2em] font-bold">Grounds Total Fishing</div>
                    <div className="text-3xl font-display font-bold text-purple-500 tracking-tight truncate">
                        {groundsStats.totalFishingHours > 1000 ? `${(groundsStats.totalFishingHours / 1000).toFixed(1)}k` : groundsStats.totalFishingHours.toFixed(0)}<span className="text-base font-medium ml-1 opacity-60">h</span>
                    </div>
                </div>
            </div> */}


            {/* Filters Section */}
            <div className="flex flex-col gap-4 mt-2">
                {/* Metric Selector */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Analysis Metric</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {ACTIVITY_METRICS.map(metric => (
                            <button
                                key={metric.id}
                                onClick={() => onActivityMetricChange(metric.id)}
                                className={cn(
                                    "px-3 py-2.5 rounded-xl border text-left transition-all duration-300",
                                    selectedActivityMetric === metric.id
                                        ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(0,245,255,0.1)] text-primary font-bold"
                                        : isDarkTheme ? "bg-white/5 border-white/5 hover:bg-white/10 text-foreground" : "bg-black/5 border-black/5 hover:bg-black/10 text-slate-700"
                                )}
                            >
                                <div className="text-xs">{metric.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FishingActivitySection;

