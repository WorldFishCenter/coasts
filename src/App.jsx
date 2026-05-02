import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MapComponent from './components/Map'
import CountryView from './components/CountryView'
import DocsHub from './components/DocsHub'
import { ThemeProvider } from './components/ThemeProvider'

function AppContent() {
  const location = useLocation();
  
  // Routes where the map should be active
  const isCountryRoute = location.pathname === '/country';
  const isDocsRoute = location.pathname === '/docs';
  // Default to map route if no other specific routes match
  const isMapRoute = location.pathname === '/' || (!isCountryRoute && !isDocsRoute);



  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      {/* 
        The Map stays mounted FOREVER.
      */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          display: isMapRoute ? 'block' : 'none',
          zIndex: 10
        }}
      >
        <MapComponent isActive={isMapRoute} />
      </div>

      {/* 
        Other views are also kept alive.
      */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          display: isCountryRoute ? 'block' : 'none',
          zIndex: 20,
          overflow: 'auto',
          backgroundColor: 'var(--background)'
        }}
      >
        <CountryView />
      </div>

      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          display: isDocsRoute ? 'block' : 'none',
          zIndex: 30,
          overflow: 'auto',
          backgroundColor: 'var(--background)'
        }}
      >
        <DocsHub />
      </div>
      
      {/* Fallback for deep linking and React Router state */}
      <div style={{ display: 'none' }}>
        <Routes>
          <Route path="/" element={null} />
          <Route path="/country" element={null} />
          <Route path="/docs" element={null} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="coasts-ui-theme">
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  )
}

export default App
