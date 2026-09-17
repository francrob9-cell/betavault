# ParityPulse: Hotel Rate Integrity Monitor

ParityPulse is a portfolio prototype for hotel revenue and distribution teams. The current build uses real Marriott Bonvoy Denver properties and retrieves timestamped public seller offers for selected stays.

## Product flow

1. Review portfolio parity health, leakage exposure, and repeat offenders.
2. Filter the issue queue by property and severity.
3. Inspect room, cancellation, tax, and price comparability evidence.
4. Run a live shop for a real Marriott Denver property, arrival date, and stay length.
5. Preserve source links and timestamps for follow-up.

## Live data

The live scanner reads the current public Google Hotels seller stack through a browser-compatible reader, including Marriott's official offer and returned OTA offers such as Expedia or Booking.com. Dynamic, authenticated, geo-targeted, bot-protected, or checkout-only rates may not be readable. The app timestamps every observation, reports blocked sources, and does not manufacture missing prices. A production implementation would replace this adapter with contracted Lighthouse, OTA, and hotel-authorized feeds.

## Portfolio value

- Hospitality revenue-management workflow design
- Evidence-aware automation rather than opaque AI output
- Responsive commercial operations dashboard
- Rate comparability and severity-scoring logic
- Live-source adapter with explicit uncertainty states

Open `index.html` directly or serve the repository with any static web server.
