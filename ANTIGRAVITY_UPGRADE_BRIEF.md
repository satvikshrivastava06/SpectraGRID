# SpectraGRID — Real Engineering Upgrade Brief
**For: an autonomous coding agent (e.g. Antigravity) working directly in this repository.**
**Do not treat this as inspiration. Treat it as a work order. Execute phases in order. Do not skip ahead.**

---

## 0. Read This Before Touching Anything

This repo is a React/Three.js/GSAP frontend wired to an Express/TypeScript backend that currently
fakes almost all of its "AI" and "physics" with hardcoded strings and threshold `if` statements.
The frontend is good. The backend is a stub. The two are barely connected. Your job is to make the
underlying system real **without changing what the product looks or feels like.**

**Operating rules — non-negotiable:**

1. Never delete, rename, or restructure any file in `src/sections/`, `src/components/`, or
   `src/index.css` unless a task below explicitly says to. You may add new files and new props.
   You may reposition sections in `App.tsx`. You may not remove a section or strip its visuals.
2. Do not add particle effects, shaders, new animations, new dashboard cards, or any other visual
   sophistication. That work is finished. Every phase below is invisible-layer work.
3. Work one phase at a time, in order. After every phase: run `tsc -b` in `spectragrid-app/` and
   `spectragrid-app/server/` (and, from Phase 1 onward, `pytest` in `server/ml-service/`), fix all
   errors, then run the app and click through every section in the nav to confirm nothing visually
   changed or crashed, before starting the next phase. From Phase 1 on, this repo is two runtimes —
   Node/TS and Python — not one; keep the boundary between them at the documented HTTP contract
   (`/physics/expected-power`, `/ml/detect-anomaly`, `/ml/explain`), don't let Node reimplement
   Python logic or vice versa "just this once."
4. Never invent a number to display. If a real value isn't computed yet, either compute it for real
   in that phase, or show a `—` / "pending" state. Do not add a new hardcoded placeholder to replace
   an old one.
5. Every phase has a "Definition of Done" at the bottom of its section. Do not mark a phase complete
   until every item in it is true and verifiable, not just plausible.
6. If you are unsure whether an existing UI string, component, or route is still needed, grep for
   its usages first (see the "dead code" list in Section 2) before deleting it.

---

## 1. Ground Truth — Verified State of This Repo (do not re-derive this, it's already audited)

| Area | File(s) | Verified reality |
|---|---|---|
| Anomaly detection | `server/src/eventEngine.ts` | Two `if` statements on temperature/power thresholds. No model. |
| "SHAP" attribution | `server/src/eventEngine.ts`, `src/store.ts` | Hand-assigned integers (`soilingAttribution = 58`). Not computed from anything. |
| Ghost Generation physics | `server/src/routes/api.ts` (`/api/ghost-generation`) | `capacity × 4.2 × days × 0.95`. No irradiance, temp, tilt, losses, or time series used. |
| Telemetry history | `server/src/db.ts`, `eventEngine.ts` | `db.telemetry = {...db.telemetry, ...telemetry}` — a single mutable object. **No history is ever retained.** Every ingest overwrites the last. A time-based physics calc is currently impossible even in principle. |
| Forecast | `server/src/routes/api.ts` (`/api/forecast`) | `['sunny','mostly_sunny','cloudy','rainy','monsoon'][idx % 5]` — fixed 5-day repeating cycle. |
| Scenario simulator (backend) | `server/src/routes/api.ts` (`/api/simulate`) | Hand-tuned coefficients (`dustAccumulation * 0.28`, etc). **Never called by the frontend.** |
| Scenario simulator (frontend) | `src/sections/GhostReplayUI.tsx` | The exact same formula, coefficients included, duplicated and run client-side instead. |
| Auth | `server/src/routes/auth.ts`, `server/src/data/db.json` | Password check is `=== 'pbkdf2_sha256$password123'` for every user, literally, in the JSON file. Token is `` `jwt-sandbox-token-${user.id}` ``, never verified anywhere. No `jsonwebtoken` package installed. **No login UI exists anywhere in `src/`.** These routes are unreachable by an actual user. |
| API security | `server/src/index.ts` | `app.use(cors())` open to all origins. Zero auth middleware on any route. Every endpoint is publicly writable. |
| Persistence | `server/src/db.ts` | `fs.writeFileSync` to `server/src/data/db.json`. No transactions, no concurrency safety, no time series. |
| Asset graph | `server/src/data/db.json` | 3 campuses, 3 buildings, 2 inverters, **1 array, 1 panel**, total, system-wide. Frontend references "Panel B12," "String 4," "Storage Unit Battery-X1," none of which exist in this file. |
| Frontend↔backend wiring | `src/apiClient.ts` | 7 functions exported. Only `fetchGhostGeneration` is imported/called anywhere in `src/`. The other 6 are dead code. |
| API base URL | `src/apiClient.ts` | Hardcoded `http://localhost:3001`. No env var. Breaks on any real deployment. |
| Validation | entire `server/` | No zod/joi/express-validator anywhere. `req.body` is cast directly to a TS interface with zero runtime checking. |
| Tests | entire repo | Zero test files. |
| Docs | `README.md` | Unedited default Vite scaffold template. |
| Empty scaffolding | `src/data/`, `src/hooks/`, `src/lib/` | Empty directories. |

