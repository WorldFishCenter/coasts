import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapComponent from './components/Map'
import CountryView from './components/CountryView'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="coasts-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<MapComponent />} />
          <Route path="/country" element={<CountryView />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
