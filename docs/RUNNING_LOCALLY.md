# Running Locally

Most apps are static HTML/CSS/JS and can be served with any local static server.

## Simple Python Server

From the repository root:

```powershell
cd D:\betavault
python -m http.server 8795
```

Then open:

- `http://127.0.0.1:8795/index.html`
- `http://127.0.0.1:8795/apps/betavault-coaching-app/index.html`
- `http://127.0.0.1:8795/apps/workday-optimization-roadmap/index.html`
- `http://127.0.0.1:8795/apps/business-app-portfolio/index.html`
- `http://127.0.0.1:8795/apps/unfound-door-asset-launchroom/index.html`
- `http://127.0.0.1:8795/apps/cognitive-bias-atlas-game/x-3d.html`

## Notes By App

### BetaVault Coaching App

This app references Firebase client configuration. A production deployment should use Firebase Hosting, Firestore rules, Storage rules, and configured Google/Apple authentication providers.

### Workday Optimization Roadmap

This app is primarily static and includes local JSON data exports. Published Smartsheet URLs are represented as outbound links.

### Asset Launchroom

Full-resolution media and large video files are intentionally excluded. Thumbnails and manifests remain so the app structure can be reviewed.

### Cognitive Bias Atlas Game

The 3D prototype uses Three.js from a CDN, so network access is needed on first load.
