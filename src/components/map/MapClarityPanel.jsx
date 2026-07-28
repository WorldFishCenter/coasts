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
  isDarkTheme,
  selectedActivityMetric,
  showBathymetry,
  h3Records,
  groundsFeatures,
  yearScope = { isAllYears: true, label: 'all years' },
  visualizationMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const mutedClass = isDarkTheme ? 'text-white/60' : 'text-black/55';
  const bodyClass = isDarkTheme ? 'text-white/75' : 'text-black/70';
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
        className="w-12 h-12 p-2 glass-panel rounded-xl z-[1000] flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 group cursor-pointer"
        aria-label="Show layer and metric details"
        title="Layer details"
      >
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
        <Info size={22} strokeWidth={2} className="text-foreground/75 group-hover:text-primary transition-colors relative z-10" />
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 glass-panel rounded-xl p-3.5 w-[340px] text-xs space-y-3 z-[1001] max-h-[calc(100vh-9rem)] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-[13px]">
              <Info size={14} className="text-primary" />
              Layer details
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 hover:bg-white/10 transition-colors"
              aria-label="Close layer details"
            >
              <X size={12} />
            </button>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">
              {activeMetricLabel}
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

          <a href="/docs#effort-grid" className="text-primary hover:underline inline-flex items-center gap-1">
            Full data dictionary
            <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
};

export default MapClarityPanel;
