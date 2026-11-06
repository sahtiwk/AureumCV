# 🧬 AureumCV

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision-007f7f?style=for-the-badge&logo=google)](https://developers.google.com/mediapipe)
[![GSAP](https://img.shields.io/badge/GSAP-Animation-88ce02?style=for-the-badge&logo=greensock)](https://gsap.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

**AureumCV** is a high-performance, browser-native computer vision system designed to analyze facial geometry, symmetry, and proportionality in real-time. Leveraging MediaPipe Face Landmarker and WebAssembly (WASM), it provides precise biometric insights with a premium, interactive user experience.

---

## ✨ Key Features

- 🎯 **Real-Time Facial Tracking**: High-fidelity 478-point landmark extraction using Google's MediaPipe.
- 📐 **Phi (Golden Ratio) Analysis**: Scientific calculation of facial proportionality based on classical aesthetics.
- ⚖️ **Symmetry Scoring**: Instantaneous evaluation of facial bilateral symmetry with professional-grade accuracy.
- 🚀 **C++ WebAssembly Math**: Webcam and image analysis calculate geometry metrics in a compiled C++ engine, using only C++/WASM for the four geometry metrics. No speedup over JavaScript is assumed.
- 🎨 **Premium UI/UX**: Smooth, GSAP-driven animations and a refined "TargetCursor" system for intuitive interaction.
- 🔒 **Privacy First**: All processing is performed locally on the edge; no facial data ever leaves your device.

---

## 🛠️ Tech Stack

- **Core**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Computer Vision**: [MediaPipe Vision Tasks](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- **Math Engine**: C++ compiled to WebAssembly (WASM) via Emscripten (required; no TypeScript math fallback)
- **Animation**: [GSAP](https://gsap.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm / pnpm / yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aureumcv.git
   cd aureumcv
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building and verifying the C++ engine

The compiled `public/wasm/geometry.wasm` and its hash manifest are included in the repository. Normal development and deployment do not require a C++ compiler. Both `npm run dev` and `npm run build` verify that the binary matches the C++ source and compiler flags, and reject missing or stale artifacts.

After changing `src/wasm/geometry.cpp`, activate an [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) environment and run:

```bash
npm run build:wasm
npm run test:wasm
npm run build
```

Include the updated C++ source, binary, and manifest together. The initial artifact was built with Emscripten 5.0.7; its exact compiler version is recorded in the manifest. If the SDK is installed in a protected directory, set `EM_CACHE` to a writable directory. Use the SDK's configured environment rather than a machine-specific configuration checked into this project.

The browser fetches the standalone WASM binary directly; no generated JavaScript glue or global factory is required. Successful initialization logs `[geometry] C++ WebAssembly engine ready`. `WasmGeometryEngine.backend` exposes the active backend for diagnostics. Load or runtime failures stop analysis and show an error; a later initialization can retry. Webcam and image pipelines await initialization before analysis. The optional worker supports the same engine, but the current webcam pipeline runs on the main thread.

The four metrics use ratios of Euclidean distances, which are invariant under translation, rigid rotation, and uniform scaling. The C++ engine therefore computes them directly. WASM changes execution technology, not the scientific validity of the metrics.

---

## 📁 Project Structure

```text
/src
  /analysis      # Logic for quality and reliability validation
  /app           # Next.js pages and layouts
  /components    # Reusable UI components (TargetCursor, Dashboard, etc.)
  /geometry      # Browser bridge to the C++ WASM engine
  /hooks         # Custom React hooks for webcam and ML
  /ml            # MediaPipe integration and managers
  /rendering     # Canvas-based real-time mesh rendering
  /store         # Global state management with Zustand
  /wasm          # C++ source code for geometry engine
```

---

## 📐 Geometric Methodology

### Symmetry Score
Calculated by measuring the Euclidean distance between central anchors (e.g., tip of nose) and bilateral landmarks (left vs. right).
$$Symmetry = 100 \times (1 - \frac{|dist_{left} - dist_{right}|}{\max(dist_{left}, dist_{right})})$$

### Phi Proportionality
Analyzes facial height-to-width ratios and inter-eye spacing against the Golden Ratio ($1.618$).

---

## 🚢 Deployment (Vercel)

AureumCV is optimized for Vercel. You can find the deployment here: [Live Demo](https://aureum-cv.vercel.app)

Ensure the following:

- **Build Command**: `npm run build` (includes the WASM artifact check)
- **Output Directory**: `.next`
- **WASM Support**: Include `public/wasm/geometry.wasm` and `geometry.manifest.json` in the deployment. Next.js serves the binary at `/wasm/geometry.wasm`.

---

## 📜 License

MIT License. See `LICENSE` for more details.
