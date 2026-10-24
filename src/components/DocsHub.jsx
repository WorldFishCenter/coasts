import Header from './Header';
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
  <section id={id} className="scroll-mt-6 border-t-2 border-rule pt-5">
    <h2 className="m-0 mb-2 text-2xl font-semibold">{title}</h2>
    {intro && <p className="m-0 mb-5 max-w-[70ch] font-serif text-lg italic text-pretty text-muted-foreground">{intro}</p>}
    {children}
  </section>
);

// The sections in reading order, for the contents list.
const CONTENTS = [
  ['effort-grid', 'Fishing effort grid'],
  ['how-numbers-are-made', 'How the effort numbers are made'],
  ['fishing-grounds', 'Fishing grounds'],
  ['reading-notes', 'Reading the effort layers'],
  ['layer-interpretation', 'Layers on the map'],
  ['metric-definitions', 'Survey metric definitions'],
  ['methodology', 'From file to pixel'],
  ['limitations', 'Known limitations'],
  ['glossary', 'Glossary'],
  ['data-sources', 'Source files']
];

const Code = ({ children }) => <code className="font-mono text-[13px]">{children}</code>;

const VariableTable = ({ rows }) => (
  <div className="overflow-auto">
    <table className="min-w-full border-collapse text-[15px]">
      <thead>
        <tr className="border-b border-rule text-left text-sm">
          <th className="py-2 pr-4 font-semibold whitespace-nowrap">Variable</th>
          <th className="py-2 pr-4 font-semibold whitespace-nowrap">Unit</th>
          <th className="py-2 font-semibold">What it means</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.field} className="border-b border-border align-top">
            <td className="py-2.5 pr-4">
              <Code>{row.field}</Code>
              {row.shownAs && (
                <div className="mt-0.5 text-sm text-muted-foreground">shown as “{row.shownAs}”</div>
              )}
            </td>
            <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">{row.unit}</td>
            <td className="py-2.5">{row.definition}</td>
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
      <Header />
      <div className="mx-auto flex max-w-6xl gap-12 px-6 py-10">
        <nav aria-label="Contents" className="sticky top-10 hidden w-56 flex-none self-start lg:block">
          <h2 className="m-0 mb-3 text-base font-semibold">Contents</h2>
          <ol className="m-0 list-none space-y-1.5 border-l border-border p-0 pl-4 text-sm">
            {CONTENTS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-muted-foreground no-underline hover:text-foreground hover:underline">{label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="flex min-w-0 max-w-[52rem] flex-1 flex-col gap-12 text-base leading-relaxed">
        <div>
          <h1 className="m-0 text-4xl font-semibold">Methods and data dictionary</h1>
          <p className="m-0 mt-2 max-w-[70ch] font-serif text-xl italic text-pretty text-muted-foreground">
            What each layer shows, how every number is produced, and how to avoid misreading it.
          </p>
        </div>

        <Section
          id="effort-grid"
          title="Fishing effort grid"
          intro={effortLayer.summary}
        >
          <div className="space-y-4 [&>p]:max-w-[70ch]">
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

            <h3 className="m-0 mt-8 mb-2 text-lg font-semibold">Variables</h3>
            <VariableTable rows={H3_EFFORT_VARIABLES} />
          </div>
        </Section>

        <Section
          id="how-numbers-are-made"
          title="How the effort numbers are made"
          intro="Every variable in the grid rests on the same five steps."
        >
          <ol className="m-0 max-w-[70ch] list-decimal space-y-3 pl-5">
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
          <div className="space-y-4 [&>p]:max-w-[70ch]">
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

            <h3 className="m-0 mt-8 mb-2 text-lg font-semibold">Variables</h3>
            <VariableTable rows={GROUNDS_VARIABLES} />
          </div>
        </Section>

        <Section
          id="reading-notes"
          title="Reading the effort layers"
          intro="The traps that most often produce a wrong conclusion."
        >
          <div className="max-w-[70ch] space-y-3">
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
          <dl className="m-0 max-w-[70ch]">
            {layers.map((layer) => (
              <div key={layer.id} className="border-b border-border py-3 first:pt-0">
                <dt className="font-semibold">{layer.label}</dt>
                <dd className="m-0 mt-1">{layer.summary}</dd>
                <dd className="m-0 mt-1 text-muted-foreground">{layer.encoding}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section
          id="metric-definitions"
          title="Survey metric definitions"
          intro="Metrics behind the region choropleth, drawn from landing-site surveys rather than GPS tracks."
        >
          <dl className="m-0 max-w-[70ch]">
            {metrics.map((metric) => (
              <div key={metric.id} className="border-b border-border py-3 first:pt-0">
                <dt className="font-semibold">
                  {metric.shortLabel || metric.displayLabel}
                  <span className="font-normal text-muted-foreground"> · {metric.unit}</span>
                </dt>
                <dd className="m-0 mt-1">{metric.formula}</dd>
                <dd className="m-0 mt-1 text-sm text-muted-foreground">
                  {metric.cadence ?? 'Unknown cadence'}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section
          id="methodology"
          title="From file to pixel"
          intro="What the app does to each dataset between loading it and drawing it."
        >
          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-[15px]">
              <thead>
                <tr className="border-b border-rule text-left text-sm">
                  <th className="py-2 pr-4 font-semibold">Layer</th>
                  <th className="py-2 pr-4 font-semibold">Fields used</th>
                  <th className="py-2 font-semibold">Processing</th>
                </tr>
              </thead>
              <tbody>
                {DATA_DICTIONARY_ROWS.map((row) => (
                  <tr key={row.uiLabel} className="border-b border-border align-top">
                    <td className="py-2.5 pr-4 whitespace-nowrap">{row.uiLabel}</td>
                    <td className="py-2.5 pr-4"><Code>{row.sourceField}</Code></td>
                    <td className="py-2.5">{row.transform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="limitations" title="Known limitations">
          <ul className="m-0 max-w-[70ch] list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">Coverage is partial.</span> Only vessels
              carrying a tracking device contribute. Blank water means no tracked fishing, which is not
              evidence that no fishing took place.
            </li>
            <li>
              <span className="font-semibold text-foreground">Colour classes move.</span> Bins are
              quantiles of whatever is currently on screen, so a cell’s colour can change when you
              switch year, metric or admin level. Compare colours within one view, not across views.
            </li>
            <li>
              <span className="font-semibold text-foreground">Column height is relative.</span> In 3D
              mode heights are scaled for visibility and differ per metric. Read them against each
              other, never as an absolute quantity.
            </li>
            <li>
              <span className="font-semibold text-foreground">Ground identifiers are not stable.</span> A
              ground’s <Code>FG_n</Code> label can change between data refreshes as
              cells cross the inclusion thresholds.
            </li>
            <li>
              <span className="font-semibold text-foreground">Some survey metrics are static.</span>
              {' '}Census counts of fishers and boats are snapshots and do not vary with the year filter.
            </li>
            <li>
              <span className="font-semibold text-foreground">Effort and catch come from different
              sources.</span> The grid is GPS-derived; the choropleth metrics come from landing-site
              surveys. They cover overlapping but not identical fleets.
            </li>
          </ul>
        </Section>

        <Section id="glossary" title="Glossary">
          <dl className="m-0 max-w-[70ch] space-y-2">
            {GLOSSARY_TERMS.map((entry) => (
              <div key={entry.term}>
                <dt className="font-semibold inline">{entry.term}: </dt>
                <dd className="inline m-0 text-muted-foreground">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="data-sources" title="Source files">
          <ul className="m-0 max-w-[70ch] list-none space-y-2 p-0 text-muted-foreground">
            <li>
              <span className="text-foreground">Effort grid</span> —{' '}
              <Code>{effortLayer.source}</Code>, refreshed from the tracking
              pipeline.
            </li>
            <li>
              <span className="text-foreground">Fishing grounds</span> —{' '}
              <Code>{groundsLayer.source}</Code>, derived from the effort grid.
            </li>
            <li>
              <span className="text-foreground">Survey metrics</span> —{' '}
              <Code>ts_gaul1.json</Code>,{' '}
              <Code>ts_gaul2.json</Code>.
            </li>
            <li>
              <span className="text-foreground">Administrative boundaries</span> —{' '}
              <Code>map_gaul1.json</Code>,{' '}
              <Code>map_gaul2.json</Code> (FAO GAUL).
            </li>
            <li>
              <span className="text-foreground">Bathymetry</span> —{' '}
              <Code>bathymetry_contours_wio.geojson</Code>.
            </li>
          </ul>
        </Section>
        </main>
      </div>
    </div>
  );
};

export default DocsHub;
