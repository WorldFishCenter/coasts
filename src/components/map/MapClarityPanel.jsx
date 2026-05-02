import { useEffect, useRef, useState } from 'react';
import { HelpCircle, ExternalLink, X } from 'lucide-react';
import { ACTIVITY_METRIC_METADATA, LAYER_METADATA } from '../../utils/metricMetadata';

const MapClarityPanel = ({
  isDarkTheme,
  selectedActivityMetric,
  showBathymetry,
  h3Records,
  groundsFeatures
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const rowClass = isDarkTheme ? 'text-white/75' : 'text-black/70';
  const selectedActivityLabel = ACTIVITY_METRIC_METADATA[selectedActivityMetric]?.label ?? selectedActivityMetric;
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
        aria-label="Open map interpretation help"
        title="What am I seeing?"
      >
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
        <HelpCircle size={22} strokeWidth={2} className="text-foreground/75 group-hover:text-primary transition-colors relative z-10" />
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 glass-panel rounded-xl p-3 w-[320px] text-xs space-y-2 z-[1001]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <HelpCircle size={14} className="text-primary" />
              What am I seeing?
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 hover:bg-white/10 transition-colors"
              aria-label="Close map interpretation help"
            >
              <X size={12} />
            </button>
          </div>
          <div className={rowClass}>Activity metric: <strong>{selectedActivityLabel}</strong> (quantile colors)</div>
          <div className={rowClass}>Data as of: <strong>latest synced static export</strong></div>
          <div className={rowClass}>H3 cells: <strong>{h3Records.toLocaleString()}</strong> | Grounds: <strong>{groundsFeatures.toLocaleString()}</strong></div>
          <ul className="space-y-1">
            {layers.map((layer) => (
              <li key={layer.id} className={rowClass}>
                <strong>{layer.label}:</strong> {layer.encoding}
              </li>
            ))}
          </ul>
          <a href="/docs#layer-interpretation" className="text-primary hover:underline inline-flex items-center gap-1">
            Open layer guide
            <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
};

export default MapClarityPanel;
