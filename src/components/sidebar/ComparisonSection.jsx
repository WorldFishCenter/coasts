import { Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { METRIC_CONFIG, formatRegionName, formatCountryName } from '../../utils/formatters';

const ComparisonSection = ({
    isDarkTheme,
    isGaul1,
    selectedRegions,
    selectedMetric,
    onRegionRemove
}) => {
    const regionLabel = isGaul1 ? 'Regions' : 'Districts';

    return (
        <div className="flex flex-col gap-5">
            {/* Section Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(0,245,255,0.1)]">
                    <Filter className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="m-0 text-base font-display font-semibold text-foreground tracking-wide">{regionLabel} Benchmark</h3>
                    <p className="m-0 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest opacity-80 mt-1">
                        {selectedRegions.length > 0 ? `${selectedRegions.length} selected for comparison` : `Click ${regionLabel.toLowerCase()} to compare`}
                    </p>
                </div>
            </div>

            {/* Selected Items */}
            {selectedRegions.length === 0 ? (
                <div className={cn(
                    "text-center py-10 px-5 rounded-2xl border-2 border-dashed transition-colors",
                    isDarkTheme ? "border-white/10 bg-white/5" : "border-black/5 bg-black/5"
                )}>
                    <div className="text-3xl mb-4 opacity-50 grayscale drop-shadow-lg">🗺️</div>
                    <div className="text-sm font-display font-bold mb-1.5 text-foreground tracking-wide">Awaiting Selection</div>
                    <div className="text-xs text-muted-foreground font-medium">Click on {regionLabel.toLowerCase()} in the map view</div>
                </div>
            ) : (
                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden pr-2">
                    <div className="flex flex-col gap-2.5">
                        {selectedRegions.map((region, idx) => {
                            const metricValue = region.properties[selectedMetric];
                            const metricInfo = METRIC_CONFIG[selectedMetric];
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex justify-between items-center p-4 rounded-2xl border transition-all duration-300 group hover:shadow-lg",
                                        isDarkTheme ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-black/5 border-black/5 hover:bg-black/10"
                                    )}
                                >
                                    <div className="flex-1 min-w-0 pr-4 border-r border-border/40">
                                        <div className="text-sm font-display font-bold truncate text-foreground tracking-tight mb-1 group-hover:text-primary transition-colors">
                                            {formatRegionName(region.properties)}
                                        </div>
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-70">
                                            {formatCountryName(region.properties.country)}
                                        </div>
                                    </div>

                                    <div className="pl-4 flex flex-col items-end gap-1">
                                        <span className="text-xs font-display font-bold text-primary bg-primary/10 px-2 py-1 rounded-md shadow-inner border border-primary/20">
                                            {metricInfo.format(metricValue)}
                                        </span>
                                        <button
                                            onClick={() => onRegionRemove(region)}
                                            className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground hover:text-red-500 transition-colors mt-1 flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" /> Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonSection;
