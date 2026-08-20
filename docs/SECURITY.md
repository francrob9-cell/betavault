# Security And Privacy Notes

This repository is packaged for portfolio review. It intentionally excludes:

- Private certificates
- API tokens and personal access tokens
- Raw client media libraries
- Full-resolution video packages
- Local temporary files and build artifacts

## Application Security Themes Demonstrated

### Role-Based Access

BetaVault models separate coach/admin and athlete workflows. In production, this should be enforced with server-side claims or Firestore role documents plus Firebase Security Rules.

### User-Owned Data

The coaching app direction favors user subcollections such as:

- `users/{uid}/goals`
- `users/{uid}/videos`
- `users/{uid}/sessions`
- `users/{uid}/notifications`

This makes permission boundaries easier to reason about as the app grows.

### External Systems

The Workday roadmap app shows Jira and Smartsheet integration concepts. Production integrations should use server-side token storage, scoped API credentials, and audit logging.

### Media Delivery

The asset launchroom separates review UX from raw media storage. In production, large media should be stored in cloud object storage or an asset management system, not committed to Git.

## Pre-Push Review

Before publishing this repo, it was scanned for common private-token patterns and oversized files. The Git payload was trimmed to keep the repository reviewable.
