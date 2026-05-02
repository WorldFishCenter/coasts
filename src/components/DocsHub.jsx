import { Link } from 'react-router-dom';
import { DATA_DICTIONARY_ROWS, GLOSSARY_TERMS, LAYER_METADATA, METRIC_METADATA } from '../utils/metricMetadata';

const Section = ({ id, title, children }) => (
  <section id={id} className="glass-panel rounded-2xl p-5">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    {children}
  </section>
);

const DocsHub = () => {
  const metrics = Object.values(METRIC_METADATA);
  const layers = Object.values(LAYER_METADATA);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Coasts Documentation Hub</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data sources, metric definitions, layer interpretation, and methodology.
            </p>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline">
            Back to map
          </Link>
        </div>

        <Section id="data-sources" title="Data Sources">
          <ul className="text-sm space-y-2">
            <li><strong>GAUL boundaries:</strong> <code>map_gaul1.json</code>, <code>map_gaul2.json</code></li>
            <li><strong>Time series metrics:</strong> <code>ts_gaul1.json</code>, <code>ts_gaul2.json</code></li>
            <li><strong>PDS H3 activity:</strong> <code>pds-h3-effort-r9.json</code></li>
            <li><strong>PDS fishing grounds:</strong> <code>pds-fishing-grounds.geojson</code></li>
            <li><strong>Bathymetry:</strong> <code>bathymetry_contours_wio.geojson</code></li>
          </ul>
        </Section>

        <Section id="metric-definitions" title="Metric Definitions">
          <div className="space-y-2 text-sm">
            {metrics.map((metric) => (
              <div key={metric.id} className="border border-border/60 rounded-lg p-3">
                <div className="font-semibold">{metric.shortLabel || metric.displayLabel}</div>
                <div>Unit: {metric.unit}</div>
                <div>Source field: <code>{metric.sourceField}</code></div>
                <div>Cadence: {metric.cadence ?? 'Unknown cadence'}</div>
                <div className="text-muted-foreground">{metric.formula}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="layer-interpretation" title="Layer Interpretation Guide">
          <div className="space-y-2 text-sm">
            {layers.map((layer) => (
              <div key={layer.id} className="border border-border/60 rounded-lg p-3">
                <div className="font-semibold">{layer.label}</div>
                <div>Source: {layer.source}</div>
                <div className="text-muted-foreground">{layer.encoding}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="methodology" title="Methodology / Calculations">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3">UI label</th>
                  <th className="py-2 pr-3">Source field</th>
                  <th className="py-2 pr-3">Transformation</th>
                </tr>
              </thead>
              <tbody>
                {DATA_DICTIONARY_ROWS.map((row) => (
                  <tr key={row.uiLabel} className="border-b border-border/40 align-top">
                    <td className="py-2 pr-3">{row.uiLabel}</td>
                    <td className="py-2 pr-3"><code>{row.sourceField}</code></td>
                    <td className="py-2 pr-3">{row.transform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="limitations" title="Known Limitations and Caveats">
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>Quantile bins depend on current filtered data, so color boundaries can shift with filters.</li>
            <li>Some static census metrics are not year-specific and remain constant across date selection.</li>
            <li>Bathymetry labels are shown only at higher zoom to preserve readability.</li>
          </ul>
        </Section>

        <Section id="glossary" title="Glossary">
          <div className="space-y-2 text-sm">
            {GLOSSARY_TERMS.map((entry) => (
              <div key={entry.term}>
                <strong>{entry.term}:</strong> {entry.definition}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default DocsHub;
