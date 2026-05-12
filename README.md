# Oil Price Visualization Tool — 2026 Iran Conflict

> 資料庫系統 · 期末專案 · 第 7 組 (李錫恩、林宸緯、張弈銨、許書維)

Full-stack web app that visualizes US oil and per-state gasoline prices during
the 2026 Israel–Iran conflict (Feb 9 → Mar 20). Built to the architecture in
the project deck: **React + Vite** SPA → **FastAPI** REST → **PostgreSQL**
(SQLite by default for zero-setup local demos).

## Project layout

```
oil-price-viz/
├── backend/             FastAPI app
│   ├── app/
│   │   ├── main.py      FastAPI entry; mounts routers, CORS
│   │   ├── database.py  SQLAlchemy engine/session (DATABASE_URL env)
│   │   ├── models.py    DailyOilPrice, StateGasPrice, KeyEvent
│   │   ├── schemas.py   Pydantic v2 in/out shapes
│   │   ├── crud.py      Reusable query helpers
│   │   └── routers/     oil_prices.py, state_prices.py, events.py
│   ├── seed.py          CSV → SQL bulk import
│   ├── requirements.txt
│   └── requirements-postgres.txt  (optional)
├── frontend/            React + Vite SPA
│   ├── src/
│   │   ├── App.jsx                 layout + data wiring
│   │   ├── api.js                  axios client
│   │   └── components/
│   │       ├── USMap.jsx           D3 choropleth (TopoJSON)
│   │       ├── Timeline.jsx        Recharts line + brush + event dots
│   │       ├── DetailPanel.jsx     per-day stats & event detail
│   │       └── Splitter.jsx        drag handles for resizable panes
│   └── vite.config.js              dev proxy /api → :8000
└── data/                three source CSVs (already populated)
```

## Prerequisites

Install these once per machine. Restart your terminal after each install so
the new commands are on your `PATH`.

| Tool       | Version | macOS                                           | Windows                                              |
|------------|---------|-------------------------------------------------|------------------------------------------------------|
| **Python** | 3.10+   | https://www.python.org/downloads/macos/ (or `brew install python`) | https://www.python.org/downloads/windows/ — **tick "Add Python to PATH"** in the installer |
| **Node.js**| 18+ LTS | https://nodejs.org (LTS) or `brew install node`                    | https://nodejs.org (LTS installer)                   |

Verify after installing:

```
python3 --version    # macOS
python  --version    # Windows
node --version
npm --version
```

## Quick start

The app has **two parts**: a Python backend (port 8000) and a React frontend
(port 5173). Both must run at the same time, in **two separate terminal
windows**.

---

### 1 · Backend (terminal #1)

#### macOS / Linux

```bash
cd path/to/oil-price-viz/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

#### Windows (PowerShell — the default Terminal on Windows 10/11)

```powershell
cd path\to\oil-price-viz\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

> If PowerShell blocks `Activate.ps1` with a *"running scripts is disabled on
> this system"* error, run this **once** to allow signed scripts for your
> user, then re-try the activate command:
>
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

#### Windows (Command Prompt, if you prefer cmd.exe)

```bat
cd path\to\oil-price-viz\backend
python -m venv .venv
.\.venv\Scripts\activate.bat
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

When the backend is running you should see `Uvicorn running on
http://127.0.0.1:8000`. Open http://localhost:8000/docs in a browser to
confirm — that's the auto-generated FastAPI/OpenAPI page listing every
endpoint. **Leave this terminal open.**

---

### 2 · Frontend (terminal #2)

Open a **new** terminal window. The commands are identical on macOS and
Windows because npm doesn't care which OS you're on:

```bash
cd path/to/oil-price-viz/frontend    # macOS
cd path\to\oil-price-viz\frontend    # Windows
npm install
npm run dev
```

The first run downloads packages into `node_modules/` and takes 1–3 minutes.
Subsequent runs are instant.

When it's ready you'll see:

