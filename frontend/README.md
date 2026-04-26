# UNMAPPED — CandidateConnect Dashboard (Module 03)

React + Vite + TypeScript frontend for the UNMAPPED skills passport system.
Three-panel dashboard for workers, employers, and policymakers.

---

## Quickstart

```bash
cd frontend
npm install
npm run dev
```

Frontend at `http://localhost:5173`. Defaults to `http://localhost:8000` for the backend.
To point at a different backend, set `VITE_API_BASE_URL` in a local `.env` file.

The backend must be running for the Employees and Market Analysis panels to work.
See `backend/README.md` for backend setup.

---

## Running the full system

Two terminals:

```bash
# Terminal 1 — backend
cd backend
.venv/bin/uvicorn skills_passport.main:app --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```

The first `POST /match` call (triggered by "Generate passport") takes ~5 s while
the backend builds its embedding index. Every call after that is instant.

---

## Panels

### Employees
Five-step questionnaire → **Generate passport** → JSON-LD skills passport → top-5 occupation matches with ILOSTAT employment and earnings signals.

Country context (Ghana / India / Bangladesh) is selected from the dropdown in the tab header and shared across all panels. Changing the country after a passport is issued re-runs the match automatically.

### Employers
Vacancy form with seeded-random candidate generation. ISCO code lookup shows the matched occupation label inline. No backend calls.

### Market Analysis
Sector employment growth chart (real ILOSTAT data via `GET /market/{country_code}`). Unemployment time-series and skills mismatch charts are illustrative — those series are not in the current dataset.

---

## Project layout

```
frontend/
  src/
    lib/
      api.ts       # fetch wrappers for /passport/generate, /match, /market
      types.ts     # shared TypeScript types
      utils.ts     # tailwind class merge helper
    components/
      EmployeesPanel.tsx      # form + passport card + match results
      EmployersPanel.tsx      # vacancy form (mocked)
      MarketAnalysisPanel.tsx # charts wired to /market endpoint
      SiteHeader.tsx
      Masthead.tsx
      ui/                     # shadcn/ui primitives
    pages/
      Index.tsx    # country selector state + tab layout
  .env.example
  package.json
```
