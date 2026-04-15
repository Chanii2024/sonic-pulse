# SONIC PULSE | OPERATIONAL GUIDE
### Local Development and Deployment

This guide outlines the necessary steps to initialize and run the Sonic Pulse local environment.

---

## 1. System Requirements

Before initializing the boot sequence, ensure the following components are installed:

- **Node.js**: Version 18.x or higher.
- **FFmpeg**: Must be installed locally and added to the system environment variables.
- **Network**: Active connection for YouTube stream analysis and metadata fetching.

---

## 2. Boot Sequence (Dual Terminal)

The application requires both the processing engine and the interface to be active simultaneously.

### Phase 1: Processing Engine (Backend)
Navigate to the `backend-render` directory and initialize the service.
```bash
cd backend-render
npm install
npm run dev
```
Port: `7860`

### Phase 2: User Interface (Frontend)
Initialize the frontend application from the root directory.
```bash
# In a separate terminal
npm install
npm run dev
```
Port: `5173`

---

## 3. Configuration Notes

- **API Endpoint**: The frontend is pre-configured to communicate with the local engine at `http://127.0.0.1:7860/convertVideo`.
- **Stream Processing**: High-bitrate extraction (320kbps) is handled locally via FFmpeg.
- **Environment**: This setup is optimized for local testing; cloud configuration may require additional environment secrets.

---
*Operational Reliability • Sonic Pulse Engineering*
