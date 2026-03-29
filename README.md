# AINA — Women Safety & Incident Intelligence Platform

## Problem
Women facing harassment or abuse often cannot collect legally credible evidence quickly and safely. Most tools fail in emergencies, fail offline, or don't provide actionable insights.

## Solution
AINA is a mobile-first safety app that enables users to:
- capture encrypted incident evidence,
- trigger emergency SOS with location + encrypted audio,
- notify trusted contacts,
- visualize incidents on a live map,
- generate AI-powered insights and legal-ready reports.

## Architecture Overview
### Frontend
- React Native (Expo)
- React Navigation
- Socket.IO client (realtime updates)
- react-native-maps (incident map)

### Backend
- Node.js + Express
- Prisma + PostgreSQL
- Socket.IO server
- AI services (`aiService`, `aiInsightsService`, `patternService`)

### Security
- AES-256 client encryption with PBKDF2 key derivation
- SHA-256 evidence integrity checks
- Replay protection (`x-request-nonce`, `x-request-timestamp`)
- Helmet, CORS control, rate limiting, sanitization and validation

## AI Features
- Auto incident classification (verbal/physical/financial/threat)
- Severity scoring and entity extraction
- Peak-hour analysis
- High-risk area clustering
- Safety advice cards
- AI legal narrative in report output

## Demo Features (Judge-Friendly)
1. **Incident Map** (`MapScreen`)
   - color-coded severity markers
   - current user location
   - realtime marker updates
2. **AI Insights Screen**
   - top incident type, peak hours, risky areas, safety tips
3. **Demo Mode Toggle** (Settings)
   - simulates new incidents every 30–60 seconds
4. **Realtime Updates**
   - incidents and SOS events appear instantly via Socket.IO
5. **Report Export**
   - JSON and PDF legal report

## Setup Instructions
### 1) Install & DB
```bash
npm install
npx prisma generate
npx prisma migrate dev --name hackathon_demo
```

### 2) Seed Demo Data
```bash
npm run seed
```

### 3) Run Backend
```bash
npm run dev
```

### 4) Run Mobile App
```bash
npx expo start
```

## Required Environment Variables
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
JWT_ISSUER=aina-api
JWT_AUDIENCE=aina-mobile
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081,http://localhost:19006
RATE_LIMIT_MAX=300

EXPO_PUBLIC_API_URL=http://localhost:5000
GEMINI_API_KEY=

# Optional real alerts
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_ENABLE_CALLS=true
```

## Deployment
- **Render**: use `render.yaml`
- **Docker / AWS**:
```bash
docker build -t aina-api .
docker run -p 5000:5000 --env-file .env aina-api
```

## Demo Walkthrough (3-5 min)
1. Login with seeded demo user (`demo@aina.app` / `demo12345`) or register.
2. Open **Settings** → enable **Demo Mode**.
3. Open **Map** and watch incidents appear realtime.
4. Open **AI Insights** and explain peak hours + risky areas.
5. Trigger **SOS** and show countdown + auto incident creation.
6. Open **Report** and export JSON/PDF.

## API Highlights
- `GET /incidents/nearby`
- `GET /ai/insights`
- `POST /incident`
- `POST /sos/trigger`
- `GET /report/summary`
- `GET /report/export/json`
- `GET /report/export/pdf`
