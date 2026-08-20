# Architecture Overview

This portfolio uses small, inspectable web apps to demonstrate product thinking, workflow design, and systems integration. Most apps are static front-end prototypes because the focus is on decision flow, stakeholder experience, data shape, and implementation direction.

## Portfolio-Level Map

```mermaid
flowchart LR
  Hiring["Hiring team / stakeholder"] --> Hub["Portfolio landing page"]
  Hub --> Beta["BetaVault coaching platform"]
  Hub --> WD["Workday optimization roadmap"]
  Hub --> UFD["Asset Launchroom"]
  Hub --> Bias["Cognitive Bias Atlas"]
  Hub --> Biz["Business App Portfolio"]

  Beta --> Firebase["Firebase auth, Firestore, Storage concepts"]
  WD --> Smartsheet["Smartsheet published sheets"]
  WD --> Jira["Jira ticket context"]
  UFD --> Media["Image/video asset workflows"]
  Bias --> Three["Three.js interactive world"]
```

## BetaVault Coaching App

```mermaid
flowchart TB
  Athlete["Athlete"] --> Auth["Google/Apple/email auth"]
  Coach["Coach/Admin"] --> Auth
  Auth --> Profile["User profile"]
  Profile --> Goals["Goals and milestones"]
  Profile --> Sessions["Session logs"]
  Profile --> Videos["Video uploads and notes"]
  Goals --> Notify["Coach/user notifications"]
  Videos --> Review["Timestamp review and frame annotations"]
  Sessions --> Reports["Coach-reviewed reports"]
```

Key architecture idea: model user-owned data around athletes, with coach-facing review workflows layered on top.

## Workday Optimization Roadmap

```mermaid
flowchart LR
  Tasks["Optimization tasks"] --> Roadmap["Interactive roadmap app"]
  Jira["Jira keys and URLs"] --> Roadmap
  Sheets["Smartsheet published links"] --> Roadmap
  Roadmap --> Exec["Executive context"]
  Roadmap --> Board["Board packet PDF"]
  Roadmap --> Priority["Priority and dependency review"]
```

Key architecture idea: turn a long task list into an executive decision tool with traceability to systems of record.

## Asset Launchroom

```mermaid
flowchart TB
  Creator["Creative/admin view"] --> Library["Asset library"]
  Library --> Client["Client review portal"]
  Client --> Crop["Light crop/post workflows"]
  Client --> Review["Image/video review"]
  Library --> Delivery["Delivery-ready package"]
```

Key architecture idea: separate internal library management from a very slim client review experience.

## Cognitive Bias Atlas Game

```mermaid
flowchart TB
  Player["Player"] --> Explore["Procedural exploration"]
  Explore --> Collide["Collision and parkour obstacles"]
  Player --> Wash["Spray/wash mechanic"]
  Wash --> Collect["Bias crystal collection"]
  Collect --> Build["Build structures"]
  Build --> Layers["Move between dimensions"]
  Explore --> Rare["Rare item scout mode"]
```

Key architecture idea: teach abstract cognitive concepts through spatial exploration and progression loops.
