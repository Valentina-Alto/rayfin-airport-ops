# AeroOps — Airport Logistics Command

A demo **airport logistics management** application built on the
[**Rayfin**](https://github.com/microsoft/rayfin) SDK and deployed as a
**Microsoft Fabric App**. It pairs a live operational dashboard — interactive
apron map, fleet, cargo, gates and workforce — with two built-in predictive
models for **gate allocation** and **flight‑disruption risk**.

🌐 **Landing page (GitHub Pages):** <https://valentina-alto.github.io/rayfin-airport-ops/>
&nbsp;·&nbsp; 📦 **Repo:** <https://github.com/Valentina-Alto/rayfin-airport-ops>

> The landing page lives in [`docs/index.html`](docs/index.html). To publish it,
> enable GitHub Pages on this repo: **Settings → Pages → Build from a branch →
> `main` / `/docs`**.

---

## About the app

**AeroOps** is an operations command center for a fictional airport, **AERO
International**. It is a single‑page React app with six views:

| View | What it shows |
|------|---------------|
| **Overview** | KPI strip, an interactive SVG **airfield map** (terminals, piers, runways, taxiways, cargo apron, control tower), a disruption radar and a live flight board. |
| **Gates** | Stand utilisation by terminal and a full gate inventory. |
| **Fleet** | Aircraft inventory with live flight assignment and status filters. |
| **Cargo** | Tonnage by category, priority mix and a shipment manifest. |
| **Workforce** | Headcount by department, shift coverage and the on‑duty roster. |
| **Predictions** | Full output of both predictive models, with rationale. |

The demo runs on a **deterministic, in‑browser mock dataset**
(`src/data/mockData.ts`) so it always renders without a populated backend. The
matching Rayfin data model lives in `rayfin/data/` and is ready to back the UI
once seeded.

### Predictive models

| Model | File | What it does |
|-------|------|--------------|
| **Gate Allocation Optimizer** | `src/models/gateAllocation.ts` | A greedy, constraint‑aware solver that produces **conflict‑free** stand assignments, balancing aircraft size fit, jet‑bridge availability and per‑airline terminal affinity. Returns a confidence score and human‑readable reasons. |
| **Disruption / Delay Risk** | `src/models/disruptionModel.ts` | A transparent logistic model scoring weather, visibility, wind, airfield congestion, turnaround load and current delay into a 0–1 risk, a predicted delay in minutes, and the top contributing factors. |

---

## What is a Microsoft Fabric App?

Traditional enterprise applications live *beside* the data platform: a web app
talks to a custom backend, which talks to a database, which is then copied into
analytics tools. **Fabric Apps make the application itself a native Fabric
workload** — alongside Reports, Lakehouses, SQL, Notebooks, AI and Agents.

> Instead of *integrating* with Fabric, your application **runs natively inside
> it** — inheriting Fabric's security, governance, OneLake storage and analytics
> from day one.

**Fabric App architecture (how it works):**

- **Presentation layer** — any UI technology (React, Angular, Next.js, Power
  Apps, mobile) can consume a Fabric App. *AeroOps uses React + Vite.*
- **Application layer (the Fabric App)** — static hosting (optional),
  authentication, authorization, a GraphQL API and your business logic. Rayfin
  generates and manages these backend services.
- **Operational data** — a managed **Fabric SQL Database** optimized for
  transactional workloads.
- **Fabric platform** — OneLake, Semantic Models, Notebooks, Power BI, Data
  Factory, AI and Agents, all running on **Fabric Capacity**.

---

## Powered by the Rayfin SDK

[**Rayfin**](https://github.com/microsoft/rayfin) is a TypeScript Backend‑as‑a‑Service
for the Fabric App workload. It removes the repetitive infrastructure that
developers otherwise rebuild for every enterprise application — API layer,
authentication, authorization, REST/GraphQL, ORM, database provisioning,
deployment, monitoring — and folds it into the managed Fabric App.

> Rayfin doesn't replace React or .NET — **it replaces the repetitive
> infrastructure** so you focus on your data model and business logic.

**Developer experience — three steps:**

1. **Model your data** with TypeScript decorators (`@entity`, `@text`, `@one`, …).
2. **Define your logic** and access policies (`@authenticated`, row‑level `policy`).
3. **Deploy with one command:** `rayfin up`.

In this project the data model (`rayfin/data/`) defines five entities —
`Gate`, `Aircraft`, `Flight`, `Employee`, `CargoShipment` — registered in
`rayfin/data/schema.ts`. For example:

```ts
@entity()
@authenticated('*')
export class Flight {
  @uuid() id!: string;
  @text({ max: 8 }) flightNumber!: string;
  @set('arrival', 'departure') direction!: 'arrival' | 'departure';
  @date() scheduledTime!: Date;
  @one(() => Gate, { optional: true }) gate?: Gate;
}
```

---

## Getting started

```bash
# Deploy the app backend to Fabric and start the local dev server
npm run dev
```

Open <http://localhost:5173> to view the app.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Deploy app to Fabric and start the local dev server |
| `npm run build` | Production build (`tsc -b && vite build`) |
| `npm run build:fabric` | Build for Fabric deployment |
| `npm run lint` | Lint with ESLint |
| `npm run test` | Run unit tests with Vitest |
| `npm run rayfin:up` | Deploy app to Fabric (no local dev server) |

---

## Project structure

```text
├── docs/
│   └── index.html              # GitHub Pages landing page (Rayfin + Fabric concept)
├── rayfin/
│   ├── rayfin.yml              # Fabric service configuration (auth + data + hosting)
│   └── data/                   # Rayfin entities + schema registration
├── src/
│   ├── pages/HomePage.tsx      # Dashboard shell (tabs)
│   ├── components/dashboard/   # Airport map, tabs and UI primitives
│   ├── data/                   # Airport map geometry + deterministic mock data
│   ├── domain/                 # Shared types + metrics helpers
│   ├── models/                 # Predictive models
│   ├── hooks/useAirportData.ts # Central data + model wiring
│   └── services/               # Auth + Rayfin client (scaffold)
└── package.json
```

---

## Learn more

**Rayfin**
- Rayfin on GitHub — <https://github.com/microsoft/rayfin>
- Rayfin docs — <https://aka.ms/rayfin/docs>
- Rayfin website — <https://aka.ms/rayfin>
- Rayfin templates (awesome‑rayfin) — <https://github.com/microsoft/awesome-rayfin>
- *Introducing Rayfin* (Fabric blog) — <https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Introducing-Rayfin-A-new-AI-first-way-to-build-deploy-and-govern/ba-p/5191676>

**Microsoft Fabric**
- What is Microsoft Fabric? — <https://learn.microsoft.com/en-us/fabric/fundamentals/microsoft-fabric-overview>
- Fabric SQL database overview — <https://learn.microsoft.com/en-us/fabric/database/sql/overview>
- OneLake overview — <https://learn.microsoft.com/en-us/fabric/onelake/onelake-overview>
- Microsoft Build 2026 — Agentic Apps with Fabric & Databases — <https://aka.ms/Azure-Data-Build26>
