# Observability Monitoring Platform (Frontend Demo)

A high-fidelity, pure frontend simulation of a full-stack observability platform (Metrics, Tracing, Logs). This project demonstrates complex mock data generation algorithms to emulate real-world traffic, latency, and system topology without a backend.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/vue-3.x-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

## 🌟 Core Features

### 1. The "Virtual Backend"
Unlike typical dashboards that consume static JSON, this project runs a sophisticated simulation engine in the browser:
- **Math-based Metrics**: Uses sine waves, noise factors, and probability-based anomaly injection to generate "organic" CPU/Memory/Latency curves.
- **Recursive Tracing**: Generates distributed trace trees with parent-child relationships, randomized depth, and service dependencies.
- **Correlated Logs**: Log entries are generated with specific Trace IDs to allow deep-linking from Traces to Logs.

### 2. Three Pillars of Observability
- **📈 Metrics Dashboard**: Real-time visualization using Apache ECharts. Features dual-axis trend charts and sparklines.
- **🔗 Distributed Tracing**: Interactive Gantt chart visualization of span execution flow.
- **📜 Log Explorer**: High-performance log viewer using Virtual Scrolling to handle 10,000+ lines with color-coded severity levels.

### 3. Service Topology
- **Interactive Graph**: Visualizes microservice architecture (Frontend -> API -> DB) using AntV G6.
- **Status Indication**: Nodes reflect the simulated health of services.

## 🛠️ Technology Stack

- **Framework**: Vue 3 (Composition API) + Vite 4
- **Language**: TypeScript 5.0
- **State Management**: Pinia 2.1
- **Visualization**:
  - Apache ECharts 5.4 (Metrics)
  - AntV G6 4.8 (Topology)
  - Vue Virtual Scroller (Logs)
- **UI Components**: Element Plus
- **Styling**: SCSS (Custom Dark Theme inspired by Grafana)

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd observability-demo
   ```

2. Install dependencies
   ```bash
   npm install
   ```

### Running Development Server

```bash
npm run dev
```
Open `http://localhost:5173` (or the port shown in terminal) to view the application.

### Building for Production

```bash
npm run build
```

## 📂 Project Structure

```
src/
├── mock/               # The "Virtual Backend" logic
│   ├── generators/     # Algorithms for Math/Trees
│   └── index.ts        # API simulation layer
├── components/
│   ├── Charts/         # ECharts & Gantt wrappers
│   ├── Topology/       # G6 Graph implementation
│   └── Logs/           # Virtual scroller log viewer
├── views/              # Main pages (Dashboard, Metrics, Tracing, Logs)
├── stores/             # Pinia state (Data & UI)
└── styles/             # Global SCSS variables & themes
```

## 🧪 Algorithms

### Time-Series Generation
$$ V(t) = Base + Trend + Seasonality + Noise + Anomaly $$
Implemented in `mathUtils.ts`, utilizing sine waves to create periodic traffic patterns combined with random noise.

### Trace Tree Generation
Uses a recursive Depth-First Search (DFS) approach to build span trees where:
- Child start time $\ge$ Parent start time
- Child end time $\le$ Parent end time
