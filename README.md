# SONIC PULSE
### Sonic Perfection.

Sonic Pulse is an ultra-fast, high-fidelity audio extraction engine engineered for the modern web. It delivers studio-grade 320kbps MP3 conversions with a focus on speed, privacy, and user experience.

---

## Interface Preview

| Primary Interface | Live Processing Engine |
| :--- | :--- |
| ![Landing Page](public/Screenshot%202026-04-15%20170756.png) | ![Processing Engine](public/Screenshot%202026-04-15%20170844.png) |

| Mastering Complete | Audio Visualizer |
| :--- | :--- |
| ![Mastered State](public/Screenshot%202026-04-15%20170808.png) | ![High Fidelity Streaming](public/Screenshot%202026-04-15%20170819.png) |

---

## Key Features

- **Studio Quality Extraction**: Precision engine capable of extracting audio streams at steady 320kbps bitrates.
- **Optimized Engine Performance**: Real-time status monitoring for optimal resource allocation during extraction.
- **Privacy First**: Zero data logging architecture. No history, no logs, just pure performance.
- **Instant Cloud Sync**: Processed streams are synchronized instantly for immediate preview or download.
- **Immersive Visuals**: Features a built-in high-fidelity audio visualizer for real-time frequency monitoring.

---

## Technical Architecture

The system is built on a distributed architecture to ensure low latency and high reliability.

- **Frontend**: Built with React and Vite for a lightning-fast UI/UX.
- **Backend Service**: Express.js server optimized for heavy stream processing.
- **Audio Processing**: Leverages FFmpeg for precise audio manipulation and encoding.
- **Design System**: Custom crafted CSS system focused on dark-mode aesthetics and fluid animations.

---

## Local Development Setup

To run Sonic Pulse locally, follow the dual-terminal boot sequence.

### Prerequisites
- Node.js (Latest LTS recommended)
- FFmpeg (Installed and accessible in system path)

### 1. Initialize Backend
```bash
cd backend-render
npm install
npm run dev
```
The backend will boot on port `7860`.

### 2. Initialize Frontend
```bash
# Return to root directory
npm install
npm run dev
```
The frontend will boot on port `5173`.

---

## Operational Notes
- The application is currently configured for local backend interaction.
- Ensure FFmpeg is correctly configured for handled Windows/Linux environments.
- High-fidelity streaming requires a stable internet connection for YouTube stream analysis.

---
*Engineered for Sonic Purity • V2.0*
