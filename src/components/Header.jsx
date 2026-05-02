import { useState, useMemo } from 'react';
import { Info, Sun, Moon, Map, BarChart3, BookOpen } from 'lucide-react';
import { getLatestDate, getUniqueCountries } from '../services/dataService';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import AboutModal from './AboutModal';

const Header = ({
  boundaries,
  timeSeriesData,
  pdsH3EffortData
}) => {
  const [showAbout, setShowAbout] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const currentView = location.pathname === '/country' ? 'country' : 'map';

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

  return (
    <>
      <header className={cn(
        "flex-none h-[72px] px-8 flex items-center justify-between z-50 transition-all duration-300 relative",
        isDarkTheme
          ? "bg-[#060b19]/80 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-white/80 backdrop-blur-2xl border-b border-[#0a1930]/10 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
      )}>
        {/* Left section with logo and title */}
        <div className="flex items-center gap-5">
          <Link to="/" className="h-11 px-4 rounded-xl flex items-center justify-center relative overflow-hidden bg-primary/10 border border-primary/20 shadow-inner group cursor-pointer transition-all duration-300 hover:bg-primary/20 no-underline">
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="font-display font-extrabold text-[15px] tracking-[0.15em] text-primary relative z-10 drop-shadow-[0_0_8px_#00f5ff66]">
              PESKAS
            </span>
          </Link>

          <div className="h-10 flex flex-col justify-center pl-5 border-l border-border/40">
            <h1 className="m-0 text-[22px] font-display font-bold tracking-tight text-foreground leading-none">
              COASTS
            </h1>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1 opacity-70">
              SSF Analysis Platform
            </div>
          </div>
        </div>

        {/* Center section: View Switcher */}
        <div className="flex-1 flex justify-center">
          <div className={cn(
            "p-1 rounded-full flex items-center border shadow-inner transition-colors duration-300",
            isDarkTheme ? "bg-[#0a1930]/50 border-white/5" : "bg-slate-100 border-slate-200"
          )}>
            <button
              onClick={() => navigate('/')}
              className={cn(
                "h-9 px-5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 flex items-center gap-2",
                currentView === 'map'
                  ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(0,245,255,0.3)] ring-1 ring-primary/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Map size={14} />
              Global Map
            </button>
            <button
              onClick={() => navigate('/country')}
              className={cn(
                "h-9 px-5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 flex items-center gap-2",
                currentView === 'country'
                  ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(0,245,255,0.3)] ring-1 ring-primary/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 size={14} />
              Country Insights
            </button>
          </div>
        </div>

        {/* Right section with actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAbout(true)}
            className={cn(
              "h-10 px-4 flex items-center gap-2 rounded-full font-bold text-xs tracking-wide transition-all duration-300 border",
              isDarkTheme
                ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-foreground"
                : "bg-black/5 border-black/10 hover:bg-black/10 hover:border-black/20 text-foreground"
            )}
          >
            <Info className="w-4 h-4 text-primary" />
            About System
          </button>
          <button
            onClick={() => navigate('/docs')}
            className={cn(
              "h-10 px-4 flex items-center gap-2 rounded-full font-bold text-xs tracking-wide transition-all duration-300 border",
              isDarkTheme
                ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-foreground"
                : "bg-black/5 border-black/10 hover:bg-black/10 hover:border-black/20 text-foreground"
            )}
          >
            <BookOpen className="w-4 h-4 text-primary" />
            Docs
          </button>

          <div className="w-px h-6 mx-2 bg-border/50" />

          <button
            onClick={handleThemeToggle}
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-full transition-all duration-300 border relative group overflow-hidden",
              isDarkTheme
                ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                : "bg-black/5 border-black/10 hover:bg-black/10 hover:border-black/20"
            )}
            aria-label="Toggle theme"
          >
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {isDarkTheme ? (
              <Moon className="w-[18px] h-[18px] text-blue-400 relative z-10 transition-transform group-hover:scale-110" />
            ) : (
              <Sun className="w-[18px] h-[18px] text-amber-500 relative z-10 transition-transform group-hover:scale-110" />
            )}
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