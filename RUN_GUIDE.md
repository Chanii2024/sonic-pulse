# SONIC PULSE: LOCAL RUN GUIDE

## Prerequisites
1. Node.js installed.
2. FFmpeg installed locally (Windows tests).
3. Internet connection for fetching YouTube data.

## Boot Sequence (Dual Terminal)

1. Start backend (`backend-render`, port `7860`):
```powershell
cd backend-render
npm install
npm run dev
```

2. Start frontend (root project, port `5173`):
```powershell
npm install
npm run dev
```

## Notes
- Frontend is configured for local backend only: `http://127.0.0.1:7860/convertVideo`.
- No cloud hosting/deployment steps are included in this project setup.
