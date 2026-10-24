import { memo } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { version } from '../../package.json';

import MetricsSection from './sidebar/MetricsSection';
import FishingActivitySection from './sidebar/GridActivitySection';
import { CoverageSheet, DistrictSheet } from './sidebar/DistrictSheet';

const Sidebar = memo(({
  isDarkTheme,
  isMobile,
  isOpen,
  onClose,
  selectedMetric,
  onMetricChange,
  selectedFishersMetric,
  onFishersMetricChange,
  transformedH3Data,
  pdsFishingGroundsData,
  selectedYear,
  onYearChange,
  selectedActivityMetric,
  onActivityMetricChange,
  activeActivityLayers,
  onLayerToggle,
  gaulLevel = 'gaul2',
  onGaulLevelChange,
  visualizationMode,
  onVisualizationModeChange,
  surveyPeriodLabel,
  dataFreshnessLabel,
  coverage,
  onShowCountry,
  onHoverCountry,
  selectedFeature,
  onCloseSheet,
  boundaries,
  timeSeriesData,
  frameGearsRows
}) => (
  <aside
    aria-label="Figures and districts"
    className={cn(
      'z-40 flex h-full min-h-0 flex-none flex-col border-r border-border bg-background',
      isMobile ? 'absolute inset-0 z-[1100] w-full' : 'relative w-[420px]',
      !isOpen && 'hidden'
    )}
  >
    {isMobile && (
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-serif text-lg font-semibold">Figures and districts</span>
        <button onClick={onClose} className="rounded p-1" aria-label="Back to the map">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    )}
    <SimpleBar style={{ flex: 1, minHeight: 0 }}>
      <div className="px-6 pb-8 pt-5">
        <MetricsSection
          selectedMetric={selectedMetric}
          onMetricChange={onMetricChange}
          selectedFishersMetric={selectedFishersMetric}
          onFishersMetricChange={onFishersMetricChange}
          selectedYear={selectedYear}
          onYearChange={onYearChange}
          gaulLevel={gaulLevel}
          onGaulLevelChange={onGaulLevelChange}
          surveyPeriodLabel={surveyPeriodLabel}
        />

        {selectedFeature ? (
          <DistrictSheet
            feature={selectedFeature}
            gaulLevel={gaulLevel}
            selectedMetric={selectedMetric}
            boundaries={boundaries}
            timeSeriesData={timeSeriesData}
            frameGearsRows={frameGearsRows}
            surveyPeriodLabel={surveyPeriodLabel}
            isDarkTheme={isDarkTheme}
            onClose={onCloseSheet}
          />
        ) : (
          <CoverageSheet coverage={coverage} onShowCountry={onShowCountry} onHoverCountry={onHoverCountry} />
        )}

        <FishingActivitySection
          transformedH3Data={transformedH3Data}
          pdsFishingGroundsData={pdsFishingGroundsData}
          visualizationMode={visualizationMode}
          onVisualizationModeChange={onVisualizationModeChange}
          selectedActivityMetric={selectedActivityMetric}
          onActivityMetricChange={onActivityMetricChange}
          activeActivityLayers={activeActivityLayers}
          onLayerToggle={onLayerToggle}
        />
      </div>
    </SimpleBar>
    <footer className="flex justify-between border-t border-border px-6 py-2 text-xs text-muted-foreground">
      <span>Peskas Coasts {version}</span>
      <span>Data to {dataFreshnessLabel}</span>
    </footer>
  </aside>
));

Sidebar.displayName = 'Sidebar';
export default Sidebar;