**Keep, unmodified in spirit:** React 19 + TS, Three.js/R3F/Drei/postprocessing, GSAP, Lenis,
Framer Motion, the visual/section structure, the asset-hierarchy concept, the Ghost Replay concept,
the Decision Panel concept, ESG/ROI layers, the overall narrative.

---

## 2. Dead Code You Will Reconnect, Not Delete

Do not delete these — wire them up in Phase 7:
- `fetchCampuses`, `fetchTelemetry`, `ingestTelemetry`, `triggerSimulation`,
  `fetchRecommendations`, `updateAlertStatus` in `src/apiClient.ts`
- `/auth/login`, `/auth/register` in `server/src/routes/auth.ts`
- `ASSET_CONTEXTS` in `src/store.ts` — becomes the **loading-state fallback shape**, not the
  source of truth, once `fetchCampuses` is wired into `DigitalTwinUI.tsx`.

---

## 3. Phase Plan — Execute in This Order

### Phase 0 — Hygiene (30–60 min, do first, blocks nothing else)
- Add `.env` support (`dotenv`) to `server/`; add `VITE_API_BASE_URL` to a `spectragrid-app/.env`;
  replace the hardcoded `API_BASE` in `src/apiClient.ts` with `import.meta.env.VITE_API_BASE_URL`.
- Rewrite `README.md` for real: what this is, current honest capability level (see Section 6),
  how to run frontend + backend, env vars required.
