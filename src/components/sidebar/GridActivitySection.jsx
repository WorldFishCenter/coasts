import { useMemo } from 'react';
import { ACTIVITY_METRICS, calculateH3Stats, calculateGroundsStats } from '../../utils/gridLayerConfig';
import { ACTIVITY_METRIC_METADATA, H3_EFFORT_GRID } from '../../utils/metricMetadata';

const LayerCheck = ({ checked, onChange, label, detail }) => (
    <label className="flex cursor-pointer items-baseline gap-2.5 text-[15px]">
        <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 translate-y-0.5 accent-[var(--primary)]" />
        <span>
            <span className="font-semibold">{label}</span>
            <span className="text-muted-foreground"> {detail}</span>
        </span>
    </label>
);

const FishingActivitySection = ({
    transformedH3Data,
    pdsFishingGroundsData,
    visualizationMode,
    onVisualizationModeChange,
    selectedActivityMetric,
    onActivityMetricChange,
    activeActivityLayers,
    onLayerToggle
}) => {
    const h3Stats = useMemo(() => calculateH3Stats(transformedH3Data), [transformedH3Data]);
    const groundsStats = useMemo(() => calculateGroundsStats(pdsFishingGroundsData), [pdsFishingGroundsData]);
    const activeMetricDocs = ACTIVITY_METRIC_METADATA[selectedActivityMetric] ?? {};

    return (
        <section aria-labelledby="gps-title" className="mt-8 border-t-2 border-rule pt-4">
            <h2 id="gps-title" className="m-0 text-xl font-semibold">Where tracked boats fish</h2>
            <p className="m-0 mt-1 text-[15px] text-muted-foreground">
                From GPS trackers on a sample of boats. Zoom in on the coast to see the cells.
            </p>

            <div className="mt-3 space-y-2">
                <LayerCheck
                    checked={activeActivityLayers?.hexagons !== false}
                    onChange={() => onLayerToggle('hexagons')}
                    label="Effort grid"
                    detail={`${h3Stats.activeCells.toLocaleString('en-US')} cells of ${H3_EFFORT_GRID.areaLabel}`}
                />
                <LayerCheck
                    checked={activeActivityLayers?.grounds !== false}
                    onChange={() => onLayerToggle('grounds')}
                    label="Fishing grounds"
                    detail={`${groundsStats.totalGrounds.toLocaleString('en-US')} areas`}
                />
            </div>

            <div className="mt-4 grid gap-y-1.5">
                <span className="mt-2 text-sm font-semibold text-muted-foreground first:mt-0">View</span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Effort grid view">
                    <button type="button" className="pill" aria-pressed={visualizationMode === 'column'} onClick={() => onVisualizationModeChange?.('column')}>
                        3D columns
                    </button>
                    <button type="button" className="pill" aria-pressed={visualizationMode === 'heatmap'} onClick={() => onVisualizationModeChange?.('heatmap')}>
                        Flat
                    </button>
                </div>
                <span className="mt-2 text-sm font-semibold text-muted-foreground first:mt-0">Measure</span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="GPS measure">
                    {ACTIVITY_METRICS.map((metric) => (
                        <button
                            key={metric.id}
                            type="button"
                            className="pill"
                            aria-pressed={selectedActivityMetric === metric.id}
                            onClick={() => onActivityMetricChange(metric.id)}
                        >
                            {metric.label}
                        </button>
                    ))}
                </div>
            </div>
            {activeMetricDocs.definition && (
                <p className="m-0 mt-2 text-[13px] leading-snug text-muted-foreground">
                    {activeMetricDocs.unit && <strong className="font-semibold text-foreground">{activeMetricDocs.unit}. </strong>}
                    {activeMetricDocs.definition}
                </p>
            )}
        </section>
    );
};

export default FishingActivitySection;
