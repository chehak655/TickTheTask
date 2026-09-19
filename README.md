# TickTheTask
**Plan it. Track it. Tick it off.**

TickTheTask is a comprehensive, full-stack task management application designed to help users track their daily priorities, deadlines, and schedules. It features a seamless cross-platform experience with a React web interface, an Expo React Native mobile application, and a high-performance FastAPI Python backend.

## Key Features
- [x] Secure JWT-based Authentication & Registration
- [x] Email OTP Verification
- [x] Full Task CRUD (Create, Read, Update, Delete)
- [x] Calendar-based Deadline Tracking
- [x] Automated Email Reminders
- [x] Multi-Theme Customization (Dark Mode & Lime Green Accents)
- [x] Cross-platform support (Web, iOS, Android)

## Screenshots
> Note: Screenshots must be captured and placed in docs/screenshots/ manually. 

**Screenshot Checklist:**
- [ ] dashboard.png - The main web dashboard view.
- [ ] login.png - The authentication screen.
- [ ] 	ask-creation.png - The modal for creating a task.
- [ ] calendar.png - The calendar deadline view.
- [ ] mobile-dashboard.png - The main view on a mobile device.

## Demo
Live demo: Not deployed yet.

## Tech Stack
### Web Frontend
- React 18
- Vite
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
- PostgreSQL (Production) / MySQL (Local)

### Authentication & Services
- JWT (JSON Web Tokens)
- Passlib (Bcrypt)
- smtplib (Email Notifications)

## System Architecture
TickTheTask utilizes a decoupled architecture. The React Web and React Native Mobile applications act as independent clients that consume the FastAPI REST API. The backend processes requests, validates them via Pydantic schemas, and executes CRUD operations asynchronously against a PostgreSQL or MySQL database. Dedicated background tasks handle deadline polling and SMTP email dispatching natively to prevent event-loop blocking.

*See [Architecture Guide](docs/architecture.md) for more details.*

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

## Installation Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (Production) / MySQL (Local) Server (v8+)
- Git

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
Copy ackend/.env.example to ackend/.env and update your database credentials and Gmail App Password.
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

*See [Setup Guide](docs/setup.md) and [Local Network Setup](LOCAL_NETWORK_SETUP.md) for detailed configuration.*

## Environment Variables
Always copy .env.example files to .env. 
Never commit your .env file or expose your Gmail App Passwords. 
- DB_PASSWORD: Your database password.
- SECRET_KEY: A strong 32-character string for JWT signing.
- SMTP_PASSWORD: A 16-character Google App Password for emails.

## API Documentation
Once the backend is running, visit:
- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

*See [API Guide](docs/api.md).*

## Testing Instructions
- **Backend:** pytest -v (inside ackend/ with virtualenv activated).
- **Web:** 
pm run lint and 
pm run build (inside web/).
- **Mobile:** 
px expo install --check (inside mobile/).

*See [Testing Guide](docs/testing.md).*

## Security Practices
TickTheTask employs strict tenant isolation to prevent unauthorized data access. All queries rely on verified JWT payloads. Passwords and OTPs are heavily hashed using bcrypt, and CORS headers explicitly control domain access.

*See [Security Guide](docs/security.md).*

## Known Limitations
- Background email workers execute within the primary FastAPI process loop rather than a dedicated message queue (like Celery/Redis).
- Rate-limiting middleware is currently implemented purely on the application layer for OTPs.

## Future Improvements
- Integrate Redis for robust task queuing and rate limiting.
- Implement push notifications for the mobile application.
- Add Oauth2 social login providers (Google/GitHub).

## License
MIT License.

## Contribution Guidelines
1. Fork the repository.
2. Create your feature branch (git checkout -b feature/amazing-feature).
3. Commit your changes (git commit -m 'Add some amazing feature').
4. Push to the branch (git push origin feature/amazing-feature).
5. Open a Pull Request.