- Add `node_modules/`, `dist/`, `.env` to source control hygiene (already in `.gitignore` — just
  make sure future zips/exports don't re-include them).
- **Scaffold the new Python service** at `server/ml-service/` (FastAPI + `pvlib` + `pandas` +
  `scikit-learn` + `shap`, `requirements.txt`, a `Dockerfile`, and a `/health` endpoint). Add it to
  a root `docker-compose.yml` alongside the future Postgres/Timescale container (Phase 4). Add
  `ML_SERVICE_URL` to `server/.env`. This repo is now two runtimes (Node + Python), not one — plan
  for that explicitly rather than let the boundary blur later.

**Done when:** app still runs identically with `VITE_API_BASE_URL` set via env, not hardcoded, and
`docker-compose up` brings up an empty-but-responding `ml-service` alongside the existing Node app.

---

### Phase 1 — Data Foundation + Real Ghost Generation (pvlib physics, in `ml-service`)

**Blocking prerequisite:** telemetry history currently doesn't exist. Add it first, in the Node app:
- Change `db.telemetry` from a single object to `db.telemetryLog: TelemetryRecord[]` where each
  record has a `timestamp`. Append on every ingest instead of overwriting. Keep the current single
  "latest" object too if UI needs it, but log everything.

**1a. Build the canonical dataset.** Location: `server/ml-service/data/`. Structure exactly as
four related tables, not one flat CSV:

- `telemetry.csv` — `timestamp, asset_id, irradiance_ghi, irradiance_dni, irradiance_dhi,
  ambient_temperature, module_temperature, humidity, wind_speed, rainfall, dc_voltage, dc_current,
  dc_power, ac_voltage, ac_current, ac_power, frequency, power_factor, inverter_temperature,
  inverter_efficiency, status, fault_code`
- `asset_metadata.csv` — `asset_id, campus_id, building_id, rooftop_id, array_id, string_id,
  inverter_id, capacity_kwp, panel_count, panel_model, panel_efficiency, temperature_coefficient,
  tilt_deg, azimuth_deg, inverter_capacity_kw, inverter_model, commission_date`
- `fault_events.csv` — `event_id, asset_id, start_time, end_time, fault_type, severity, root_cause,
  affected_capacity_kw, ground_truth`
- `maintenance.csv` — `maintenance_id, asset_id, timestamp, action, reason, cost, downtime_minutes,
  technician, resolution`

Data sources, three layers:
1. **Weather/environment — NASA POWER.** Use `pvlib.iotools.get_nasa_power(latitude, longitude,
   start, end, parameters=['ghi','dni','dhi','temp_air','wind_speed'])`, hourly resolution, for
   Jabalpur's coordinates (already in `db.json` as `camp-1`: lat 23.18, lng 79.98). This is a real
   pvlib-native integration against `https://power.larc.nasa.gov/api/temporal/hourly/point` — don't
   hand-roll the HTTP call, use the pvlib function.
2. **Real PV operational behavior — NREL PVDAQ** (via OEDI, Parquet on AWS, 15-minute field data
   with system metadata). Use this **only** to learn realistic electrical fault signatures
   (voltage/current/frequency/power-factor behavior during inverter faults, grid events, sensor
   dropouts) — equipment electronics generalize across geographies. **Do not** carry over PVDAQ's
   soiling frequency/severity distribution as if it applies to Jabalpur; US-site soiling patterns
   are not representative of Indian monsoon-climate dust accumulation. Soiling ground truth should
   come from your own synthetic injection (below), tuned to local seasonality if you have any
   qualitative sense of it (dry-season accumulation, monsoon washing).
3. **Fault ground truth — synthetic injection, done carefully.** Take healthy telemetry (physics
   expected output, computed via `pvlib.modelchain.ModelChain` using the NASA POWER weather series
   + `asset_metadata` — see 1b below) and deliberately perturb it per fault type. **Each fault type
   needs a physically distinct signature, not a uniform multiplier** — a flat `power *= 0.7` for
   every fault type is a trap: a classifier will learn to detect your multiplication artifact
   instead of the fault, and will fail completely on real data later. Minimum required distinctions:
   - `SOILING`: DC current drops proportionally to irradiance, slow drift over days, voltage
     ~unaffected.
   - `SHADING`: partial, time-of-day-correlated (worse at low sun angles), string-level not panel-level.
   - `INVERTER_DEGRADATION`: efficiency droop correlated with inverter temperature, not irradiance.
   - `INVERTER_TRIP`: hard zero, sudden onset/offset, unlike a gradual physical loss.
   - `GRID_VOLTAGE_EVENT`: AC voltage/frequency excursion, DC side largely unaffected.
   - `SENSOR_FAILURE` / `COMMUNICATION_FAILURE`: flatlined or clipped values, not a smooth physical curve.
   - `PARTIAL_STRING_FAILURE`: one string's contribution drops to near-zero while others stay nominal.
   - `TEMPERATURE_DERATING`, `CLOUD_TRANSIENT`: fast, irradiance-correlated dips distinct from soiling's slow drift.

   Target distribution (do not deviate toward a "balanced" dataset — it must stay realistic):
   Normal 70–80%, Soiling 5–10%, Shading 3–5%, Inverter degradation 3–5%, Inverter trip 2–3%,
   Grid events 2–3%, Sensor anomalies 2–3%, remainder split across the rest.

   Sizing target: ~2 years × 15-minute intervals × ~10 virtual assets ≈ 700k telemetry rows. Don't
   go bigger than this for the prototype; it doesn't buy you anything yet.

- Build the hierarchy in `asset_metadata.csv` to match `SpectraGRID → Jabalpur Campus → {buildings}
  → rooftops → arrays → strings → inverters` — this becomes the literal seed for Phase 3's asset
  graph, so get the asset IDs right here once instead of inventing them twice.
- **Train/test split: by time window and by whole fault-event instance, never by random row.**
  Telemetry autocorrelates; a random split leaks the same injected event into both sides and makes
  your later model-evaluation numbers meaningless. Hold out entire months and entire fault events.
- Note NASA POWER / NREL data usage terms exist — check and credit them in the README once this
  ships; don't skip attribution just because it's free.

**1b. Physics model — real pvlib, in `ml-service`, not TypeScript.**
- New file: `server/ml-service/physics/pv_model.py`, using `pvlib.location.Location`,
  `pvlib.pvsystem.PVSystem`, and `pvlib.modelchain.ModelChain` with a real cell-temperature model
  (Sandia or PVsyst, from `pvlib.temperature`) driven by the NASA POWER weather series and the
  `asset_metadata` config (tilt, azimuth, capacity, panel/inverter specs). This produces genuine
  expected AC power, not an approximation.
- Expose `POST /physics/expected-power` on the FastAPI service: input = asset config + a weather/
  telemetry window; output = expected power time series. This is the endpoint the Node backend
  calls — Node owns orchestration/persistence, Python owns the physics and ML.
- In `server/src/routes/api.ts`, replace the body of `GET /api/ghost-generation` with a call to
  `ML_SERVICE_URL/physics/expected-power`, using the retained telemetry log (added above) as actual
  production, and compute `ghost = expected − actual` server-side in Node from the response. Delete
  the `dailyIdealOutputPerKwp = 4.2` constant entirely.
- If the telemetry log doesn't yet cover the full requested period, return `dataCompletenessPct`
  instead of silently extrapolating with a flat multiplier.

**Done when:** two different weather/telemetry windows (different irradiance/temp profiles) produce
two different expected-output numbers from `ml-service`, the number changes when tilt/azimuth
config changes, and `pvlib` — not a hand-rolled formula — is doing the calculation.

---

### Phase 2 — Real Anomaly Detection + Real SHAP (in `ml-service`)

Two separate models with two separate jobs — don't blur them:

- **Model 1 — anomaly detector.** `sklearn.ensemble.IsolationForest`, trained on the `Normal`-
  labeled rows of the Phase 1 dataset. Job: yes/no (plus a continuous anomaly score), nothing more.
- **Model 2 — root-cause classifier.** `sklearn.ensemble.GradientBoostingClassifier` (or
  LightGBM if installed) trained on the labeled fault classes from `fault_events.csv`. Job: given
  an anomalous sample, output real per-class probabilities across `{soiling, shading,
  inverter_degradation, inverter_trip, grid_voltage_event, sensor_failure, partial_string_failure,
  temperature_derating, cloud_transient}`.
- **Explanations attach to Model 2, not Model 1.** Use `shap.TreeExplainer` (the real `shap`
  package, not a reimplementation) on the trained classifier. This is the well-supported pairing —
  don't try to force SHAP onto the Isolation Forest's raw score; that's a different, murkier
  problem you don't need to solve for this product.
- Required evaluation, not optional: precision/recall **per fault class** (not aggregate accuracy —
  aggregate accuracy is close to free with a 70–80% normal class and tells you nothing), a
  confusion matrix, and a calibration check on the confidence output (reliability curve — don't
  ship a raw softmax as "confidence" and call it calibrated, it usually isn't). Store these metrics
  alongside the model artifact.
- Expose on the FastAPI service:
  - `POST /ml/detect-anomaly` — telemetry sample in, `{isAnomalous, anomalyScore}` out.
  - `POST /ml/explain` — telemetry sample in, `{rootCause: {class: probability}, shapAttribution:
    {feature: value}, confidence}` out, with `confidence` coming from the calibrated model, not a
    hardcoded number.
- Persist trained model artifacts + a version tag + training date + the evaluation metrics under
  `server/ml-service/models/`. Log every retrain to `auditLogs` via a callback to the Node API.
- In `server/src/eventEngine.ts`: replace the two `if (temperature > 70)` / `if (irradiance > 700
  && power < 1.5)` checks with a call to `ML_SERVICE_URL/ml/detect-anomaly`; replace the hand-
  assigned `soilingAttribution = 58` block and the `causeString` template literal with a call to
  `ML_SERVICE_URL/ml/explain` and use its real output verbatim.

**Done when:** feeding two different telemetry samples into `/ml/explain` produces two different,
non-hardcoded attribution breakdowns; per-class precision/recall are recorded and reviewable, not
just an aggregate accuracy number; and the Shapley outputs satisfy the efficiency property
(sum of attributions ≈ model output − baseline) — `shap` guarantees this if used correctly, so a
failure here means a wiring bug, not a modeling choice.

---

### Phase 3 — Real Asset Graph
- Turn the hierarchy already implied by the frontend into real entities:
  `Organization → Campus → Building → Rooftop → Array → String → Panel`, plus `Inverter`, `Battery`.
- Every asset name the frontend currently hardcodes in `ASSET_CONTEXTS`
  (`Panel B12`, `String 4`, `Inverter 01`, `Inverter 02`, `Storage Unit Battery-X1`,
  `Block-A Rooftop`) must become an actual row with a real ID.
- Telemetry records must reference a real `assetId`, not be a single global blob.

**Done when:** `GET /api/campuses` returns a tree that, when walked, contains every asset name the
UI currently displays, with no gaps.

---

### Phase 4 — Real Persistence
- Postgres + TimescaleDB (Docker Compose for local dev). Prisma (or Drizzle) for schema/CRUD on
  relational tables; raw SQL migration to create a hypertable for the telemetry table specifically.
- Tables: `organizations, campuses, buildings, rooftops, arrays, strings, panels, inverters,
  batteries, telemetry, weather, anomalies, incidents, root_causes, recommendations,
  maintenance_work_orders, model_versions, audit_logs`.
- Write a one-time migration script that imports the current `db.json` content as seed data, then
  retire `db.json` / `db.ts` **only after** the migration is verified against a full read-through
  of every endpoint.

**Done when:** killing the Node process and restarting it does not lose any data written during
the session (proves it's a real DB, not the JSON cache).

---

### Phase 5 — Real Auth (and actually wiring it into the UI — nothing in the repo does this today)
- `bcrypt` (or `argon2`) to hash on register, verify on login.
- `jsonwebtoken` to sign/verify a real JWT with a real secret from `.env`.
- `requireAuth` middleware applied to all `/api/*` routes except `/health`. `requireRole(...)`
  middleware for role-gated actions.
- Roles: Operator, Maintenance, Facility Manager, Finance, ESG, Admin — enforced server-side, not
  just displayed.
- **New frontend work (not in the original roadmap, but required — there is currently no login UI
  at all):** build `src/components/auth/LoginGate.tsx` using the existing dark/cyan/amber/monospace
  design language already established elsewhere in the app — don't invent a new visual style for
  it. Store the session as an httpOnly cookie (preferred) or short-lived in-memory token + refresh;
  avoid `localStorage` for the auth token given XSS exposure. Attach the session to every
  `apiClient.ts` call.

**Done when:** a logged-out user cannot see campus data, an Operator cannot access Admin-only
actions server-side (test by calling the API directly, not just hiding the button in UI), and
there is an actual screen a human can use to log in.

---

### Phase 6 — Real Decision Engine
Replace hardcoded recommendation text blocks in `eventEngine.ts` / `store.ts` with a real pipeline:
```
Anomaly → expected energy deficit (Phase 1) → root-cause probabilities (Phase 2)
→ recovery potential → maintenance cost lookup → downtime risk → carbon impact → ROI
→ ranked list of interventions, each with: expected recovery (kWh/day), cost, payback period,
  confidence (from the model, not invented)
```
Rank and return multiple candidate actions, not one hardcoded string.

**Done when:** the Decision Panel shows at least two ranked options for a given incident, with
numbers traceable to Phase 1/2 outputs, not literals.

---

### Phase 7 — Wire the Frontend to the Real Backend (this is the biggest structural fix)
- `GhostReplayUI.tsx`: delete the duplicated scenario formula; call `triggerSimulation` from
  `apiClient.ts` instead and render its response.
- `DigitalTwinUI.tsx`: call `fetchCampuses` on mount; use `ASSET_CONTEXTS` only as the loading-state
  skeleton while the real fetch resolves, not as the permanent data source.
- `Recommendations.tsx`: call `fetchRecommendations`.
- Alerts UI (`IncidentTimeline.tsx` / wherever alerts render): call `updateAlertStatus` on
  resolve/ack actions instead of mutating local `useState` only.
- The client-side telemetry random-walk in `DigitalTwinUI.tsx`: keep it as the **simulated sensor
  source** (fine for a demo without real hardware), but pipe its output through `ingestTelemetry`
  so the backend pipeline (Phases 1–2) actually processes it, instead of the UI computing its own
  parallel narrative.

**Done when:** opening the browser network tab during a full click-through of every section shows
a request for every section that displays dynamic data — not just Ghost Generation.

---

### Phase 8 — Security Hardening
- `helmet`, `express-rate-limit` on the Express app.
- `zod` schemas validating every request body/query before it reaches business logic; reject with
  400 on invalid input instead of letting `NaN`/`undefined` propagate.
- CORS allowlist (env-driven), not open `cors()`.

**Done when:** POSTing a malformed body to any endpoint returns a clean 400, not a crash or a
silently corrupted record.

---

### Phase 9 — Tests
- `ml-service` (pytest): known-input/known-output tests for `pv_model.py`; per-class precision/
  recall assertions for the anomaly + root-cause classifiers against a held-out time window; the
  SHAP efficiency-property check.
- `server` (Node, e.g. vitest/jest): the ghost-generation route calling a mocked `ml-service`
  response correctly; auth middleware rejecting unauthenticated/wrong-role requests; zod validation
  rejecting malformed bodies.
- Frontend: a smoke test (Playwright, which Antigravity can drive directly via its browser control)
  that loads every section in the nav and asserts no console errors and no visual regression versus
  the current build.

**Done when:** `npm test` passes in both `spectragrid-app/` and `server/`, and the Playwright smoke
test completes a full section click-through with zero errors.

---

### Phase 10 — Terminology Correction (mechanical, low-risk, do whenever convenient — not blocking)
Only relabel a term once the phase that makes it true is actually done. Don't do this pass early.

| Current UI/code term | Replace with | Only after |
|---|---|---|
| "SHAP" (before Phase 2 lands) | "Heuristic attribution" | — |
| "SHAP" (after Phase 2 lands) | Keep "SHAP" — now true | Phase 2 |
| "RUL" | "Estimated maintenance horizon" | until a survival/degradation model exists |
| "AI forecast" | "Simulated forecast" | until real forecasting exists |
| "Physics calibration matches pvlib" (before Phase 1 lands) | Remove entirely — you don't use pvlib yet | — |
| "Physics calibration matches pvlib" (after Phase 1 lands) | Keep — now literally true | Phase 1 |
| "Causal / cascade intelligence" | "Rule-based causal attribution" | until Phase 6 |

---

## 4. Verification Protocol (run after every phase, not just at the end)
1. `cd spectragrid-app && tsc -b` — zero errors.
2. `cd server && tsc -b` (or equivalent) — zero errors.
3. From Phase 1 onward: `docker-compose up`, then `curl $ML_SERVICE_URL/health` returns healthy,
   and `pytest` in `server/ml-service/` passes (add tests for the physics model and the Shapley
   efficiency property as soon as each exists — don't defer all Python tests to Phase 9).
4. Run both dev servers, click through every nav section, confirm no visual regression.
5. Run the full test suite once Phase 9 exists; before that, manually curl every touched endpoint.
6. Do not proceed to the next phase on a failing build, in either language.

---

## 5. Honesty Check — What You Should Be Able to Say When This Is Done

Before this brief, the only accurate description of this repo was:

> "SpectraGRID is an interactive prototype using simulated telemetry, deterministic scenario
> analysis, heuristic anomaly detection, and a hierarchical digital-twin visualization to
> demonstrate an intended production architecture — with most of the backend not actually
> connected to the frontend."

After Phases 1–7 are genuinely complete (not "mostly," not "looks done" — genuinely verifiable
against Section 4), the accurate description becomes:

> "SpectraGRID is a full-stack renewable asset intelligence platform with a physics-based expected
> generation model, a trained anomaly-detection and root-cause pipeline with real Shapley-value
> explanations, a persisted asset graph and time-series telemetry store, and a decision engine that
> ranks interventions by real projected recovery, cost, and confidence."

Do not let the UI claim the second description until the code actually earns it.
