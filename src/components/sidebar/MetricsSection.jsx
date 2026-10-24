import { getMetricInfo, isCensusMetric, SELECTABLE_METRIC_IDS } from '../../utils/formatters';

const FISHERS_VARIANTS = [
    { id: 'fishers_total', label: 'All' },
    { id: 'fishers_male', label: 'Men' },
    { id: 'fishers_female', label: 'Women' }
];

const YEARS = ['all', '2024', '2025', '2026'];

const Row = ({ label, children }) => (
    <div role="group" aria-label={label} className="contents">
        <span className="mt-2 text-sm font-semibold text-muted-foreground">{label}</span>
        <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
);

const Pill = ({ pressed, onClick, children }) => (
    <button type="button" className="pill" aria-pressed={pressed} onClick={onClick}>
        {children}
    </button>
);

const MetricsSection = ({
    selectedMetric,
    onMetricChange,
    selectedFishersMetric,
    onFishersMetricChange,
    selectedYear,
    onYearChange,
    gaulLevel,
    onGaulLevelChange,
    surveyPeriodLabel
}) => {
    const isPressed = (id) => {
        if (id === 'fishers') return selectedMetric.startsWith('fishers_');
        if (id === 'boats') return selectedMetric === 'boats_total';
        return selectedMetric === id;
    };
    const select = (id) => {
        if (id === 'fishers') return onMetricChange(selectedFishersMetric || 'fishers_total');
        if (id === 'boats') return onMetricChange('boats_total');
        return onMetricChange(id);
    };
    const info = getMetricInfo(selectedMetric);
    const census = isCensusMetric(selectedMetric);

    return (
        <div className="-mt-2 grid gap-y-1.5">
            <Row label="Shade by">
                {SELECTABLE_METRIC_IDS.map((id) => (
                    <Pill key={id} pressed={isPressed(id)} onClick={() => select(id)}>
                        {getMetricInfo(id).pillLabel ?? getMetricInfo(id).label}
                    </Pill>
                ))}
            </Row>
            {selectedMetric.startsWith('fishers_') && (
                <Row label="Fishers">
                    {FISHERS_VARIANTS.map((variant) => (
                        <Pill
                            key={variant.id}
                            pressed={selectedFishersMetric === variant.id}
                            onClick={() => onFishersMetricChange(variant.id)}
                        >
                            {variant.label}
                        </Pill>
                    ))}
                </Row>
            )}
            <p className="m-0 mt-1 text-[13px] leading-snug text-muted-foreground">
                <strong className="font-semibold text-foreground">{info.plainLabel ?? info.label}</strong>
                {census
                    ? ', from frame surveys (censuses). The year choice does not change it.'
                    : `${info.plainUnit ? `, ${info.plainUnit}` : ''}, from landing surveys, averaged over ${surveyPeriodLabel}.`}{' '}
                <a href="/docs#metric-definitions" className="font-semibold text-primary">Definition</a>
            </p>
            <Row label="Years">
                {YEARS.map((year) => (
                    <Pill key={year} pressed={selectedYear === year} onClick={() => onYearChange(year)}>
                        {year === 'all' ? 'All' : year}
                    </Pill>
                ))}
            </Row>
            {onGaulLevelChange && (
                <Row label="Areas">
                    <Pill pressed={gaulLevel === 'gaul2'} onClick={() => onGaulLevelChange('gaul2')}>Districts</Pill>
                    <Pill pressed={gaulLevel === 'gaul1'} onClick={() => onGaulLevelChange('gaul1')}>Provinces</Pill>
                </Row>
            )}
        </div>
    );
};

export default MetricsSection;
