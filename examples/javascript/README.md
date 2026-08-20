# JavaScript Portfolio Examples

These examples show how the portfolio apps could be backed by reusable JavaScript modules as they move from prototypes toward production systems.

The goal is to demonstrate implementation thinking around:

- Data transformation
- Decision scoring
- Notification routing
- Session analysis
- Asset filtering
- Lightweight testability

## Files

| File | Purpose |
| --- | --- |
| `roadmap-priority-engine.js` | Scores roadmap tasks using risk, effort, business impact, dependencies, and executive urgency |
| `training-session-insights.js` | Summarizes athlete session logs and flags coaching review patterns |
| `notification-router.js` | Routes app events into coach, athlete, and admin notification payloads |
| `asset-library-filter.js` | Filters and groups media assets for client portal/library views |
| `demo-runner.js` | Runs sample data through the modules from the command line |

## Run

```powershell
cd D:\betavault\examples\javascript
node demo-runner.js
```

These modules are intentionally dependency-free so they can be read, tested, and adapted without a build step.
