import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react'
import './index.css'
// The Peskas logo's colours, light and dark (synced from peskas-context/brand).
import './components/peskas-logo.css'
import App from './App.jsx'
import { initAnalytics } from './lib/analytics'

initAnalytics()

// PostHog (EU cloud, the project the WIO country dashboards share): page views, clicks,
// session replays and crashes. Off where the token is unset, as in local dev and previews.
const posthogToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
if (posthogToken) {
  posthog.init(posthogToken, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    defaults: '2026-08-30',
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      {/* No fallback: a crash leaves the page blank as before, but now reaches PostHog */}
      <PostHogErrorBoundary>
        <App />
      </PostHogErrorBoundary>
    </PostHogProvider>
  </StrictMode>,
)
