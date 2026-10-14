import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// The Peskas logo's colours, light and dark (synced from peskas-context/brand).
import './components/peskas-logo.css'
import App from './App.jsx'
import { initAnalytics } from './lib/analytics'

initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
