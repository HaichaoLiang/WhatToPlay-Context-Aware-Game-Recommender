# WhatToPlay: Context-Aware Game Recommender

Basic frontend implementation for the project proposal using React + Vite, without authentication for now.

## Implemented in this baseline

- Mobile-first context check-in UI:
  - Time available slider
  - Energy level
  - Current goal (Relax / Competitive / Story / Social)
  - Device selector
  - Friends online toggle
- API-backed recommendation generation
- Ranked result view with:
  - Top Pick card
  - "Why this" explanation bullets
  - Alternatives list
  - Shuffle / Accept / Reject actions
- Lightweight context-aware scoring logic (time fit, energy fit, social fit, device fit)

## APIs used

- FreeToGame API for game catalog metadata
- CheapShark API for deal/rating enrichment

Both are wired through Vite dev proxy routes:

- `/api/freetogame/*`
- `/api/cheapshark/*`

## Authentication status

Not implemented yet (intentionally deferred).

## Run locally

```bash
npm install
npm run dev
```

## Build and lint

```bash
npm run lint
npm run build
```
