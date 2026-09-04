# ⚡ SpectraGRID — Autonomous Solar & Energy Asset Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![CI](https://github.com/satvikshrivastava06/SpectraGRID/actions/workflows/ci.yml/badge.svg)](https://github.com/satvikshrivastava06/SpectraGRID/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

SpectraGRID is a full-stack decision-intelligence platform for solar energy infrastructure. It merges physical solar modeling (`pvlib`), live weather data, machine-learning fault detection with explainable attribution, and a cost/carbon-aware recommendation engine behind an interactive 3D digital twin.

> **The core idea — Ghost Generation.** Most monitoring dashboards can tell you an inverter is online. They can't tell you it's *underperforming*. SpectraGRID computes what a solar array *should* have produced from physics and live weather, compares it against what it actually produced, and treats the gap — Ghost Generation — as the platform's primary metric: attributed to a cause, priced in ₹ and kg CO₂, and paired with a costed recommendation.

---

## 🌟 Key Features

- **🌐 Digital Twin Command Center** — Interactive 3D modeling of solar arrays, inverters, and grid infrastructure, built on Three.js & React Three Fiber.
- **⚡ Ghost Generation Engine** — Physics-based expected yield (`pvlib`) compared against actual output in real time, converted into a ₹ revenue-loss and kg-CO₂ figure.
- **🧠 Explainable Fault Attribution** — An IsolationForest anomaly model with a SHAP explainer attributes energy loss to a root cause (soiling, thermal derating, inverter fault, grid instability). If the ML service is ever unreachable, the pipeline **falls back to a threshold heuristic automatically** and labels its own output honestly — the UI tells you which one actually ran.
- **🎯 Dynamic ROI Decision Gate** — Not just an alert: for deferrable faults (like soiling), the system pulls a live rain forecast and compares the cost of acting now against the cost of waiting for a natural wash. Positive-ROI actions are auto-ticketed; the reasoning behind every decision is shown, not just the outcome.
- **📊 6-Stage Telemetry Stream**:
  1. *Ghost Generation Engine* — Real-time yield expectation & gap detection
  2. *Twin Dashboard* — Asset hierarchy overview & live metrics
  3. *Infrastructure Simulator* — "What If?" stress simulation engine
  4. *Climate Impact Intelligence* — Environmental factor decomposition & weather correlations
  5. *Infrastructure Observability* — Deep diagnostics & active alert monitoring
  6. *Deploy Twin Instance* — Rapid deployment & configuration HUD
