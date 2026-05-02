import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_DICTIONARY_ROWS, LAYER_METADATA, METRIC_METADATA, TOOLTIP_FIELD_ORDER } from '../../src/utils/metricMetadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const fail = (message) => {
  throw new Error(`Clarity guardrail failed: ${message}`);
};

const checkMetricMetadata = () => {
  const metrics = Object.values(METRIC_METADATA);
  if (!metrics.length) fail('No metric metadata defined');
  metrics.forEach((metric) => {
    if (!metric.id || !metric.unit || !metric.sourceField || !metric.formula) {
      fail(`Incomplete metric metadata for ${metric.id}`);
    }
    if (typeof metric.format !== 'function') {
      fail(`Missing format function for ${metric.id}`);
    }
  });
};

const checkTooltipCoverage = () => {
  const requiredLayerIds = ['wio-regions', 'pds-h3-effort-layer', 'pds-fishing-grounds-layer'];
  requiredLayerIds.forEach((layerId) => {
    if (!TOOLTIP_FIELD_ORDER[layerId]) {
      fail(`Missing tooltip field order for layer ${layerId}`);
    }
  });
};

const checkLegendAndDocsLinks = () => {
  const docsPath = path.join(repoRoot, 'src/components/DocsHub.jsx');
  const legendPath = path.join(repoRoot, 'src/components/map/EnhancedLegend.jsx');
  const mapClarityPath = path.join(repoRoot, 'src/components/map/MapClarityPanel.jsx');

  const docsFile = fs.readFileSync(docsPath, 'utf8');
  ['id="data-sources"', 'id="metric-definitions"', 'id="layer-interpretation"', 'id="methodology"', 'id="limitations"']
    .forEach((anchor) => {
      if (!docsFile.includes(anchor)) fail(`Missing docs anchor ${anchor}`);
    });

  const legendFile = fs.readFileSync(legendPath, 'utf8');
  if (!legendFile.includes('/docs#layer-interpretation')) {
    fail('Legend is not linked to docs hub anchor');
  }

  const clarityPanelFile = fs.readFileSync(mapClarityPath, 'utf8');
  if (!clarityPanelFile.includes('/docs#layer-interpretation')) {
    fail('Map clarity panel is not linked to docs hub anchor');
  }
};

const checkDataDictionaryRows = () => {
  if (!DATA_DICTIONARY_ROWS.length) fail('No data dictionary rows defined');
  const hasGlobal = DATA_DICTIONARY_ROWS.some((row) => row.uiLabel === 'Global Map metric legend');
  const hasH3 = DATA_DICTIONARY_ROWS.some((row) => row.uiLabel === 'Local Fishing Activity');
  const hasGrounds = DATA_DICTIONARY_ROWS.some((row) => row.uiLabel === 'Fishing Grounds');
  const hasBath = DATA_DICTIONARY_ROWS.some((row) => row.uiLabel.includes('Bathymetry'));
  if (!hasGlobal || !hasH3 || !hasGrounds || !hasBath) {
    fail('Data dictionary is missing required map layer mappings');
  }

  const layerCount = Object.values(LAYER_METADATA).length;
  if (layerCount < 4) fail('Layer metadata is incomplete');
};

checkMetricMetadata();
checkTooltipCoverage();
checkLegendAndDocsLinks();
checkDataDictionaryRows();
console.log('Clarity guardrails passed.');
