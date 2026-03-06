import Header from './Header';
import Sidebar from './Sidebar';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';

const AppLayout = ({
    children,
    // Header Props
    boundaries,
    timeSeriesData,
    pdsGridsData,

    // Sidebar Props
    isMobile,
    isSidebarOpen,
    selectedMetric,
    onMetricChange,
    transformedPdsData,
    selectedRanges,
    onRangeToggle,
    selectedRegions,
    onRegionSelect,
    onRegionRemove,
    selectedCountries,
    onCountryToggle,
    gaulLevel,
    onGaulLevelChange,
    visualizationMode,
    onVisualizationModeChange
}) => {
    const { theme, setTheme } = useTheme();
    const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleThemeChange = (dark) => {
        setTheme(dark ? 'dark' : 'light');
    };

    return (
        <div className={cn(
            "h-screen w-full flex flex-col font-sans overflow-hidden",
            "bg-background text-foreground"
        )}>
            {/* Rigid Global Header */}
            <Header
                isDarkTheme={isDarkTheme}
                onThemeChange={handleThemeChange}
                boundaries={boundaries}
                timeSeriesData={timeSeriesData}
                pdsGridsData={pdsGridsData}
            />

            {/* Main Content Area (below header) */}
            <div className="flex flex-1 overflow-hidden min-h-0 relative">

                {/* Rigid left Sidebar */}
                <Sidebar
                    isDarkTheme={isDarkTheme}
                    isMobile={isMobile}
                    isOpen={isSidebarOpen}
                    boundaries={boundaries}
                    selectedMetric={selectedMetric}
                    onMetricChange={onMetricChange}
                    transformedPdsData={transformedPdsData}
                    selectedRanges={selectedRanges}
                    onRangeToggle={onRangeToggle}
                    selectedRegions={selectedRegions}
                    onRegionRemove={onRegionRemove}
                    selectedCountries={selectedCountries}
                    gaulLevel={gaulLevel}
                    onGaulLevelChange={onGaulLevelChange}
                    visualizationMode={visualizationMode}
                    onVisualizationModeChange={onVisualizationModeChange}
                />

                {/* Dynamic map Viewport filling the remaining area */}
                <div className="flex-1 relative min-w-0">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