```
  VITE v5.x.x  ready in 400 ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser. Vite proxies `/api/*` to the
FastAPI backend on :8000, so both servers need to be running at once.

---

### 3 · Re-running after the first setup

The setup steps above are one-time. After that, every time you want to run
the app:

| | macOS / Linux | Windows |
|---|---|---|
| Backend  | `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000` | `cd backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000` |
| Frontend | `cd frontend && npm run dev` | `cd frontend; npm run dev` |

You only need to re-run `python seed.py` if you delete the `oil_price_viz.db`
file or want a fresh database.

## API surface 

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET    | `/api/oil-prices`           | List every daily oil-price record |
| GET    | `/api/oil-prices/{date}`    | One day's prices + matching events |
| POST   | `/api/oil-prices`           | Create a daily oil-price record |
| PUT    | `/api/oil-prices/{id}`      | Patch fields on an existing record |
| DELETE | `/api/oil-prices/{id}`      | Delete a record |
| GET    | `/api/state-prices?date=…`  | All 50 states for a snapshot (feeds the map) |
| GET    | `/api/events`               | Every event marker (feeds the timeline) |

`GET /api/oil-prices/{date}` returns the daily row with an `events: [...]`
array attached (matches the "one-to-zero-or-many on date" relationship from
slide 3).

You can poke at any endpoint interactively from http://localhost:8000/docs —
click *Try it out*, fill in parameters, hit *Execute*.

## Database schema

Three normalised tables (slide 3):

- **`daily_oil_prices`** — `id PK`, `date` (uniq+idx), Brent / WTI / Dubai crude,
  US gas and diesel averages, `war_day`, `phase`.
- **`state_gas_prices`** — `id PK`, `state`, `region`, `snapshot_date` (idx),
  `gas_price`, `gas_prewar`, `pct_increase`, `vs_national`.
- **`key_events`** — `id PK`, `date` (idx → FK by date), `event_title`,
  `description`, `war_day`, `category`, `brent_price`.

All three `date`/`snapshot_date` columns carry B-tree indexes for fast
timeline scans.

### Switching to PostgreSQL (optional, matches the deck spec)

SQLite is the default for easy local dev. To run against real Postgres 16:

1. Install Postgres locally (macOS: `brew install postgresql@16 && brew services start postgresql@16`; Windows: installer from https://www.postgresql.org/download/windows/).
2. Create a database: `createdb oil_price_viz` (or use pgAdmin).
3. Install the driver: `pip install -r requirements-postgres.txt`.
4. Set the env var before launching uvicorn:

   ```bash
   # macOS / Linux
   export DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/oil_price_viz"

   # Windows PowerShell
   $env:DATABASE_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/oil_price_viz"
   ```

5. Run `python seed.py` then `uvicorn app.main:app --reload --port 8000`.

## Data sources

CSVs in `data/` (already supplied):

- `iran_war_oil_prices_daily_2026.csv` — 24 daily rows, Feb 9 → Mar 20
- `iran_war_gas_prices_by_state.csv`    — 50-state snapshot, Mar 19, 2026
- `iran_war_key_events_timeline.csv`    — 11 conflict events

Sources cited in the CSVs: AAA, CNBC, Fortune, NPR, CBS, Reuters, Euronews,
IEA.

## Tech stack

| Layer | Choice | Why (slide 5) |
|-------|--------|---------------|
| UI framework | React + Vite | Component model fits map + timeline + detail |
| Map | D3 + TopoJSON | Lightweight choropleth, no heavy GIS dependency |
| Charts | Recharts | Declarative; built-in `Brush` for the daily slider |
| API | FastAPI (Python) | Async by default, auto-generates OpenAPI docs |
| ORM | SQLAlchemy 2.0 | Avoids hand-written SQL; Alembic-ready |
| DB | PostgreSQL 16 (SQLite for dev) | Relational fit with CSVs, fast date queries |
| HTTP client | Axios | Robust JSON + error interceptors |

## Smoke test (verified)

The full CRUD cycle was exercised against the seeded DB:

```
GET    /api/health                → 200 {status: ok}
GET    /api/oil-prices            → 200 (24 rows)
GET    /api/oil-prices/2026-02-28 → 200 (with War Begins event embedded)
POST   /api/oil-prices            → 201 (new id=25)
PUT    /api/oil-prices/25         → 200 (brent_usd updated)
DELETE /api/oil-prices/25         → 204
GET    /api/oil-prices/2026-04-01 → 404 (confirmed gone)
GET    /api/state-prices          → 200 (50 rows)
GET    /api/events                → 200 (11 events)
```

## Troubleshooting

**`python: command not found` (macOS)** — use `python3` instead of `python`.
macOS does not alias `python` to `python3` by default.

**`'python' is not recognized` (Windows)** — Python isn't on your PATH.
Re-run the Python installer and tick *"Add python.exe to PATH"*, or use the
full path `C:\Users\<you>\AppData\Local\Programs\Python\Python311\python.exe`.

**`command not found: uvicorn`** — `pip install` put the script in a folder
that isn't on your PATH. Run it through Python instead:
`python -m uvicorn app.main:app --reload --port 8000`. Or use a virtualenv
(`python -m venv .venv` then activate it) so `uvicorn` is auto-resolved.

**`ModuleNotFoundError: No module named 'sqlalchemy'`** — your `python` and
`pip` point at different interpreters. Easiest fix: use a virtualenv (see
Quick start above), or call pip via the matching interpreter:
`python -m pip install -r requirements.txt`.

**`Failed building wheel for psycopg2-binary`** — that's the Postgres driver
and it's only needed if you switch off SQLite. Make sure your
`requirements.txt` doesn't list it (it's in `requirements-postgres.txt` now);
re-run `pip install -r requirements.txt`.

**Frontend shows "Could not reach the API"** — the backend isn't running on
:8000. Bring up terminal #1 and start uvicorn.

**Vite says port 5173 is in use** — kill the previous `npm run dev`, or run
`npm run dev -- --port 5174`.

**PowerShell blocks `Activate.ps1`** — run
`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` once,
then re-try.

**Hot reload not picking up CSS/JSX changes** — hard refresh the browser
(macOS: Cmd+Shift+R; Windows: Ctrl+F5).
