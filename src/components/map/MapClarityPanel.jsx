import { useEffect, useRef, useState } from 'react';
import { Info, ExternalLink, X } from 'lucide-react';
import {
  ACTIVITY_METRIC_METADATA,
  H3_EFFORT_GRID,
  LAYER_METADATA,
  isRatioActivityField
} from '../../utils/metricMetadata';
import { PDS_MIN_UNIQUE_TRIPS } from '../../utils/pdsOverlayConfig';

const MapClarityPanel = ({
  selectedActivityMetric,
  showBathymetry,
  h3Records,
  groundsFeatures,
  yearScope = { isAllYears: true, label: 'all years' },
  visualizationMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const mutedClass = 'text-muted-foreground';
  const bodyClass = 'text-foreground';
  const activeMetric = ACTIVITY_METRIC_METADATA[selectedActivityMetric] ?? {};
  const activeMetricLabel = activeMetric.label ?? selectedActivityMetric;
  const layers = [
    LAYER_METADATA['pds-h3-effort-layer'],
    LAYER_METADATA['pds-fishing-grounds-layer'],
    ...(showBathymetry ? [LAYER_METADATA.bathymetry] : [])
  ].filter(Boolean);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="map-button"
        aria-pressed={isOpen}
        aria-expanded={isOpen}
        aria-label="Layer details"
        title="Layer details"
      >
        <Info size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="plate absolute left-12 top-0 z-[1001] max-h-[calc(100vh-9rem)] w-[340px] space-y-3 overflow-y-auto px-4 pb-4 pt-3 text-[13px] leading-relaxed">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-base font-semibold">Layer details</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Close layer details"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">
              GPS trackers: {activeMetricLabel}
              {activeMetric.unit ? <span className={`font-normal ${mutedClass}`}> · {activeMetric.unit}</span> : null}
            </div>
            {activeMetric.definition && (
              <p className={`m-0 leading-relaxed ${bodyClass}`}>{activeMetric.definition}</p>
            )}
          </div>

          <div className={`space-y-1 leading-relaxed ${bodyClass}`}>
            <div>
              <span className={mutedClass}>Period on view:</span> <strong>{yearScope.label}</strong>
              {yearScope.isAllYears && (
                <span className={mutedClass}>
                  {' '}— each cell’s hours, trips and active days are summed, then the averages are
                  recalculated from those totals.
                </span>
              )}
            </div>
            <div>
              <span className={mutedClass}>Cell size:</span> H3 resolution {H3_EFFORT_GRID.resolution},{' '}
              {H3_EFFORT_GRID.areaLabel} ({H3_EFFORT_GRID.widthLabel})
            </div>
            <div>
              <span className={mutedClass}>Shown:</span> {h3Records.toLocaleString()} cells,{' '}
              {groundsFeatures.toLocaleString()} grounds — cells with fewer than {PDS_MIN_UNIQUE_TRIPS} trips
              are hidden as too sparse to read.
            </div>
            {visualizationMode === 'column' && (
              <div>
                <span className={mutedClass}>Column height:</span> the same value as the colour, scaled
                for visibility — compare columns to each other, not to an axis.
              </div>
            )}
          </div>

          <div className="space-y-2">
            {layers.map((layer) => (
              <div key={layer.id}>
                <div className="font-semibold">{layer.label}</div>
                <p className={`m-0 leading-relaxed ${bodyClass}`}>{layer.summary}</p>
              </div>
            ))}
          </div>

          {isRatioActivityField(selectedActivityMetric) && groundsFeatures > 0 && (
            <p className={`m-0 leading-relaxed ${mutedClass}`}>
              On grounds, {activeMetricLabel} is the average across the ground’s cells, so it will not
              match a calculation from the ground’s own totals.
            </p>
          )}

          <p className={`m-0 leading-relaxed ${mutedClass}`}>
            Only vessels carrying a tracking device appear here, and only positions classified as
            fishing. Empty water means no tracked fishing, not no fishing.
          </p>

          <a href="/docs#effort-grid" className="inline-flex items-center gap-1 font-semibold text-primary">
            Full data dictionary
            <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
};

export default MapClarityPanel;
