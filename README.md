# ReliefGrid — Disaster Dispatch Command Center

ReliefGrid is a single-page emergency dispatch command center prototype built for flood catastrophe response (inspired by Mumbai urban inundation scenarios). It intelligently re-allocates ambulances and ICU beds under dynamic road closures while proving every critical handoff with cryptographically tamper-evident receipts.

---

## 🖤 Aesthetic & Design Philosophy: Vantablack Technical Monolith

- **True Vantablack (`#000000`) Foundation**: Pure black canvas with precision obsidian surfaces (`#080808`, `#0E0E0E`) and surgical hairline borders (`rgba(255,255,255,0.08)` to `0.15`).
- **Monotonic 3-Color Hierarchy**:
  1. **Void & Obsidian**: `#000000` / `#0A0A0A`
  2. **Tactical Monochrome**: Stark Signal White (`#F5F5F7`) and Technical Slate (`#737373`)
  3. **High-Consequence Accent**: Tactical Emergency Orange (`#FF5500`)
  - *Functional triage accents (Red `#F43F5E`, Amber `#F59E0B`, Green `#10B981`) are reserved strictly for clinical priority.*
- **Typography**:
  - **Space Grotesk**: High-impact editorial headers and command telemetry.
  - **Plus Jakarta Sans**: High-legibility technical interface labels.
  - **Space Mono**: Cryptographic SHA-256 hashes, timestamps, coordinates, and OTP codes.
- **Micro-interactions**: Subtle monochrome scanline texturing, tactile pressed states, zero cartoonish diffuse glow, full `prefers-reduced-motion` compliance.

---

## 🚀 Key Feature Sets (Phases 1, 2, & 3)

### Phase 1: Core Command Center & Dynamic Allocation
- **Dynamic Allocation Engine (`src/engine.ts`)**:
  - START triage priority calculation: `Priority = (SeverityWeight / max(MinutesRemaining, 1))`.
  - Flood penalty: When flood is active, transit through flooded sectors adds +5 min stability penalty or marks hospital road impassable.
  - Hospital capacity constraints: Reserved ICU beds prevent cascading hospital overcapacity.
  - Transparent "Why This?" explainability breakdown for every dispatch decision.
- **Deterministic Simulation (`src/seed.ts`)**:
  - Mumbai flood sector with 3 hospitals (A: 6m away, flood prone; B: 12m away, 3 beds; C: 20m away, 1 bed).
  - 4 Ambulances (AMB-01..04) and 5 triage-graded victims (P-01..05).
  - Pure deterministic state without `Math.random` for reproducible live demo runs.
- **Interactive SVG City Grid (`src/components/Map.tsx`)**:
  - Live SVG map with flood zones, animated transit routes, ambulance pins, hospital telemetry, and zero hover-jitter.

### Phase 2: Delivery Trail & Cryptographic Audit Portal
- **Delivery Trail (`src/components/DeliveryTrail.tsx`)**:
  - Horizontal delivery lifecycle: `Dispatched` ➔ `En Route` ➔ `Arrived at Scene` ➔ `Patient Loaded` ➔ `Hospital Handoff` ➔ `Receipt Verified`.
  - Dynamic QR Code generation (`qrcode.react`) embedding cryptographic receipt payloads.
  - 6-box Driver Handover OTP authentication with auto-focus and subtle pulse confirmation.
- **Cryptographic Audit Portal (`src/components/AuditPortal.tsx`)**:
  - Canonical JSON stringification (sorted keys) with WebCrypto SHA-256 hashing.
  - Pairwise Merkle Tree calculation with verifiable Merkle Root (`0x4a8f...`) and leaf proof paths.
  - Real-time Tamper Detection simulator: edit any field (e.g. timestamp or vitals) to watch cryptographic verification fail with visual diff highlight.

### Phase 3: Mobile Driver App, Dynamic Re-Plan & Side-by-Side Benchmark
- **Driver Mobile Experience (`src/components/DriverApp.tsx`)**:
  - 390x800 high-contrast mobile handset view with live ambulance selector.
  - Massive ETA readout (`14 MIN`), clinical urgency banner, step-by-step turn guidance.
  - Driver OTP code card with click-to-copy.
  - **SMS Fallback Mode**: Monospaced low-bandwidth emergency text format for 2G / Mesh / off-grid environments.
- **Dynamic Re-Plan Simulator (`src/components/SimulatePanel.tsx`)**:
  - Slide-out drawer to inject chaos in real-time.
  - **"Set Hospital B ICU Beds to 0"**: Instantly triggers live engine re-computation (<5ms), dynamically diverting ambulances to Hospital C or Field EOC.
  - **"Inject Patient Incident"**: Spawn live custom victims with custom triage grade, vitals, and countdown deadlines.
  - 1-click state reset.
- **Comparative Benchmark View (`src/components/CompareView.tsx`)**:
  - Side-by-side protocol comparison:
    - **Naive Baseline**: Dispatches blindly to nearest Hospital A; gets stranded in flooded subways; causes critical delays.
    - **ReliefGrid Protocol**: Predictive routing via elevated bypasses, load-balanced triage, zero stranded vehicles.
  - Quantified simulated metrics: -75.6% time-to-treatment, 0 ICU bottlenecks, 100% verified cryptographic delivery trail.

---

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Custom CSS (`Space Grotesk`, `Plus Jakarta Sans`, `Space Mono`)
- **Cryptography**: Web Crypto API (`crypto.subtle.digest`)
- **Icons & QR**: `lucide-react`, `qrcode.react`

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (type-checked)
npm run build
```
