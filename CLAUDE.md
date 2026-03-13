# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wunderkammer Gotha — a bilingual (DE/EN) interactive map and POI explorer for landmarks in Gotha, Germany. It integrates data from Wikipedia, Wikidata, FactGrid, and Wikimedia Commons.

## Commands

All commands run from the `app/` directory:

```bash
cd app
npm run dev        # Start Express + Vite dev server (port 3000)
npm run build      # Prebuild data + TypeScript check + Vite production build
npm run start      # Production server (serves built files + API)
npm run prebuild   # Fetch external data (Wikipedia/Wikidata/FactGrid/Commons) → public/data/pois-prebuilt.json
npm run lint       # ESLint
```

## Architecture

**React + TypeScript + Vite** SPA with an **Express backend** (`app/server.ts`). In dev mode, Express hosts Vite middleware. In production, Express serves `dist/` static files and API routes.

Navigation uses `window.location.hash` (e.g., `#/poi/slug`, `#/list`, `#/admin`).

### Data Flow

- **Static POI definitions**: `app/src/data/pois.ts` — the canonical list of POIs with coordinates, Wikipedia/Wikidata/FactGrid/Commons identifiers
- **Prebuild script**: `app/scripts/prebuild.ts` — runs at build time via `npx tsx`, fetches summaries/thumbnails/images from external APIs, writes `app/public/data/pois-prebuilt.json`
- **Runtime API calls**: `app/src/api/` — client-side fetches to Wikipedia, Wikidata, FactGrid, and Commons APIs for detail views (summaries, statements, pageviews, images)
- **Hooks**: `app/src/hooks/` — React hooks wrapping the API modules (`useWikipedia`, `useWikidata`, `useFactGrid`, `useCommons`, `usePageviews`)

### Admin Dashboard

Accessible at `#/admin` (hidden from public navigation, no nav button). Password-protected via Express API.

- **Server auth**: `POST /api/auth/login`, `GET /api/auth/check`, `POST /api/auth/logout`. Sessions are in-memory tokens. Password set via `ADMIN_PASSWORD` env var (default: `admin`).
- **Config persistence**: `GET /api/config` (public) and `PUT /api/config` (auth-required). Stored in `data/admin-config.json`.
- **Admin components**: `app/src/admin/` — AdminDashboard, AdminPOIEditor, LoginPage, AuthProvider, AdminProvider
- **Per-POI settings**: enable/disable POI, Wikipedia preview text length, Wikidata/FactGrid property selection, Commons image selection. Settings affect all users.

### Key Patterns

- **Bilingual content**: POIs have `title_de`/`title_en`, `wikipedia_de`/`wikipedia_en` fields. i18n via `react-i18next` with inline translations in `app/src/i18n.ts` (default language: German)
- **Theme colors**: Corporate design colors defined in `app/src/theme.ts` (e.g., `trollingerblau`, `gerberarot`, `seidengruen`), exposed as CSS custom properties
- **Views**: Map view (Leaflet via `react-leaflet`) and List view, toggled in `App.tsx`. POI detail shown on click in either view.

### Data Scrapers (root-level Python scripts)

`scrape_friedenstein.py`, `scrape_friedenstein_full.py`, `build_friedenstein_index.py`, `download_friedenstein_media.py` — used for initial data collection from the Friedenstein museum mediaguide. Output lives in `friedenstein_data/`. These are one-off scripts, not part of the app build.
