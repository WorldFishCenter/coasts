import { BarChart3, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getMetricInfo, SELECTABLE_METRIC_IDS } from '../../utils/formatters';

const METRICS = SELECTABLE_METRIC_IDS.map((id) => {
    const config = getMetricInfo(id);
    return {
        id,
        label: config?.label ?? id,
        unit: config?.unit ?? '',
        description: config?.description ?? 'Metric'
    };
});

const FISHERY_METRIC_IDS = ['mean_cpue', 'mean_rpue', 'mean_price_kg'];
const FRAME_METRIC_IDS = ['fishers', 'boats'];

const FISHERS_VARIANTS = [
    { id: 'fishers_total', label: 'Total' },
    { id: 'fishers_male', label: 'Male' },
    { id: 'fishers_female', label: 'Female' }
];

const MetricsSection = ({
    isDarkTheme,
    selectedMetric,
    onMetricChange,
    selectedFishersMetric,
    onFishersMetricChange
}) => {
    const fisheryMetrics = METRICS.filter((metric) => FISHERY_METRIC_IDS.includes(metric.id));
    const frameMetrics = METRICS.filter((metric) => FRAME_METRIC_IDS.includes(metric.id));

    const renderMetricCard = (metric, compact = false) => {
        const isFishersCard = metric.id === 'fishers';
        const isBoatsCard = metric.id === 'boats';
        const isActive = isFishersCard
            ? selectedMetric.startsWith('fishers_')
            : isBoatsCard
                ? selectedMetric === 'boats_total'
                : selectedMetric === metric.id;

        const handleMetricSelect = () => {
            if (isFishersCard) {
                onMetricChange(selectedFishersMetric || 'fishers_total');
                return;
            }
            if (isBoatsCard) {
                onMetricChange('boats_total');
                return;
            }
            onMetricChange(metric.id);
        };

        return (
            <button
                key={metric.id}
                onClick={handleMetricSelect}
                className={cn(
                    "relative text-left p-4 rounded-2xl transition-all duration-300 group overflow-hidden border",
                    compact ? "min-h-[104px]" : "min-h-[120px]",
                    isActive
                        ? "bg-primary/10 border-primary/50 shadow-[0_4px_20px_rgba(0,245,255,0.15)]"
                        : isDarkTheme
                            ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                            : "bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/20"
                )}
            >
                {isActive && (
                    <>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-[20px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,245,255,1)]" />
                    </>
                )}

                <h4 className={cn(
                    "m-0 font-display font-bold text-[13px] mb-1.5 tracking-tight relative z-10",
                    isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                )}>
                    {metric.label}
                </h4>

                <p className="m-0 text-[11px] text-muted-foreground leading-relaxed mb-2 relative z-10 opacity-80 font-medium line-clamp-1">
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
            </button>
        );
    };

    const renderFisheryMetricButton = (metric) => {
        const isActive = selectedMetric === metric.id;
        return (
            <button
                key={metric.id}
                onClick={() => onMetricChange(metric.id)}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-200",
                    isActive
                        ? "bg-primary/10 border-primary/50 shadow-[0_2px_12px_rgba(0,245,255,0.12)]"
                        : isDarkTheme
                            ? "bg-white/5 border-white/10 hover:bg-white/10"
                            : "bg-black/5 border-black/10 hover:bg-black/10"
                )}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        isActive ? "bg-primary" : "bg-muted-foreground/40"
                    )} />
                    <span className={cn(
                        "text-[12px] font-semibold tracking-wide truncate",
                        isActive ? "text-primary" : "text-foreground"
                    )}>
                        {metric.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                        {metric.description}
                    </span>
                </div>
                <span className={cn(
                    "ml-2 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border shrink-0",
                    isActive
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-muted text-muted-foreground border-border/50"
                )}>
                    {metric.unit}
                </span>
            </button>
        );
    };

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

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-80">
                            Fisheries Performance
                        </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border border-border/50 text-muted-foreground">
                        Time Series
                    </span>
                </div>
                <div className="space-y-2">
                    {fisheryMetrics.map((metric) => renderFisheryMetricButton(metric))}
                </div>
            </div>

            <div className="w-full h-px bg-border/50" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-80">
                            Fleet & Workforce
                        </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border border-border/50 text-muted-foreground">
                        Static Census
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {frameMetrics.map((metric) => renderMetricCard(metric, true))}
                </div>

                {selectedMetric.startsWith('fishers_') && (
                    <div className={cn(
                        "rounded-xl border p-3 space-y-2",
                        isDarkTheme ? "bg-white/[0.04] border-white/10" : "bg-black/[0.03] border-black/10"
                    )}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                Workforce Split
                            </span>
                            <Users className="w-3.5 h-3.5 text-primary/80" />
                        </div>

                        <div className={cn(
                            "p-1 flex gap-1 rounded-lg border",
                            isDarkTheme ? "bg-black/30 border-white/10" : "bg-white border-black/10"
                        )}>
                            {FISHERS_VARIANTS.map((variant) => (
                                <button
                                    key={variant.id}
                                    onClick={() => onFishersMetricChange(variant.id)}
                                    className={cn(
                                        "flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors",
                                        selectedFishersMetric === variant.id
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {variant.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricsSection;
