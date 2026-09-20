# TickTheTask

[![CI Status](https://github.com/chehak655/TickTheTask/actions/workflows/main.yml/badge.svg)](https://github.com/chehak655/TickTheTask/actions)

**Plan it. Track it. Tick it off.**

TickTheTask is a full-stack task-management application for organizing priorities, deadlines, schedules, and task progress through a React web interface and a FastAPI backend.

---

## Overview

TickTheTask Backend is built using **FastAPI** and follows a modular architecture that separates routing, business logic, database access, validation, and security-related functionality.

## Key Features

- JWT-based authentication and secure registration.
- Full Task CRUD (Create, Read, Update, Delete).
- Deadline and calendar-based task tracking.
- Search, filtering by status and priorities.
- User-level data isolation.

## Feature Implementation Status

- [x] JWT-based authentication and registration
- [x] Task creation, retrieval, updating, and deletion
- [x] Deadline and calendar-based task tracking
- [x] Search, filtering, priorities, and statuses
- [x] User-specific task access and data isolation
- [ ] Categories and tags (Planned)
- [ ] Subtasks (Planned)
- [ ] Recurring tasks (Planned)
- [ ] Offline synchronization (Planned)
- [ ] Push notifications (Planned)
- [ ] Advanced productivity analytics (Planned)

---

## Live Demo

- **Web application:** [https://chehak655.github.io/TickTheTask/](https://chehak655.github.io/TickTheTask/)
- **Backend API documentation:** [https://tickthetask-backend.onrender.com/docs](https://tickthetask-backend.onrender.com/docs)

> **Note on Cold Starts:** The backend uses a free Render plan. If it has been inactive, the first request may take up to 60 seconds while the service wakes up. A loading spinner will appear in the web app during this time.

---

## Visuals

*(To embed screenshots directly, edit this README on GitHub.com and drag-and-drop your image files right here! GitHub will automatically host them and insert the image tags for you.)*

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v4, Lucide React |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy |
| **Database** | PostgreSQL (also supports MySQL) |
| **Migrations** | Alembic |
| **API Server** | Uvicorn |
| **Testing** | Pytest |
| **Local Infrastructure**| Docker Compose |
| **CI** | GitHub Actions |

---

## Project Structure

```text
TickTheTask/
├── backend/                  # FastAPI backend
│   ├── app/                  # Application source code
│   ├── alembic/              # Database migrations
│   ├── tests/                # Backend tests
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend environment template
├── web/                      # React/Vite frontend
├── docs/                     # Documentation
├── scripts/                  # Helper and deployment scripts
├── docker-compose.yml        # Local database configuration
├── .env.example              # Root environment template
└── README.md                 # Project documentation
```

---

## Application Architecture

```text
┌─────────────────────────────┐
│          Web Client         │
└──────────────┬──────────────┘
               │ HTTP Requests
               ▼
┌─────────────────────────────┐
│        FastAPI Routes       │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│       Service Layer         │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│      SQLAlchemy ORM         │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│       PostgreSQL            │
└─────────────────────────────┘
```

---

## Prerequisites

Ensure you have the following installed:
- Git
- Python 3.10 or newer
- Node.js and npm
- Docker Desktop

Verify the tools:
```bash
python --version
node --version
npm --version
docker --version
```

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/chehak655/TickTheTask.git
cd TickTheTask
```

### 2. Start PostgreSQL
Ensure Docker Desktop is running, then execute this command from the repository root:
```bash
docker compose up -d
```
Check the containers:
```bash
docker compose ps
docker compose logs
```

### 3. Configure the backend
Copy the root environment template to `.env` in the backend directory:

**Windows PowerShell:**
```powershell
Copy-Item .env.example backend/.env
```
**Windows Command Prompt:**
```cmd
copy .env.example backend\.env
```
**macOS/Linux:**
```bash
cp .env.example backend/.env
```
Update the database credentials and other values in `backend/.env`.

### 4. Create the virtual environment
```bash
cd backend
python -m venv .venv
```
**Windows PowerShell:**
```powershell
.\.venv\Scripts\Activate.ps1
```
**Windows Command Prompt:**
```cmd
.venv\Scripts\activate
```
**macOS/Linux:**
```bash
source .venv/bin/activate
```

### 5. Install dependencies
```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 6. Generate a secure secret key
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copy the generated value into `SECRET_KEY` in `backend/.env`.

### 7. Apply migrations
```bash
python -m alembic upgrade head
```

---

## Environment Variables

A typical PostgreSQL configuration in `backend/.env` will look like this:

```env
ENVIRONMENT=dev

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=tickthetask_db

# Or use the direct URL override:
DATABASE_URL=postgresql+psycopg2://postgres:your_postgres_password@localhost:5432/tickthetask_db

SECRET_KEY=replace_this_with_your_generated_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
```

---

## Running the Backend

From the `backend` directory:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The backend is normally available at: `http://127.0.0.1:8000`

---

## Running the Web Frontend

Open another terminal:
```bash
cd web
npm install
npm run dev
```
Vite normally displays the frontend URL in the terminal, commonly: `http://localhost:5173`

---

## Database Migrations

Run these commands from the `backend` directory:

```bash
# Show the current revision
python -m alembic current

# Show migration history
python -m alembic history

# Apply pending migrations
python -m alembic upgrade head

# Roll back one migration
python -m alembic downgrade -1
```

---

## API Documentation

When the backend is running, FastAPI automatically exposes:
- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`
- **OpenAPI schema:** `http://127.0.0.1:8000/openapi.json`

---

## Testing

From the `backend` directory:
```bash
python -m pytest tests/ -v
```

The test suite covers:
- Registration, login, and token expiry
- Invalid credentials and missing tokens
- Task CRUD operations
- User-level task isolation
- Deadline behavior
- Security hardening

*(Note: Ensure your test database is properly configured with a test engine URL to execute tests fully).*

---

## Deployment

For production deployment (Render):
1. Configure a PostgreSQL managed database.
2. Add all required environment variables to the hosting provider's dashboard.
3. Run migrations (`alembic upgrade head`) in a controlled deployment step.
4. Start Uvicorn on the provider's assigned port: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Configure the exact frontend origin in the CORS environment variable.
6. Enable HTTPS.

---

## Security

- Passwords are securely hashed using bcrypt.
- JWT secrets are kept private in environment variables.
- Incoming request data is validated using Pydantic.
- Strict ownership checks are enforced on every task operation to prevent unauthorized access.
- CORS origins are strictly bounded in production.
- Production environments enforce strong SECRET_KEY lengths.
- Rate limiting is configured for authentication routes using SlowAPI.

---

## Known Limitations

- **Cold Starts:** The backend is hosted on Render's free tier. The first request after a period of inactivity may take up to 60 seconds.

---

## Contributing
1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`
3. Make and test your changes.
4. Commit your changes: `git commit -m "Add: describe your change"`
5. Push the branch and open a pull request.

---

## License
This project is licensed under the MIT License. See the `LICENSE` file for the complete text.

## Author
**Chehak**
GitHub: [https://github.com/chehak655](https://github.com/chehak655)
