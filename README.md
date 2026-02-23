# WhatToPlay: Context-Aware Game Recommender

This repo now contains:

- `src/` React frontend (your current UI)
- `backend/` Flask backend (Steam auth/sync + recommendation/search routes)

## Current integration

- Frontend calls backend route: `POST /api/public/recommend`
- Vite dev proxy forwards `/api/*` to `http://127.0.0.1:5000`
- If backend is unavailable, frontend falls back to local demo data

## Backend routes now available

- `/api/health`
- `/api/auth/*`
- `/api/account/*`
- `/api/steam/*`
- `/api/search/*`
- `/api/recommend/*`
- `/api/public/recommend` (new non-auth endpoint for current frontend)

## Run locally

### 1) Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Notes:
- `DATABASE_URL` defaults to `sqlite:///whattoplay.db` if not set
- For Steam features, set `STEAM_API_KEY` in environment

### 2) Frontend (new terminal)

```bash
npm install
npm run dev
```

## Validation

Frontend checks:
```bash
npm run lint
npm run build
```
