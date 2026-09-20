# TickTheTask

TickTheTask is a full-stack task-management application to help organize priorities, deadlines, schedules and task progress via a React web interface and a FastAPI backend.
---

## Overview

TickTheTask backend is built utilizing the FastAPI framework, while also adopting a modular architecture that separates routing, business logic, database access, validation, and security-related functionality.

## Project Structure




TickTheTask/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD workflows
│
├── backend/                # FastAPI Python backend
│
├── web/                    # React + Vite web application
│
├── docs/                   # Project documentation
│
├── scripts/                # Helper and deployment scripts
│
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── CONTRIBUTING.md         # Contribution guidelines
├── docker-compose.yml      # Local database configuration
├── LICENSE                 # MIT License
├── render.yaml             # Render deployment configuration
└── README.md               # Project documentation

## Features

- JWT-based authentication and registration
- Complete task management (Create, Read, Update, Delete)
- Deadline and calendar-based tracking
- Search, filtering by status and priorities
- Isolated data by user

## Feature Implementation Status

- [x] JWT-based authentication and registration
- [x] Task management
- [x] Deadline and calendar-based tracking
- [x] Search, filtering, priorities and statuses
- [x] Data isolation
- [ ] Categories and tags (Planned)
- [ ] Subtasks (Planned)
- [ ] Recurring Tasks (Planned)
- [ ] Offline synchronization (Planned)
- [ ] Push notifications (Planned)
- [ ] Advanced productivity analytics (Planned)
---

## Live Demo

Web application: [https://chehak655.github.io/TickTheTask/](https://chehak655.github.io/TickTheTask/)
---

## Visuals

<img width="1024" height="469" alt="login" src="https://github.com/user-attachments/assets/1a94cdb0-65a9-4aea-ae19-d8563d2cca85" />
<img width="1024" height="480" alt="dashboard" src="https://github.com/user-attachments/assets/00cd5b0c-ecd2-424d-a5e4-63c861980d1c" />
<img width="556" height="555" alt="task-creation" src="https://github.com/user-attachments/assets/3252d9fe-a36c-4cf4-96e9-d3f17056321a" />
<img width="1024" height="472" alt="tasks" src="https://github.com/user-attachments/assets/2860bf10-8c0f-4674-9633-14791649105d" />
<img width="1024" height="470" alt="calendar" src="https://github.com/user-attachments/assets/c3cd6028-22a2-43b7-aaa9-c52c619a30cc" />
---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, Lucide React |
| Backend | Python 3.10+, FastAPI, SQLAlchemy |
| Database | PostgreSQL (also supports MySQL) |
| Migrations | Alembic |
| API Server | Uvicorn |
| Testing | Pytest |
| Local Infrastructure| Docker Compose |
| CI | GitHub Actions |

---

## Application Architecture

```text
┌─────────────────────────────┐
│     Web Client     │
└──────────────┬──────────────┘
│ HTTP Requests
▼
┌─────────────────────────────┐
│    FastAPI Routes    │
└──────────────┬──────────────┘
▼
┌─────────────────────────────┐
│    Service Layer     │
└──────────────┬──────────────┘
▼
┌─────────────────────────────┐
│   SQLAlchemy ORM     │
└──────────────┬──────────────┘
▼
┌─────────────────────────────┐
│    PostgreSQL      │
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
Make sure Docker Desktop is running, and then run this command in the root of the repository:
```bash
docker compose up -d
```
Check the containers:
```bash
docker compose ps
docker compose logs
```

### 3. Set up the backend
Copy the root environment template to `.env` in the backend directory:

Windows PowerShell:
```powershell
Copy-Item .env.example backend/.env
```
Windows Command Prompt:
```cmd
copy .env.example backend\.env
```
macOS/Linux:
```bash
cp .env.example backend/.env
```
Update the database credentials and other values in `backend/.env`.

### 4. Create the virtual environment
```bash
cd backend
python -m venv .venv
```
Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```
Windows Command Prompt:
```cmd
.venv\Scripts\activate
```
macOS/Linux:
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
Copy the value into `SECRET_KEY` in `backend/.env`.

### 7. Apply migrations
```bash
python -m alembic upgrade head
```
---

## Environment Variables

A general PostgreSQL config in `backend/.env` will look like:

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
The backend is generally available from: `http://127.0.0.1:8000`
---

## Running the Web Frontend

Open another terminal:
```bash
cd web
npm install
npm run dev
```
The Vite frontend typically prints out the URL in the terminal, commonly: `http://localhost:5173`
---

## Database Migrations

From the `backend` directory, run these commands:

```bash
# Show the current revision
python -m alembic current

# Show migration history
python -m alembic history

# Apply migrations
python -m alembic upgrade head

# Roll back version
python -m alembic downgrade -1
```
---

## API Documentation
FastAPI will generally expose:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- OpenAPI schema: `http://127.0.0.1:8000/openapi.json`
---

## Testing

From the `backend` directory:
```bash
python -m pytest tests/ -v
```


## Deployment

For production deployment (Render):
1. Set up a PostgreSQL managed database
2. Add all of the necessary environment variables to your dashboard
3. Apply migrations (`alembic upgrade head`) in a controlled way
4. Start Uvicorn on your providers given port: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set the exact origin of the web frontend in your CORS environment variables
6. Enable HTTPS.
---

## Security
- Secure password hashing with bcrypt
- Secure JWT secrets in environment variables
- Request data validation with Pydantic
- Strict ownership checks on all task operations
- Strict CORS origin bounding (in production)
- Strong SECRET_KEY lengths (in production)
- Rate limiting authentication routes, via SlowAPI.
---

## Contributing
1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make and test your changes
4. Commit your changes: `git commit -m "Add: describe your change"`
5. Push the branch and open a pull request.
---

## License
This project is licensed under the MIT License. See the `LICENSE` file for the complete text.

## Author
Chehak
GitHub: [https://github.com/chehak655](https://github.com/chehak655)
