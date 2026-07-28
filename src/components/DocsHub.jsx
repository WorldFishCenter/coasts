import { Link } from 'react-router-dom';
import {
  DATA_DICTIONARY_ROWS,
  EFFORT_PIPELINE_STEPS,
  EFFORT_READING_NOTES,
  GLOSSARY_TERMS,
  GROUNDS_VARIABLES,
  H3_EFFORT_GRID,
  H3_EFFORT_VARIABLES,
  LAYER_METADATA,
  METRIC_METADATA
} from '../utils/metricMetadata';

const Section = ({ id, title, intro, children }) => (
  <section id={id} className="glass-panel rounded-2xl p-5">
    <h2 className="text-lg font-semibold mb-1">{title}</h2>
    {intro && <p className="text-sm text-muted-foreground mt-0 mb-4 max-w-3xl">{intro}</p>}
    {children}
  </section>
);

const VariableTable = ({ rows }) => (
  <div className="overflow-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-left border-b border-border">
          <th className="py-2 pr-3 font-semibold whitespace-nowrap">Variable</th>
          <th className="py-2 pr-3 font-semibold whitespace-nowrap">Unit</th>
          <th className="py-2 font-semibold">What it means</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.field} className="border-b border-border/40 align-top">
            <td className="py-2 pr-3">
              <code className="text-xs">{row.field}</code>
              {row.shownAs && (
                <div className="text-[11px] text-muted-foreground mt-0.5">shown as “{row.shownAs}”</div>
              )}
            </td>
            <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{row.unit}</td>
            <td className="py-2">{row.definition}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DocsHub = () => {
  const metrics = Object.values(METRIC_METADATA);
  const effortLayer = LAYER_METADATA['pds-h3-effort-layer'];
  const groundsLayer = LAYER_METADATA['pds-fishing-grounds-layer'];
  const layers = Object.values(LAYER_METADATA);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Coasts Documentation</h1>
            <p className="text-sm text-muted-foreground mt-1">
              What each layer shows, how every number is produced, and how to avoid misreading it.
            </p>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline whitespace-nowrap">
            Back to map
          </Link>
        </div>

        <Section
          id="effort-grid"
          title="Fishing effort grid"
          intro={effortLayer.summary}
        >
          <div className="text-sm space-y-4">
            <p>
              The grid answers one question: where did tracked boats spend time with their gear in the
              water? Every figure comes from GPS positions that a classifier labelled as fishing, so
              the journey out, drifting near port and time ashore are already excluded rather than
              being something you need to filter out yourself.
            </p>
            <p>
              Positions are binned into hexagons at H3 resolution {H3_EFFORT_GRID.resolution} — about{' '}
              {H3_EFFORT_GRID.cellAreaKm2} km² each, {H3_EFFORT_GRID.widthLabel}. One record exists per
              cell per calendar year. Selecting a single year on the map shows that year’s record;
              selecting all years sums the hours, trips and active days for each cell and recomputes
              the averages from those totals, because averages cannot simply be added together.
            </p>
            <p>
              Cells with fewer than three trips are hidden. They are too thin to support a reading, and
              leaving them in would stretch the colour scale over noise.
            </p>

            <h3 className="text-base font-semibold mt-6 mb-2">Variables</h3>
            <VariableTable rows={H3_EFFORT_VARIABLES} />
          </div>
        </Section>

        <Section
          id="how-numbers-are-made"
          title="How the effort numbers are made"
          intro="Every variable in the grid rests on the same five steps."
        >
          <ol className="text-sm space-y-3 m-0 pl-5 list-decimal">
            {EFFORT_PIPELINE_STEPS.map((step) => (
              <li key={step.title}>
                <span className="font-semibold">{step.title}.</span>{' '}
                <span className="text-muted-foreground">{step.detail}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="fishing-grounds"
          title="Fishing grounds"
          intro={groundsLayer.summary}
        >
          <div className="text-sm space-y-4">
            <p>
              Grounds turn the grid into places. Years are pooled, cells that fall short of three trips
              or of the median cell’s fishing time are dropped, and what survives is merged into single
              shapes and split wherever the coverage is not contiguous. Each resulting polygon is one
              ground.
            </p>
            <p>
              Two consequences are worth holding on to. Because below-threshold cells are discarded,
              ground totals are smaller than grid totals over the same water. And because the ratio
              variables are averaged across a ground’s cells with equal weight rather than recomputed
              from its totals, a ground’s hours-per-day will not equal its fishing hours divided by its
              active days.
            </p>

            <h3 className="text-base font-semibold mt-6 mb-2">Variables</h3>
            <VariableTable rows={GROUNDS_VARIABLES} />
          </div>
        </Section>

        <Section
          id="reading-notes"
          title="Reading the effort layers"
          intro="The traps that most often produce a wrong conclusion."
        >
          <div className="text-sm space-y-3">
            {EFFORT_READING_NOTES.map((note) => (
              <div key={note.title}>
                <span className="font-semibold">{note.title}.</span>{' '}
                <span className="text-muted-foreground">{note.detail}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="layer-interpretation"
          title="Layers on the map"
          intro="What each layer draws, and how colour and height are assigned."
        >
          <div className="space-y-3 text-sm">
            {layers.map((layer) => (
              <div key={layer.id} className="border border-border/60 rounded-lg p-3">
                <div className="font-semibold">{layer.label}</div>
                <p className="m-0 mt-1">{layer.summary}</p>
                <p className="m-0 mt-1 text-muted-foreground">{layer.encoding}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="metric-definitions"
          title="Survey metric definitions"
          intro="Metrics behind the region choropleth, drawn from landing-site surveys rather than GPS tracks."
        >
          <div className="space-y-2 text-sm">
            {metrics.map((metric) => (
              <div key={metric.id} className="border border-border/60 rounded-lg p-3">
                <div className="font-semibold">
                  {metric.shortLabel || metric.displayLabel}
                  <span className="font-normal text-muted-foreground"> · {metric.unit}</span>
                </div>
                <p className="m-0 mt-1">{metric.formula}</p>
                <p className="m-0 mt-1 text-muted-foreground text-xs">
                  {metric.cadence ?? 'Unknown cadence'}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="methodology"
          title="From file to pixel"
          intro="What the app does to each dataset between loading it and drawing it."
        >
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3 font-semibold">Layer</th>
                  <th className="py-2 pr-3 font-semibold">Fields used</th>
                  <th className="py-2 font-semibold">Processing</th>
                </tr>
              </thead>
              <tbody>
                {DATA_DICTIONARY_ROWS.map((row) => (
                  <tr key={row.uiLabel} className="border-b border-border/40 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{row.uiLabel}</td>
                    <td className="py-2 pr-3"><code className="text-xs">{row.sourceField}</code></td>
                    <td className="py-2">{row.transform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="limitations" title="Known limitations">
          <ul className="text-sm list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">Coverage is partial.</span> Only vessels
              carrying a tracking device contribute. Blank water means no tracked fishing, which is not
              evidence that no fishing took place.
            </li>
            <li>
              <span className="text-foreground font-medium">Colour classes move.</span> Bins are
              quantiles of whatever is currently on screen, so a cell’s colour can change when you
              switch year, metric or admin level. Compare colours within one view, not across views.
            </li>
            <li>
              <span className="text-foreground font-medium">Column height is relative.</span> In 3D
              mode heights are scaled for visibility and differ per metric. Read them against each
              other, never as an absolute quantity.
            </li>
            <li>
              <span className="text-foreground font-medium">Ground identifiers are not stable.</span> A
              ground’s <code className="text-xs">FG_n</code> label can change between data refreshes as
              cells cross the inclusion thresholds.
            </li>
            <li>
              <span className="text-foreground font-medium">Some survey metrics are static.</span>
              {' '}Census counts of fishers and boats are snapshots and do not vary with the year filter.
            </li>
            <li>
              <span className="text-foreground font-medium">Effort and catch come from different
              sources.</span> The grid is GPS-derived; the choropleth metrics come from landing-site
              surveys. They cover overlapping but not identical fleets.
            </li>
          </ul>
        </Section>

        <Section id="glossary" title="Glossary">
          <dl className="space-y-2 text-sm m-0">
            {GLOSSARY_TERMS.map((entry) => (
              <div key={entry.term}>
                <dt className="font-semibold inline">{entry.term}: </dt>
                <dd className="inline m-0 text-muted-foreground">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="data-sources" title="Source files">
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>
              <span className="text-foreground">Effort grid</span> —{' '}
              <code className="text-xs">{effortLayer.source}</code>, refreshed from the tracking
              pipeline.
            </li>
            <li>
              <span className="text-foreground">Fishing grounds</span> —{' '}
              <code className="text-xs">{groundsLayer.source}</code>, derived from the effort grid.
            </li>
            <li>
              <span className="text-foreground">Survey metrics</span> —{' '}
              <code className="text-xs">ts_gaul1.json</code>,{' '}
              <code className="text-xs">ts_gaul2.json</code>.
            </li>
            <li>
              <span className="text-foreground">Administrative boundaries</span> —{' '}
              <code className="text-xs">map_gaul1.json</code>,{' '}
              <code className="text-xs">map_gaul2.json</code> (FAO GAUL).
            </li>
            <li>
              <span className="text-foreground">Bathymetry</span> —{' '}
              <code className="text-xs">bathymetry_contours_wio.geojson</code>.
            </li>
          </ul>
        </Section>
      </div>
    </div>
  );
};

export default DocsHub;
