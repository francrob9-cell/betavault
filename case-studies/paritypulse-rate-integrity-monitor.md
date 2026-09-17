# ParityPulse Rate Integrity Monitor

## Problem

Hotel revenue teams need to know when an OTA, wholesaler, metasearch result, or gated promotion undercuts the direct or negotiated rate. A simple price comparison is not enough: room type, cancellation terms, taxes, occupancy, device, membership, and point of sale determine whether two offers are truly comparable.

## Product response

ParityPulse organizes those signals into a revenue-manager workbench. It prioritizes likely disparities by commercial impact, exposes the comparison evidence, estimates direct-revenue leakage, identifies repeat channel offenders, and recommends the next investigation step.

## Live-data approach

The portfolio build includes a conservative public-page scanner. A user supplies direct and comparison URLs for the same stay conditions. The scanner attempts to read visible rate text, retains the evidence links and timestamp, and refuses to infer a value when a source is gated or blocked.

For production, the same normalized offer model would sit behind authorized rate-shopping feeds, contractual OTA integrations, hotel CRS data, and scheduled observations.

## What this demonstrates

- Translating hospitality commercial strategy into an operational product
- Separating exact, likely, and invalid rate comparisons
- Designing AI explanations around evidence and confidence
- Turning detection into a prioritized investigation workflow
- Building for both property-level action and portfolio-level management
