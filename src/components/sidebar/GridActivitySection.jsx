import { useMemo } from 'react';
import { Activity, Box, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TIME_BREAKS, COLOR_RANGE, calculateGridStats } from '../../utils/gridLayerConfig';

const GridActivitySection = ({
    isDarkTheme,
    transformedPdsData,
    visualizationMode,
    onVisualizationModeChange,
    selectedRanges,
    onRangeToggle
}) => {
    const gridStats = useMemo(() => {
        return calculateGridStats(transformedPdsData);
    }, [transformedPdsData]);

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
                        {gridStats.totalCells.toLocaleString()} grid cells active
                    </p>
                </div>
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
                    <Flame className="w-3.5 h-3.5" /> Heatmap
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 gap-3 mt-1">
                <div className={cn(
                    "p-4 rounded-2xl border transition-colors",
                    isDarkTheme ? "bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10" : "bg-blue-50 border-blue-100 hover:bg-blue-100/50"
                )}>
                    <div className="text-[9px] text-blue-500/80 mb-1 uppercase tracking-[0.2em] font-bold">Average Time</div>
                    <div className="text-3xl font-display font-bold text-blue-500 tracking-tight">
                        {gridStats.avgTime.toFixed(2)}<span className="text-base font-medium ml-1 opacity-60">h</span>
                    </div>
                </div>
                <div className={cn(
                    "p-4 rounded-2xl border transition-colors",
                    isDarkTheme ? "bg-green-500/5 border-green-500/10 hover:bg-green-500/10" : "bg-green-50 border-green-100 hover:bg-green-100/50"
                )}>
                    <div className="text-[9px] text-green-500/80 mb-1 uppercase tracking-[0.2em] font-bold">Total Visits</div>
                    <div className="text-3xl font-display font-bold text-green-500 tracking-tight">
                        {gridStats.totalVisits.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-2">
                <div className="h-px bg-border/40 flex-1" />
                <span className="text-[9px] text-muted-foreground opacity-60 tracking-[0.2em] font-bold uppercase shrink-0">Time Filter</span>
                <div className="h-px bg-border/40 flex-1" />
            </div>

            {/* Time Range Filters */}
            <div className="flex flex-wrap gap-2 justify-center">
                {TIME_BREAKS.map((range, index) => {
                    const isSelected = selectedRanges.some(r => r.min === range.min && r.max === range.max);
                    const timeValue = range.min + (range.max === Infinity ? 8 : range.max - range.min) / 2;
                    const normalizedValue = Math.min(timeValue / 12, 1);
                    const opacity = isDarkTheme ? 0.3 + (normalizedValue * 0.7) : 0.6 + (normalizedValue * 0.4);

                    return (
                        <button
                            key={`${range.min}-${range.max}`}
                            onClick={() => onRangeToggle(range)}
                            className={cn(
                                "group relative flex items-center gap-2.5 py-2 pl-2.5 pr-4 cursor-pointer rounded-full border transition-all duration-300",
                                isSelected
                                    ? "bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(0,245,255,0.15)] ring-1 ring-primary/20"
                                    : isDarkTheme
                                        ? "bg-white/5 border-white/5 hover:bg-white/10"
                                        : "bg-black/5 border-black/5 hover:bg-black/10"
                            )}
                        >
                            {isSelected && (
                                <div className="absolute inset-0 bg-primary/5 rounded-full pointer-events-none" />
                            )}
                            <div
                                className={cn(
                                    "w-3.5 h-3.5 rounded-full shadow-inner transition-transform duration-300",
                                    isSelected ? "scale-110" : "scale-100 group-hover:scale-110"
                                )}
                                style={{ backgroundColor: `rgba(${COLOR_RANGE[index].join(',')}, ${opacity})` }}
                            />
                            <span className={cn(
                                "text-[11px] tracking-wide relative z-10",
                                isSelected ? "font-bold text-primary" : "font-semibold text-muted-foreground"
                            )}>
                                {range.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default GridActivitySection;
