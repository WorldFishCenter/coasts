import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapComponent from './components/Map'
import CountryView from './components/CountryView'
import DocsHub from './components/DocsHub'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="coasts-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<MapComponent />} />
          <Route path="/country" element={<CountryView />} />
          <Route path="/docs" element={<DocsHub />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
