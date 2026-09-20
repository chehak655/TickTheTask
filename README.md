# TickTheTask
[![CI Status](https://github.com/chehak655/TickTheTask/actions/workflows/main.yml/badge.svg)](https://github.com/chehak655/TickTheTask/actions)

**Plan it. Track it. Tick it off.**

TickTheTask is a comprehensive, full-stack task management application designed to help users track their daily priorities, deadlines, and schedules. It features a seamless experience with a React web interface and a high-performance FastAPI Python backend.

## Key Features
- [x] Secure JWT-based Authentication & Registration
- [x] Full Task CRUD (Create, Read, Update, Delete)
- [x] Calendar-based Deadline Tracking
- [x] Search, Filter, and Priorities
- [x] Strict Tenant Isolation

## Live Demo
- **Live Web App:** https://chehak655.github.io/TickTheTask/
- **Backend API:** https://tickthetask-backend.onrender.com/docs

> **Note on Cold Starts:** The backend is hosted on a free Render tier. If the app hasn't been used in a while, the very first API request may take up to 60 seconds as the server wakes up. A loading screen will appear in the web app during this time.

## Visuals
*(To embed screenshots directly without making a folder, just edit this README on GitHub.com and drag-and-drop your image files right here! GitHub will automatically host them and insert the image tags for you.)*

## Tech Stack
**Web:** React 18, Vite, Tailwind CSS v4, Lucide React
**Backend:** Python 3.10+, FastAPI, SQLAlchemy (Async), Pytest
**Database:** PostgreSQL (Production & Local via Docker)

## Project Structure
```text
TickTheTask/
+-- backend/          # FastAPI Python API
+-- web/              # React/Vite Web App
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

Copy the `.env.example` file from the repository root to `backend/.env` (and update credentials).

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

## Environment Variables
Always copy `.env.example` to `.env`. Never commit your `.env` file!

## License
MIT License.
