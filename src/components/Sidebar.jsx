import { memo } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { Layers, Map as MapIcon, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

// Modular Sections
import MetricsSection from './sidebar/MetricsSection';
import FishingActivitySection from './sidebar/GridActivitySection';

const Sidebar = memo(({
  isDarkTheme,
  isMobile,
  isOpen,
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
  onVisualizationModeChange
}) => {
  const isGaul1 = gaulLevel === 'gaul1';
  const sectionCardClasses = cn(
    "rounded-2xl border p-4",
    isDarkTheme ? "bg-white/[0.02] border-white/30" : "bg-black/[0.02] border-black/30"
  );

  const containerClasses = cn(
    "flex-none flex flex-col overflow-hidden border-r shadow-2xl z-40 transition-all duration-300 ease-in-out relative",
    isDarkTheme ? "bg-[#060b19]/90 border-white/5" : "bg-white/90 border-[#0a1930]/10",
    "backdrop-blur-2xl",
    isOpen ? (isMobile ? "w-full" : "w-[420px]") : "w-0",
    "h-full min-h-0"
  );

  return (
    <div className={containerClasses}>
      {/* Background ambient glow effect */}
      {isDarkTheme && (
        <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/5 blur-[100px] pointer-events-none rounded-full -translate-y-1/2" />
      )}

      {/* Header */}
      <div className={cn(
        "px-6 pt-8 pb-6 border-b shrink-0 relative z-10",
        isDarkTheme ? "border-white/5 bg-black/20" : "border-black/5 bg-black/5"
      )}>
        <h2 className="m-0 text-xl font-display font-semibold flex items-center gap-3 text-foreground tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          Parameters Console
        </h2>
        <p className="m-0 mt-3 text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-80">
          Configure metrics and filters
        </p>
      </div>

      {/* Scrollable Content */}
      <SimpleBar style={{ flex: 1, minHeight: 0 }} className="p-6 relative z-10">
        <div className="flex flex-col gap-10 pb-10">

          {/* Admin level switch (Pill Style) */}
          {onGaulLevelChange && (
            <div className={cn(sectionCardClasses, "flex flex-col gap-3")}>
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-primary" />
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Resolution Boundary
                </div>
              </div>

              <div className={cn(
                "p-1 rounded-full flex border backdrop-blur-md shadow-inner",
                isDarkTheme ? "bg-black/40 border-white/5" : "bg-black/5 border-black/5"
              )}>
                <button
                  onClick={() => onGaulLevelChange('gaul1')}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all duration-300 tracking-wide",
                    gaulLevel === 'gaul1'
                      ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(0,245,255,0.3)]"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Admin 1 (Provinces)
                </button>
                <button
                  onClick={() => onGaulLevelChange('gaul2')}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all duration-300 tracking-wide",
                    gaulLevel === 'gaul2'
                      ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(0,245,255,0.3)]"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Admin 2 (Districts)
                </button>
              </div>
            </div>
          )}

          <div className={cn(sectionCardClasses, "flex flex-col gap-3")}>
            <div className="flex items-center gap-2 px-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Data Year Filter</span>
            </div>
            <div className={cn(
              "p-1 flex gap-1 rounded-xl border backdrop-blur-md",
              isDarkTheme ? "bg-black/20 border-white/5" : "bg-black/5 border-black/5"
            )}>
              {['all', '2024', '2025', '2026'].map(year => (
                <button
                  key={year}
                  onClick={() => onYearChange(year)}
                  className={cn(
                    "flex-1 py-2 rounded-lg transition-all duration-300 font-bold text-xs tracking-wide",
                    selectedYear === year
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  )}
                >
                  {year === 'all' ? 'All Years' : year}
                </button>
              ))}
            </div>
          </div>

          {/* Render Sections Directly without Accordion wrapper */}

          <div className={sectionCardClasses}>
            <MetricsSection
              isDarkTheme={isDarkTheme}
              selectedMetric={selectedMetric}
              onMetricChange={onMetricChange}
              selectedFishersMetric={selectedFishersMetric}
              onFishersMetricChange={onFishersMetricChange}
            />
          </div>

          <div className={sectionCardClasses}>
            <FishingActivitySection
              isDarkTheme={isDarkTheme}
              transformedH3Data={transformedH3Data}
              pdsFishingGroundsData={pdsFishingGroundsData}
              visualizationMode={visualizationMode}
              onVisualizationModeChange={onVisualizationModeChange}
              selectedYear={selectedYear}
              onYearChange={onYearChange}
              selectedActivityMetric={selectedActivityMetric}
              onActivityMetricChange={onActivityMetricChange}
              activeActivityLayers={activeActivityLayers}
              onLayerToggle={onLayerToggle}
            />
          </div>

        </div>
      </SimpleBar>

      {/* Footer Info Dock */}
      <div className={cn(
        "px-6 py-4 border-t flex items-center justify-between backdrop-blur-md",
        isDarkTheme ? "border-white/5 bg-black/40" : "border-black/5 bg-white/50"
      )}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Systems Online</span>
        </div>
        <div className="text-[10px] tracking-widest uppercase text-muted-foreground opacity-50 font-bold">
          Coasts v0.4.0
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;