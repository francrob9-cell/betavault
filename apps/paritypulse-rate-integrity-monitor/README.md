# ParityPulse: Hotel Rate Integrity Monitor

ParityPulse is a portfolio prototype for hotel revenue and distribution teams. It turns rate-shopping evidence into a prioritized workflow: identify comparable undercuts, estimate commercial impact, explain the likely cause, and start an investigation.

## Product flow

1. Review portfolio parity health, leakage exposure, and repeat offenders.
2. Filter the issue queue by property and severity.
3. Inspect room, cancellation, tax, and price comparability evidence.
4. Run a live public-page comparison by pasting direct and OTA/metasearch URLs.
5. Preserve source links and timestamps for follow-up.

## Live data

The live scanner reads publicly visible page text through a browser-compatible reader and applies conservative price extraction. Dynamic, authenticated, bot-protected, or checkout-only rates may not be readable. In those cases the app reports the source as blocked and does not manufacture a rate. A production implementation would replace this adapter with contracted rate-shopping APIs and hotel-authorized feeds.

## Portfolio value

- Hospitality revenue-management workflow design
- Evidence-aware automation rather than opaque AI output
- Responsive commercial operations dashboard
- Rate comparability and severity-scoring logic
- Live-source adapter with explicit uncertainty states

Open `index.html` directly or serve the repository with any static web server.
