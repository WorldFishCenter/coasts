const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Dev sessions would otherwise pollute production reports; VITE_GA_DEBUG opts in locally.
const isEnabled =
  Boolean(MEASUREMENT_ID) &&
  (import.meta.env.PROD || import.meta.env.VITE_GA_DEBUG === 'true');

let initialized = false;

// gtag.js reads the pushed `arguments` object, so this cannot take rest params.
function gtag() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments);
}

export function initAnalytics() {
  if (!isEnabled || initialized || typeof window === 'undefined') return;
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.gtag = window.gtag || gtag;

  gtag('js', new Date());
  // Route changes never reload the document, so page views are sent manually.
  gtag('config', MEASUREMENT_ID, { send_page_view: false });
}

export function trackPageView(path) {
  if (!initialized) return;

  gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name, params) {
  if (!initialized) return;

  gtag('event', name, params);
}
