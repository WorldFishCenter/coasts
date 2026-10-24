import { useState, useMemo } from 'react';
import { Info, Sun, Moon } from 'lucide-react';
import { getLatestDate, getUniqueCountries } from '../services/dataService';
import { cn } from '../lib/utils';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import AboutModal from './AboutModal';
import { PeskasLogo, PeskasMark } from './PeskasLogo';

const Header = ({
  boundaries,
  timeSeriesData,
  pdsH3EffortData
}) => {
  const [showAbout, setShowAbout] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  
  const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const currentView = location.pathname === '/country' ? 'country' : location.pathname === '/docs' ? 'docs' : 'map';

  const handleThemeToggle = () => {
    setTheme(isDarkTheme ? 'light' : 'dark');
  };

  const dynamicStats = useMemo(() => {
    const stats = {
      totalRegions: 0,
      totalCountries: 0,
      lastSyncDate: 'Loading...',
      totalGridCells: 0
    };

    if (boundaries?.features) {
      stats.totalRegions = boundaries.features.length;
      stats.totalCountries = getUniqueCountries(boundaries).length;
    }

    if (timeSeriesData) {
      const latestDate = getLatestDate(timeSeriesData);
      if (latestDate) {
        const date = new Date(latestDate);
        stats.lastSyncDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      }
    }

    if (pdsH3EffortData?.length) {
      stats.totalH3Cells = pdsH3EffortData.length;
    }

    return stats;
  }, [boundaries, timeSeriesData, pdsH3EffortData]);

  const tabs = [
    { to: '/', label: 'Map', active: currentView === 'map' },
    { to: '/country', label: 'Country insights', short: 'Countries', active: currentView === 'country' },
    { to: '/docs', label: 'Methods', active: currentView === 'docs' }
  ];

  return (
    <>
      <header className="relative z-50 flex h-14 flex-none items-stretch gap-4 border-b-2 border-rule bg-background px-4 sm:gap-10 sm:px-6">
        {/* The Peskas logo and the product name, one link home that reads "Peskas Coasts";
            below 640px the mark alone takes the logo's place. */}
        <h1 className="m-0 flex shrink-0 items-center">
          <Link to="/" className="flex items-baseline gap-1.5 text-foreground no-underline">
            <PeskasLogo className="hidden h-7 w-auto self-center sm:block" />
            <PeskasMark className="h-7 w-auto self-center sm:hidden" />
            <span className="hidden font-serif text-lg italic text-primary sm:inline">Coasts</span>
          </Link>
        </h1>

        <nav aria-label="Main" className="flex items-stretch gap-4 sm:gap-7">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={tab.active ? 'page' : undefined}
              className={cn(
                '-mb-[2px] flex items-center border-b-[3px] pt-[3px] text-[15px] font-semibold no-underline transition-colors',
                tab.active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.short ? (
                <>
                  <span className="sm:hidden">{tab.short}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </>
              ) : tab.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-1.5 rounded px-1 text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <Info className="h-4 w-4 sm:hidden" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">About</span>
          </button>
          <button
            onClick={handleThemeToggle}
            className="flex h-8 w-8 items-center justify-center rounded border border-input text-foreground transition-colors hover:border-foreground"
            aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDarkTheme ? 'Light theme' : 'Dark theme'}
          >
            {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <AboutModal
        open={showAbout}
        onOpenChange={setShowAbout}
        isDarkTheme={isDarkTheme}
        dynamicStats={dynamicStats}
      />
    </>
  );
};

export default Header;