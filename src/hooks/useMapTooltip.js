import { useCallback } from 'react';
import { formatRegionName, formatCountryName, formatFigure, getMetricInfo, isCensusMetric } from '../utils/formatters';
import { ACTIVITY_METRIC_METADATA, H3_EFFORT_GRID, isRatioActivityField } from '../utils/metricMetadata';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Tooltips are small plates: white sheet, ink rule on top, serif name, the figure in teal.
const PLATE_STYLE = {
  backgroundColor: 'var(--card)',
  color: 'var(--card-foreground)',
  border: '1px solid var(--border)',
  borderTop: '2px solid var(--rule)',
  padding: '10px 12px',
  maxWidth: '280px',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  lineHeight: '1.4',
  fontVariantNumeric: 'tabular-nums'
};

const title = (name, place) => `
  <div style="font-family:var(--font-serif); font-size:18px; font-weight:600">${escapeHtml(name)}</div>
  ${place ? `<div style="font-family:var(--font-serif); font-style:italic; color:var(--muted-foreground)">${escapeHtml(place)}</div>` : ''}`;

const figure = (number, unit, per) => `
  <div style="margin-top:6px; color:var(--primary); font-size:22px; font-weight:700; line-height:1.2">
    ${escapeHtml(number)} <span style="font-size:13px; font-weight:600">${escapeHtml(unit)}</span>
    ${per ? `<span style="font-size:13px; font-weight:400; color:var(--muted-foreground)"> ${escapeHtml(per)}</span>` : ''}
  </div>`;

const note = (text) =>
  `<div style="margin-top:6px; padding-top:6px; border-top:1px solid var(--border); color:var(--muted-foreground)">${text}</div>`;

const row = (label, value) =>
  `<div style="display:flex; justify-content:space-between; gap:12px"><span style="color:var(--muted-foreground)">${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;

export const useMapTooltip = ({
  selectedMetric,
  selectedActivityMetric = 'fishing_hours',
  surveyPeriodLabel = 'all years',
  yearScopeLabel = 'all years'
}) => {
  return useCallback(({ object, layer }) => {
    if (!object) return null;
    const activityDocs = ACTIVITY_METRIC_METADATA[selectedActivityMetric] ?? {};
    const activityLabel = activityDocs.label ?? selectedActivityMetric;
    const formatActivityValue = (value) => {
      if (value === null || value === undefined || Number.isNaN(Number(value))) return 'no value';
      return activityDocs.format ? activityDocs.format(Number(value)) : Number(value).toFixed(2);
    };

    if (layer.id === 'wio-regions') {
      const props = object.properties;
      const place = [props.gaul2_name ? props.gaul1_name : null, formatCountryName(props.country)]
        .filter(Boolean)
        .join(', ');
      const value = formatFigure(selectedMetric, props[selectedMetric]);
      const census = isCensusMetric(selectedMetric);
      const body = value
        ? figure(value.number, value.unit, value.per)
        : `<div style="margin-top:6px; color:var(--muted-foreground)">No ${census ? 'census' : 'survey'} data for ${escapeHtml(getMetricInfo(selectedMetric).plainLabel?.toLowerCase() ?? 'this figure')}</div>`;
      const fishersRows = selectedMetric.startsWith('fishers_') && props.fishers_total != null
        ? `<div style="margin-top:4px">${row('Men', formatFigure('fishers_male', props.fishers_male)?.number ?? '–')}${row('Women', formatFigure('fishers_female', props.fishers_female)?.number ?? '–')}</div>`
        : '';
      const source = census
        ? 'Frame survey (census), not filtered by year'
        : `Landing surveys, average for ${escapeHtml(surveyPeriodLabel)}`;
      return {
        html: `${title(formatRegionName(props), place)}${body}${fishersRows}${note(`${source}<br>Click to open the district sheet`)}`,
        style: PLATE_STYLE
      };
    }

    if (layer.id === 'pds-fishing-grounds-layer') {
      const props = object.properties || {};
      const rows = [
        row('Area', `${Number(props.area_km2 ?? 0).toFixed(2)} km²`),
        selectedActivityMetric !== 'fishing_hours'
          ? row('Fishing hours', `${Number(props.fishing_hours ?? 0).toLocaleString('en-US', { maximumFractionDigits: 1 })} vessel-h`)
          : '',
        selectedActivityMetric !== 'unique_trips' ? row('Cell visits', Number(props.unique_trips ?? 0).toLocaleString('en-US')) : '',
        row('Active days', Number(props.n_active_days ?? 0).toLocaleString('en-US'))
      ].join('');
      const groundNote = isRatioActivityField(selectedActivityMetric)
        ? `${escapeHtml(activityLabel)} is averaged across this ground’s cells, not derived from its totals.`
        : 'Cell visits count a trip once per cell it crossed, so they exceed the number of distinct trips.';
      return {
        html: `${title('Fishing ground', ['All years', props.country ? formatCountryName(props.country) : null].filter(Boolean).join(', '))}
          <div style="margin:6px 0 4px">${escapeHtml(activityLabel)}: <strong>${formatActivityValue(props[selectedActivityMetric])}</strong></div>
          ${rows}${note(`GPS trackers. ${groundNote}`)}`,
        style: PLATE_STYLE
      };
    }

    if (layer.id === 'pds-h3-effort-layer') {
      const rows = [
        selectedActivityMetric !== 'fishing_hours'
          ? row('Fishing hours', `${Number(object.fishing_hours ?? 0).toLocaleString('en-US', { maximumFractionDigits: 1 })} vessel-h`)
          : '',
        selectedActivityMetric !== 'unique_trips' ? row('Trips', Number(object.unique_trips ?? 0).toLocaleString('en-US')) : '',
        row('Active days', Number(object.n_active_days ?? 0).toLocaleString('en-US'))
      ].join('');
      return {
        html: `${title('Fishing effort cell', `${H3_EFFORT_GRID.areaLabel}, ${yearScopeLabel}`)}
          <div style="margin:6px 0 4px">${escapeHtml(activityLabel)}: <strong>${formatActivityValue(object[selectedActivityMetric])}</strong></div>
          ${rows}${note('GPS trackers. Hours are summed across boats, so one day can exceed 24.')}`,
        style: PLATE_STYLE
      };
    }

    return null;
  }, [selectedMetric, selectedActivityMetric, surveyPeriodLabel, yearScopeLabel]);
};
