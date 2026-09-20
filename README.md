# TickTheTask
**Plan it. Track it. Tick it off.**

TickTheTask is a comprehensive, full-stack task management application designed to help users track their daily priorities, deadlines, and schedules. It features a seamless cross-platform experience with a React web interface, an Expo React Native mobile application, and a high-performance FastAPI Python backend.

## Key Features
- [x] Secure JWT-based Authentication & Registration
- [x] Full Task CRUD (Create, Read, Update, Delete)
- [x] Calendar-based Deadline Tracking
- [x] In-App & Desktop Push Notifications for Due Tasks
- [x] Multi-Theme Customization (Dark Mode & Light Mode)
- [x] Cross-platform support (Web, iOS, Android)

## Live Demo
- **Live Web App:** https://chehak655.github.io/TickTheTask/
- **Backend API:** https://tickthetask-backend.onrender.com/docs

## Tech Stack
### Web Frontend
- React 18 & Vite
- Tailwind CSS v4
- Lucide React

### Mobile Application
- React Native
- Expo
- React Navigation

### Backend
- Python 3.10+
- FastAPI
- SQLAlchemy (Async)
- Pytest

### Database
- PostgreSQL (Production on Render) / MySQL (Local)

### Authentication & Security
- JWT (JSON Web Tokens)
- Passlib (Bcrypt)

## System Architecture
TickTheTask utilizes a decoupled architecture. The React Web and React Native Mobile applications act as independent clients that consume the FastAPI REST API. The backend processes requests, validates them via Pydantic schemas, and executes CRUD operations asynchronously against the database. 

## Project Structure
`	ext
TickTheTask/
+-- backend/          # FastAPI Python API
+-- web/              # React/Vite Web App
+-- mobile/           # Expo React Native App
+-- docs/             # Project documentation
+-- .env.example      # Environment variable templates
+-- README.md         # Project entry point
`

## Local Setup Instructions

### 1. Database Setup
Create a local PostgreSQL or MySQL database:
`sql
CREATE DATABASE tickthetask_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`

### 2. Backend Setup
`ash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
`
Copy ackend/.env.example to ackend/.env and update your database credentials.
Run migrations and start the server:
`ash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
`

### 3. Web Setup
`ash
cd web
npm install
npm run dev
`

### 4. Mobile Setup
`ash
cd mobile
npm install
npx expo start
`

## Environment Variables
Always copy .env.example files to .env. 
Never commit your .env file!
- DB_PASSWORD: Your database password.
- SECRET_KEY: A strong 32-character string for JWT signing.

## API Documentation
Once the backend is running, visit:
- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

## Security Practices
TickTheTask employs strict tenant isolation to prevent unauthorized data access. All queries rely on verified JWT payloads. Passwords are heavily hashed using bcrypt, and CORS headers explicitly control domain access.

## License
MIT License.
