# ⚡ SpectraGRID — Autonomous Solar & Energy Asset Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.0-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TimescaleDB](https://img.shields.io/badge/TimescaleDB-PostgreSQL_15-FDB813?logo=postgresql&logoColor=white)](https://www.timescale.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

SpectraGRID is an enterprise-grade, full-stack autonomous decision engine and digital twin platform for utility-scale and commercial/industrial solar energy infrastructure. It merges physical solar modeling (`pvlib`), real-time weather integration (NASA POWER API), machine-learning fault detection (IsolationForest & RandomForest), Shapley-value explainable AI attributions, and immersive 3D telemetry visualization.

---

## 🌟 Key Features

- **🌐 Digital Twin Command Center**: Interactive 3D physical modeling of solar arrays, inverters, and grid infrastructure powered by Three.js & React Three Fiber.
- **⚡ Ghost Replay™ & Expected Generation**: Real-time comparison of expected vs. actual energy yield using `pvlib` physics calculations driven by live weather telemetry.
- **🧠 Explainable AI (XAI) Attribution**: SHAP (Shapley Additive exPlanations) attribution panels explaining root causes for energy anomalies (inverter clipping, panel degradation, shading, thermal loss).
- **📊 6-Stage Telemetry Stream**:
  1. *Ghost Generation Engine* — Real-time yield expectation & gap detection
  2. *Twin Dashboard* — Asset hierarchy overview & live metrics
  3. *Infrastructure Simulator* — "What If?" stress simulation engine
  4. *Climate Impact Intelligence* — Environmental factor decomposition & weather correlations
  5. *Infrastructure Observability* — Deep diagnostics & active alert monitoring
  6. *Deploy Twin Instance* — Rapid deployment & configuration HUD
- **🛡️ Enterprise Security & RBAC**: JWT authentication with Role-Based Access Control (`Operator`, `Administrator`, `Manager`, `Auditor`), Zod request validation, rate limiting, and Helmet security header hardening.
- **⏱️ Time-Series Data Layer**: TimescaleDB hypertable integration on PostgreSQL 15 managed via Prisma ORM v7.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      React 19 Frontend        │
                                  │ (Vite, Three.js, Tailwind,    │
                                  │  GSAP, Framer Motion, Lenis)  │
                                  └───────────────┬───────────────┘
                                                  │ REST APIs / JWT
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │   Node.js / Express Server    │
                                  │ (TypeScript, Zod, Helmet,     │
                                  │   Prisma ORM v7, Auth/RBAC)   │
                                  └──────┬─────────────────┬──────┘
                                         │                 │
                      Internal Proxy / REST               Database Queries
                                         │                 │
                                         ▼                 ▼
  ┌────────────────────────────────────────┐     ┌────────────────────────────────┐
  │      Python ML & Physics Service       │     │     TimescaleDB / PostgreSQL   │
  │ (FastAPI, pvlib, scikit-learn, SHAP)   │     │ (Asset Hierarchy & Time-Series │
  └──────────────────┬─────────────────────┘     │         Telemetry Data)        │
                     │                           └────────────────────────────────┘
                     ▼
  ┌────────────────────────────────────────┐
  │            NASA POWER API              │
  │   (Global Meteorological Telemetry)    │
  └────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Tier | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Three.js / React Three Fiber, GSAP, Framer Motion, Lenis Scroll, Lucide React, Tailwind CSS |
| **Backend API** | Node.js, Express, TypeScript, Zod, Express Rate Limit, Helmet, JSON Web Tokens (JWT), bcryptjs |
| **ML & Physics** | Python 3.11+, FastAPI, `pvlib`, `scikit-learn` (IsolationForest, RandomForest), `shap`, `pandas`, `numpy` |
| **Database** | PostgreSQL 15, TimescaleDB Hypertables, Prisma ORM v7 |
| **Infrastructure** | Docker, Docker Compose |

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
JWT_SECRET=spectragrid_antigravity_secret_key_2026
DATABASE_URL=postgresql://spectragrid:spectragrid@localhost:5432/spectragrid_db
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: `v18.x` or higher
- **Python**: `v3.10` or higher
- **Docker**: For running TimescaleDB PostgreSQL database

