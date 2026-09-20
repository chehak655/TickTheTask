# TickTheTask
[![CI Status](https://github.com/chehak655/TickTheTask/actions/workflows/main.yml/badge.svg)](https://github.com/chehak655/TickTheTask/actions)

**Plan it. Track it. Tick it off.**

TickTheTask is a comprehensive, full-stack task management application designed to help users track their daily priorities, deadlines, and schedules. It features a seamless cross-platform experience with a React web interface, an Expo React Native mobile application, and a high-performance FastAPI Python backend.

## Key Features
- [x] Secure JWT-based Authentication & Registration
- [x] Full Task CRUD (Create, Read, Update, Delete)
- [x] Calendar-based Deadline Tracking
- [x] In-App & Desktop Push Notifications for Due Tasks
- [x] Multi-Theme Customization (Dark Mode & Light Mode)
- [x] Cross-platform support (Web, iOS, Android)
- [x] Strict Tenant Isolation

## Live Demo
- **Live Web App:** https://chehak655.github.io/TickTheTask/
- **Backend API:** https://tickthetask-backend.onrender.com/docs

> **Note on Cold Starts:** The backend is hosted on a free Render tier. If the app hasn't been used in a while, the very first API request may take up to 60 seconds as the server wakes up. A loading screen will appear in the web app during this time.

## Visuals
*(Add your screenshots here)*
- `![Dashboard](docs/screenshots/dashboard.png)`
- `![Mobile](docs/screenshots/mobile-dashboard.png)`

## Tech Stack
**Web:** React 18, Vite, Tailwind CSS v4, Lucide React
**Mobile:** React Native, Expo
**Backend:** Python 3.10+, FastAPI, SQLAlchemy (Async), Pytest
**Database:** PostgreSQL (Production & Local via Docker)

## Project Structure
```text
TickTheTask/
+-- backend/          # FastAPI Python API
+-- web/              # React/Vite Web App
+-- mobile/           # Expo React Native App
+-- docs/             # Project documentation
+-- scripts/          # Helper scripts (Batch, Bash, Render config)
+-- docker-compose.yml# Local Database Setup
+-- .env.example      # Environment variable templates
+-- README.md         # Project entry point
```

## Local Setup Instructions

### 1. Database Setup (Docker)
We use PostgreSQL for both local development and production to prevent environment-specific bugs.
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Copy the `.env.example` file from the repository root to `backend/.env` (and update credentials):
```bash
# Windows
copy ..\.env.example .env
# macOS/Linux
cp ../.env.example .env
```

**Security Requirement:** You MUST generate a secure `SECRET_KEY` for JWT. Run this command and paste the output into your `.env`:
```bash
openssl rand -hex 32
```

Run migrations and start the server:
```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Web Setup
```bash
cd web
npm install
npm run dev
```

### 4. Mobile Setup
```bash
cd mobile
npm install
npx expo start
```

## Environment Variables
Always copy `.env.example` to `.env`. Never commit your `.env` file!

## Known Limitations
- **Cold Starts:** First request on Render Free Tier takes 1-2 minutes.
- **Rate Limiting:** IP-based rate limiting via SlowAPI uses in-memory storage locally. In production, Redis is recommended for distributed tracking.

## License
MIT License.