- **🛡️ Security & RBAC** — bcrypt-only password hashing (no legacy fallback path), JWT auth over httpOnly cookies, four-role RBAC (`Operator`, `Administrator`, `Manager`, `Auditor` — the last is enforced read-only, including on state-mutating routes), Zod request validation, rate limiting, and Helmet header hardening.
- **⏱️ Time-Series Data Layer** — A single-writer JSON file store behind a stable async data-access seam, chosen for prototype simplicity. A Prisma schema and TimescaleDB hypertable strategy are fully designed and mid-migration — see [Roadmap](#-roadmap).

---

## 🏗️ System Architecture

```
                          ┌────────────────────────────────┐
                          │        React 19 Frontend        │
                          │  (Vite, Three.js, Tailwind,     │
                          │   GSAP, Framer Motion, Lenis)   │
                          └────────────────┬─────────────────┘
                                           │ REST APIs / JWT (httpOnly cookie)
                                           ▼
                          ┌────────────────────────────────┐
                          │    Node.js / Express Server     │
                          │  (TypeScript, Zod, Helmet,      │
                          │      Auth / RBAC)               │
                          └──┬──────────────┬─────────┬─────┘
                             │              │         │
                  Internal proxy   Open-Meteo API   JSON file
                   (anomaly /            │           store
                  physics calls)         ▼
                             │   (live 7-day forecast
                             ▼      + rain probability
      ┌────────────────────────────┐  for the ROI gate)
      │  Python ML & Physics       │
      │  Service (FastAPI, pvlib,  │
      │  scikit-learn, SHAP)       │
      └─────────────────────────────┘
```

The physics/anomaly path and the forecast path are intentionally separate: `/api/forecast` calls Open-Meteo directly for a real 7-day outlook, while the ghost-generation physics engine currently runs on a generated irradiance curve rather than live satellite data — that gap is tracked honestly below, not papered over in the diagram.

---

## 🛠️ Tech Stack

| Tier | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Three.js / React Three Fiber, GSAP, Framer Motion, Lenis Scroll, Lucide React, Tailwind CSS |
| **Backend API** | Node.js, Express, TypeScript, Zod, Express Rate Limit, Helmet, JSON Web Tokens (JWT), bcryptjs |
| **ML & Physics** | Python 3.11+, FastAPI, `pvlib`, `scikit-learn` (IsolationForest), `shap`, `pandas`, `numpy` |
| **Weather** | Open-Meteo (live, no API key required) |
| **Database** | Local JSON File Store (prototype), Prisma schema + TimescaleDB hypertable defined, migration in progress |
| **CI** | GitHub Actions — build, lint, and test on every push (frontend, backend, ML service) |
| **Infrastructure** | Docker, Docker Compose, deployed via Render (API + ML service) and Netlify (frontend) |

---

## ⚙️ Environment Configuration

### Frontend (`spectragrid-app/.env`)
```env
VITE_API_BASE_URL=http://localhost:3001
```

### Express Server (`spectragrid-app/server/.env`)
```env
PORT=3001
ML_SERVICE_URL=http://localhost:8000
JWT_SECRET= # generate with: openssl rand -hex 32
DATABASE_URL=postgresql://spectragrid:spectragrid@localhost:5432/spectragrid_db
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: `v18.x` or higher
- **Python**: `v3.10` or higher
- **Docker**: For running TimescaleDB PostgreSQL database

---

### Step 1: Start Python ML & Physics Service
```bash
cd spectragrid-app/server/ml-service
pip install -r requirements.txt
python models/train_models.py   # trains baseline models once
python main.py
```
*Service runs on [http://localhost:8000](http://localhost:8000)*

---

### Step 2: Start Node/Express Server
```bash
cd spectragrid-app/server
npm install
npm run dev
```
*API server runs on [http://localhost:3001](http://localhost:3001)*

---

### Step 3: Start Frontend Application
```bash
cd spectragrid-app
npm install
npm run dev
```
*Frontend runs on [http://localhost:5173](http://localhost:5173)*

---

### In progress: Postgres migration
```bash
docker-compose up timescaledb -d
cd spectragrid-app/server
npx prisma migrate dev --name init
psql postgresql://spectragrid:spectragrid@localhost:5432/spectragrid_db \
  -f prisma/migrations/timescaledb_hypertables.sql
npm run db:seed
```
The data-access layer is already behind a stable function seam (`src/db.ts`), so this migration converts one function at a time without touching route logic — see [Roadmap](#-roadmap) for current progress.

---

## 🐳 Docker Compose (One-Command Full Stack)

```bash
docker-compose up --build
```

Services initialize in dependency order: `timescaledb` ➔ `ml-service` + `server` ➔ `spectragrid-app`

---

## 🧪 Testing & CI

Every push and pull request against `main` runs three parallel jobs:

| Job | Checks |
|---|---|
| **Backend** | TypeScript build, then targeted tests covering auth (no bypass on non-bcrypt paths), RBAC enforcement on `/api/alerts`, audit-log identity correctness, and the ML-service fallback path |
| **Frontend** | Lint (`oxlint`) + production build |
| **ML Service** | `pytest` against the physics engine (`pvlib` expected-output calculations) |

---

## 🔐 Authentication & Pre-configured Accounts

JWT-based auth over an httpOnly cookie. Standard test accounts pre-seeded in the system (password: `password123`):

| Email | Role | Access Privileges |
|---|---|---|
| `ops@spectragrid.ai` | `Operator` | Live telemetry access, scenario stress simulation |
| `admin@spectragrid.ai` | `Administrator` | Full system control, user management, configuration |
| `exec@spectragrid.ai` | `Manager` | Executive dashboards, financial metrics, export |
| `auditor@esg.org` | `Auditor` | Read-only — enforced at the route level, not just the UI |

---

## 📑 REST API Specification

| Route | Method | Access | Description |
|---|---|---|---|
| `/api/auth/login` | `POST` | Public | Authenticates user & issues JWT |
| `/api/auth/register` | `POST` | Public | Registers new user account |
| `/api/auth/me` | `GET` | Authenticated | Retrieves current authenticated profile |
| `/api/campuses` | `GET` | Authenticated | Fetches full asset hierarchy tree |
| `/api/telemetry` | `GET` | Authenticated | Real-time telemetry feed snapshot |
| `/api/telemetry-ingest` | `POST` | Authenticated | Ingests telemetry & executes the anomaly/ROI pipeline |
| `/api/ghost-generation` | `GET` | Authenticated | Expected physics yield vs. actual energy |
| `/api/forecast` | `GET` | Authenticated | Live 7-day weather & production forecast (Open-Meteo) |
| `/api/simulate` | `POST` | Operator+ | Runs "What If?" stress scenarios |
| `/api/recommendations` | `GET` | Authenticated | AI-generated, ROI-gated decision recommendations |
| `/api/alerts` | `POST` | Operator+ | Acknowledges or resolves asset alerts (Auditor role is read-only here by design) |

---

## 🚧 Known Limitations

Documented deliberately, not discovered by a reviewer:

- **Mocked Data Layer**: TimescaleDB and Prisma are fully schema-designed but not yet the live data path — see [Roadmap](#-roadmap) for migration status.
- **Single-Tenant Structure**: The system operates on a single-tenant design by choice; a multi-tenant hierarchy isn't built because nothing in this prototype yet needs one.
- **Synthetic Model Training**: The anomaly model and SHAP explainer are trained on synthetic seed data, not real historical fleet telemetry.
- **Simulated Ghost-Generation Weather**: The physics engine's expected-yield calculation currently runs on a generated irradiance curve rather than live satellite/weather data — `/api/forecast` is the one endpoint on real weather today.

---

## 🗺️ Roadmap

- [ ] Convert remaining `db.ts` functions from the JSON store to Prisma (auth pair converted first; asset hierarchy and telemetry next)
- [ ] Provision and migrate to a live Postgres + TimescaleDB instance in production
- [ ] Replace synthetic ML training data with a real public solar telemetry dataset
- [ ] Wire live weather into the ghost-generation physics path, not just the forecast panel

---

## 📄 License

Distributed under the MIT License.

---

## 👨‍💻 Maintainer & Repository

- **Repository**: [https://github.com/satvikshrivastava06/SpectraGRID.git](https://github.com/satvikshrivastava06/SpectraGRID.git)
- **Author**: Satvik Shrivastava