---

### Step 1: Database Setup (TimescaleDB & Prisma)
```bash
# Start TimescaleDB container
docker-compose up timescaledb -d

# Navigate to server directory
cd spectragrid-app/server

# Run Prisma schema migrations
npm run db:migrate

# Apply TimescaleDB hypertable setup
psql postgresql://spectragrid:spectragrid@localhost:5432/spectragrid_db \
  -f prisma/migrations/timescaledb_hypertables.sql

# Seed initial database assets & user accounts
npm run db:seed
```

---

### Step 2: Start Python ML & Physics Service
```bash
# Navigate to ML service directory
cd spectragrid-app/server/ml-service

# Install Python dependencies
pip install -r requirements.txt

# Train baseline ML models (run once)
python models/train_models.py

# Start FastAPI server
python main.py
```
*Service will be running on [http://localhost:8000](http://localhost:8000)*

---

### Step 3: Start Node/Express Server
```bash
# Navigate to server directory
cd spectragrid-app/server

# Install dependencies
npm install

# Start Express server in dev mode
npm run dev
```
*API Server will be running on [http://localhost:3001](http://localhost:3001)*

---

### Step 4: Start Frontend Application
```bash
# Navigate to frontend root
cd spectragrid-app

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend application will be accessible at [http://localhost:5173](http://localhost:5173)*

---

## 🐳 Docker Compose (One-Command Full Stack)

To build and run all services (TimescaleDB, ML Service, Node Server, and React Frontend) together:

```bash
docker-compose up --build
```

Services will initialize in dependency order:
`timescaledb` ➔ `ml-service` + `server` ➔ `spectragrid-app`

---

## 🔐 Authentication & Pre-configured Accounts

Authentication uses JWT Bearer Tokens. Standard test accounts pre-seeded in the system (password: `password123`):

| Email | Role | Access Privileges |
|---|---|---|
| `ops@spectragrid.ai` | `Operator` | Live telemetry access, scenario stress simulation |
| `admin@spectragrid.ai` | `Administrator` | Full system control, user management, configuration |
| `exec@spectragrid.ai` | `Manager` | Executive dashboards, financial metrics, export |
| `auditor@esg.org` | `Auditor` | Read-only compliance audit & telemetry logs |

---

## 📑 REST API Specification

| Route | Method | Access | Description |
|---|---|---|---|
| `/api/auth/login` | `POST` | Public | Authenticates user & issues JWT |
| `/api/auth/register` | `POST` | Public | Registers new user account |
| `/api/auth/me` | `GET` | Authenticated | Retrieves current authenticated profile |
| `/api/campuses` | `GET` | Authenticated | Fetches full asset hierarchy tree |
| `/api/telemetry` | `GET` | Authenticated | Real-time telemetry feed snapshot |
| `/api/telemetry-ingest` | `POST` | Authenticated | Ingests telemetry & executes ML pipeline |
| `/api/ghost-generation` | `GET` | Authenticated | Expected physics yield vs actual energy |
| `/api/simulate` | `POST` | Operator+ | Runs "What If?" stress scenarios |
| `/api/recommendations` | `GET` | Authenticated | Generates AI decision recommendations |
| `/api/alerts` | `POST` | Authenticated | Acknowledges or resolves asset alerts |

---

## 📄 License

Distributed under the MIT License.

---

## 👨‍💻 Maintainer & Repository

- **Repository**: [https://github.com/satvikshrivastava06/SpectraGRID.git](https://github.com/satvikshrivastava06/SpectraGRID.git)
- **Author**: Satvik Shrivastava
