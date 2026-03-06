import { BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { METRIC_CONFIG, SELECTABLE_METRIC_IDS } from '../../utils/formatters';

const METRICS = SELECTABLE_METRIC_IDS.map((id) => {
    const config = METRIC_CONFIG[id];
    return {
        id,
        label: config?.label ?? id,
        unit: config?.unit ?? '',
        description: config?.description ?? `${config?.label ?? id} measurement`
    };
});

const MetricsSection = ({ isDarkTheme, selectedMetric, onMetricChange }) => {
    return (
        <div className="flex flex-col gap-5">
            {/* Section Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(0,245,255,0.1)]">
                    <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="m-0 text-base font-display font-semibold text-foreground tracking-wide">Analysis Metric</h3>
                    <p className="m-0 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest opacity-80 mt-1">Data Layer Source</p>
                </div>
            </div>

            {/* Grid of Glass Cards */}
            <div className="grid grid-cols-2 gap-3">
                {METRICS.map(metric => {
                    const isActive = selectedMetric === metric.id;
                    return (
                        <div
                            key={metric.id}
                            onClick={() => onMetricChange(metric.id)}
                            className={cn(
                                "relative p-4 rounded-2xl cursor-pointer transition-all duration-300 group overflow-hidden border",
                                isActive
                                    ? "bg-primary/10 border-primary/50 shadow-[0_4px_20px_rgba(0,245,255,0.15)]"
                                    : isDarkTheme
                                        ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                                        : "bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/20"
                            )}
                        >
                            {/* Active Glow Background */}
                            {isActive && (
                                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-[20px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                            )}

                            {isActive && (
                                <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,245,255,1)]" />
                            )}

                            <h4 className={cn(
                                "m-0 font-display font-bold text-[13px] mb-1.5 tracking-tight relative z-10",
                                isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                            )}>
                                {metric.label}
                            </h4>

                            <p className="m-0 text-[11px] text-muted-foreground leading-relaxed mb-3 relative z-10 opacity-80 font-medium">
                                {metric.description}
                            </p>

                            <div className={cn(
                                "inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest relative z-10",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-muted text-muted-foreground border border-border/50"
                            )}>
                                {metric.unit}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default MetricsSection;
