# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

No single primary user. Five audiences count equally: fisheries managers, policy makers, researchers, conservation groups and fishing communities in Kenya, Zanzibar (Tanzania), Mozambique and Timor-Leste.

They open it on a laptop with a good connection, or on a big screen in meetings and workshops, where one person drives and a room watches.

## Product Purpose

Peskas Coasts is the public map that shows Peskas' reach across the Western Indian Ocean: which coastal provinces and districts in four countries are covered, and what the data says about each one. The first job of a visit is to see that coverage and scale at a glance. Comparing regions, following trends and reading methods come after.

Success: a visitor, or a room, leaves knowing where Peskas monitors small-scale fisheries and that the numbers behind it are real and explained.

## Positioning

It is the only Peskas product that puts all four countries on one map. The country dashboards (Peskas Zanzibar, Kenya, Mozambique) and the Peskas Timor-Leste portal look at one country in depth; Peskas Coasts compares regions across countries.

## Operating Context

- Public at coasts.peskas.org, open to everyone, no login, English only.
- Three pages: the map (`/`), Country Insights (`/country`) and the methods and data dictionary (`/docs`).
- No backend. The browser loads static JSON from `public/data/`, refreshed every day by two GitHub Actions from the `peskas.coasts` pipeline; each refresh redeploys the site on Vercel.
- The map is WebGL (Mapbox GL and deck.gl) and needs `VITE_MAPBOX_TOKEN`.
- Data sources: landing surveys recorded by enumerators at landing sites; GPS trackers (Pelagic Data Systems) on a sample of boats; frame surveys (national censuses of fishers and boats, Kenya, Zanzibar and Mozambique only).
- Usage is tracked with Google Analytics 4 and, since 2026-10-21, PostHog (shared project with the WIO country dashboards; filter by host `coasts.peskas.org`).

## Capabilities and Constraints

- Shade provinces (GAUL 1) or districts (GAUL 2) by catch per fisher per day, revenue per fisher per day or price per kg, for one year or all years.
- Click districts to compare them side by side.
- GPS tracker layers: a fishing-effort grid (H3 cells, 3D or flat) and the main fishing grounds, only where enough trips exist (`PDS_MIN_UNIQUE_TRIPS`).
- Fishers (total, men, women) and boats by district and fishing gear. These are static census counts and do not follow the year filter.
- Country Insights: monthly trend for a country or district, and gear comparison.
- Money is already in US dollars upstream; the portal does not convert it.
- `src/utils/metricMetadata.js` is the single source for metric names, units, formulas and the `/docs` dictionary. `npm run qa:clarity` checks it.
- Terms: Administrative regions (GAUL), catch per unit effort, revenue per unit effort, price per kilogram, as defined in the README.
- Known copy drift: the About dialog says data updates every 2 days; the workflows run daily.

## Brand Commitments

- Name: Peskas Coasts. Part of Peskas, WorldFish's open-source platform for monitoring small-scale fisheries. Developed and run by WorldFish. Contact: peskas.platform@gmail.com.
- Spellings: Peskas, WorldFish, Timor-Leste, Zanzibar (Tanzania).
- Logo: the official Peskas logo (a tuna made of hexagon cells, lowercase "peskas" wordmark) from the brand kit in `peskas-context/brand/`. `src/components/PeskasLogo.jsx`, `peskas-logo.css`, the favicons and `public/og/coasts.png` are generated there and synced in; change the kit, not these files.
- Voice: plain and factual, as in the README. No sales language. Explain a term in a few words the first time it appears.
- GPS trackers are one Peskas data source, not its identity. Keep them out of the headline.

## Evidence on Hand

- Real data: `public/data/` (region boundaries and monthly metrics for GAUL 1 and 2, GPS effort grid, fishing grounds, frame-survey gears, bathymetry contours).
- Methods: the `/docs` page (`src/components/DocsHub.jsx`) and `metricMetadata.js`.
- Images: `.github/images/screenshot.png` (map), `public/og/coasts.png` (link preview), brand kit files.
- Not on hand, do not invent: visitor numbers, testimonials, case studies, impact claims, partner logos.

## Product Principles

1. Reach first. The first view shows how much of the region Peskas covers before it asks the visitor to do anything.
2. Every number traces to its method. A figure on screen links to its definition in `/docs`.
3. Honest about gaps. No data looks different from zero; static census counts say they ignore the year filter; GPS layers say they come from a sample of boats.
4. Readable across a room. What matters on a laptop also reads on a projected screen.
5. Plain words for a mixed audience. A manager, a researcher and a fisher should all follow it.
