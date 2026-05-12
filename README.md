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
- 🚀 **WASM Accelerated**: Heavy geometry calculations offloaded to WebAssembly for frame-perfect performance.
- 🎨 **Premium UI/UX**: Smooth, GSAP-driven animations and a refined "TargetCursor" system for intuitive interaction.
- 🔒 **Privacy First**: All processing is performed locally on the edge; no facial data ever leaves your device.

---

## 🛠️ Tech Stack

- **Core**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Computer Vision**: [MediaPipe Vision Tasks](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- **Math Engine**: C++ compiled to WebAssembly (WASM) via Emscripten
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
   git clone https://github.com/your-username/symmetry-pro.git
   cd symmetry-pro
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

---

## 📁 Project Structure

```text
/src
  /analysis      # Logic for quality and reliability validation
  /app           # Next.js pages and layouts
  /components    # Reusable UI components (TargetCursor, Dashboard, etc.)
  /geometry      # Geometry engines (WASM & JS fallbacks)
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

---

## 📜 License

MIT License. See `LICENSE` for more details.
