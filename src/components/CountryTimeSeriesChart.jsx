import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Country average in teal, the chosen district in coral (the sheet's callout colour).
const AVERAGE_COLOR = 'var(--primary)';
const DISTRICT_COLOR = 'var(--coral)';

const formatMonth = (value, month = 'short') =>
    new Date(value).toLocaleDateString('en-GB', { month, year: 'numeric', timeZone: 'UTC' });

// Fixed decimals per magnitude so tick labels keep one width and never need a negative margin.
const formatTick = (value) => (Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1));

/**
 * Monthly lines, drawn straight between months: nothing is smoothed, and a month with no
 * survey stays a gap. `points` are { date, country, district } with district optional.
 */
const CountryTimeSeriesChart = ({
    points,
    unit,
    countryLabel = 'Country average',
    districtLabel = null,
    height = 300,
    showLegend = true,
    dashedCountry = false
}) => {
    if (!points?.length) {
        return (
            <div className="flex w-full items-center justify-center border-y border-border text-sm text-muted-foreground" style={{ height }}>
                No survey data in this period.
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="min-w-[200px] border border-border border-t-2 border-t-rule bg-card px-3 py-2 text-sm text-card-foreground">
                <p className="m-0 mb-1.5 font-serif font-semibold">{formatMonth(label, 'long')}</p>
                <div className="flex flex-col gap-1">
                    {payload.filter((entry) => entry.value != null).map((entry) => (
                        <div key={entry.dataKey} className="flex items-baseline justify-between gap-6">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <span className="inline-block h-0.5 w-3" style={{ backgroundColor: entry.color }} />
                                {entry.name}
                            </span>
                            <span className="font-semibold">
                                {entry.value.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            {showLegend && (
                <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                        {dashedCountry
                            ? <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: AVERAGE_COLOR }} />
                            : <span className="inline-block h-0.5 w-4" style={{ backgroundColor: AVERAGE_COLOR }} />}
                        {countryLabel}
                    </span>
                    {districtLabel && (
                        <span className="flex items-center gap-2">
                            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: DISTRICT_COLOR }} />
                            {districtLabel}
                        </span>
                    )}
                </div>
            )}
            <div className="w-full" style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(tick) => formatMonth(tick)}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--rule)' }}
                            tickLine={false}
                            minTickGap={40}
                        />
                        <YAxis
                            width={44}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatTick}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--input)' }} />
                        <Line
                            type="linear"
                            dataKey="country"
                            name={countryLabel}
                            stroke={AVERAGE_COLOR}
                            strokeWidth={dashedCountry ? 1.5 : 2.5}
                            strokeDasharray={dashedCountry ? '4 4' : undefined}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            isAnimationActive={false}
                        />
                        {districtLabel && (
                            <Line
                                type="linear"
                                dataKey="district"
                                name={districtLabel}
                                stroke={DISTRICT_COLOR}
                                strokeWidth={2.5}
                                dot={points.length < 24 ? { r: 2.5, strokeWidth: 0, fill: DISTRICT_COLOR } : false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                                isAnimationActive={false}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CountryTimeSeriesChart;
