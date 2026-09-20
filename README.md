# TaskFlow Backend

The backend service for **TaskFlow**, a task-management application designed to help users organize, track, and manage their daily work efficiently.

This project provides a RESTful API for user authentication, task management, task status tracking, deadlines, reminders, and related productivity features.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Application Architecture](#application-architecture)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Database Migrations](#database-migrations)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [Security Recommendations](#security-recommendations)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

TaskFlow Backend is built using **FastAPI** and follows a modular architecture that separates routing, business logic, database access, validation, and security-related functionality.

The backend is responsible for:

- Managing user accounts and authentication
- Creating, updating, retrieving, and deleting tasks
- Managing task priorities and statuses
- Handling due dates and reminders
- Persisting application data in a relational database
- Providing API endpoints for the web and mobile applications
- Generating interactive API documentation

---

## Features

### User Management

- User registration and login
- Password-based authentication
- Token-based authorization
- Protected API routes
- User-specific task access

### Task Management

- Create new tasks
- View task lists
- Update task information
- Delete tasks
- Assign priorities and statuses
- Add descriptions and deadlines
- Track task completion

### API and Backend Features

- RESTful API design
- Request validation using Pydantic
- Database interaction using SQLAlchemy
- Modular route organization
- Environment-based configuration
- Automatic API documentation
- Automated testing with Pytest

---

## Technology Stack

| Component | Technology |
|---|---|
| Programming Language | Python |
| API Framework | FastAPI |
| ORM | SQLAlchemy 2.0 |
| Data Validation | Pydantic |
| Database | MySQL |
| Database Migrations | Alembic |
| Authentication | Token-based authentication |
| Testing | Pytest |
| API Server | Uvicorn |

---

## Project Structure

```text
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # Application settings and configuration
│   │   └── security.py        # Authentication and security utilities
│   │
│   ├── database/
│   │   ├── connection.py      # Database connection configuration
│   │   ├── session.py         # SQLAlchemy session management
│   │   └── dependencies.py    # Database dependencies
│   │
│   ├── models/                # SQLAlchemy database models
│   │   ├── user.py            # User model
│   │   └── task.py            # Task model
│   │
│   ├── schemas/               # Pydantic request and response schemas
│   ├── routers/               # API route definitions
│   ├── services/              # Business logic and service functions
│   ├── utils/                 # Reusable helper functions
│   └── main.py                # FastAPI application entry point
│
├── alembic/
│   ├── versions/              # Database migration files
│   └── env.py                 # Alembic configuration
│
├── tests/                     # Automated test suite
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variable template
├── alembic.ini                # Alembic configuration
└── README.md                  # Backend documentation
```

> The structure above describes the intended organization. File names may vary slightly depending on the current implementation.

---

## Application Architecture

```text
┌─────────────────────────────┐
│      Web / Mobile Client    │
└──────────────┬──────────────┘
               │ HTTP Requests
               ▼
┌─────────────────────────────┐
│        FastAPI Routes       │
│          Routers            │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│       Service Layer         │
│       Business Logic        │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│      SQLAlchemy ORM         │
│      Models and Sessions    │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│          MySQL              │
│        Database             │
└─────────────────────────────┘
```

---

## Prerequisites

Before running the backend, make sure the following tools are installed:

- Python 3.10 or later
- MySQL Server
- Git
- pip
- A virtual-environment tool

Verify your Python installation:

```bash
python --version
```

Verify pip:

```bash
python -m pip --version
```

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/chehak655/TickTheTask.git
cd TickTheTask/backend
```

If the repository is already available locally, open the backend directory directly.

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

### 3. Activate the Virtual Environment

#### Windows PowerShell

```powershell
.\.venv\Scripts\Activate.ps1
```

#### Windows Command Prompt

```cmd
.venv\Scripts\activate
```

#### macOS or Linux

```bash
source .venv/bin/activate
```

### 4. Install Dependencies

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 5. Configure the Environment

Create a local environment file:

#### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

#### Windows Command Prompt

```cmd
copy .env.example .env
```

#### macOS or Linux

```bash
cp .env.example .env
```

Open `.env` and update the database, authentication, CORS, and email settings as required.

### 6. Prepare the Database

Create the database in MySQL if it does not already exist:

```sql
CREATE DATABASE taskflow;
```

Update the database connection string in `.env` to match your local configuration.

### 7. Apply Database Migrations

Run:

```bash
python -m alembic upgrade head
```

If the project does not use migrations in your current version, follow the database initialization instructions implemented in the codebase.

---

## Environment Variables

The exact variables depend on the current application configuration. A typical `.env` file may contain:

```env
DATABASE_URL=mysql+pymysql://USERNAME:PASSWORD@localhost:3306/taskflow

SECRET_KEY=replace_with_a_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

CORS_ORIGINS=http://localhost:5173

EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@example.com
SMTP_PASSWORD=your_email_app_password
SMTP_USE_TLS=true
```

### Important Notes

- Do not commit `.env` to GitHub.
- Use a strong, randomly generated `SECRET_KEY`.
- Never expose database passwords or email credentials.
- For Gmail SMTP, use a Google App Password rather than your regular Gmail password when required.
- Confirm the variable names in `.env.example` before starting the application.

---

## Running the Application

From the `backend` directory, start the development server with:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

To make the server accessible to other devices on the same local network:

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API should then be available at:

```text
http://127.0.0.1:8000
```

When using `0.0.0.0`, access the service through the host computer's local IP address from another device.

---

## API Documentation

FastAPI automatically generates interactive API documentation.

Depending on the routes configured in the application, documentation may be available at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

If the project mounts its documentation under an API prefix, use the corresponding configured path, such as:

- `http://127.0.0.1:8000/api/v1/docs`
- `http://127.0.0.1:8000/api/v1/redoc`

The documentation interface can be used to:

- Explore available endpoints
- Inspect request and response schemas
- Send test requests
- Review authentication requirements
- Validate API behavior during development

---

## Health Check

If a health-check route is implemented, test it using a browser or `curl`.

Example:

```bash
curl http://127.0.0.1:8000/health
```

If the project uses a versioned API route, try the configured alternative:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

The exact path should be confirmed from the registered routes in `app.main`.

---

## Database Migrations

Alembic is used to manage database schema changes.

### Check the Current Migration

```bash
python -m alembic current
```

### View Migration History

```bash
python -m alembic history
```

### Apply Pending Migrations

```bash
python -m alembic upgrade head
```

### Roll Back One Migration

```bash
python -m alembic downgrade -1
```

> Before manually stamping a migration, verify that the corresponding schema change already exists in the database. Incorrectly stamping migrations can cause the database schema and migration history to become inconsistent.

---

## Testing

Run the complete test suite with:

```bash
python -m pytest tests/ -v
```

To run a specific test file:

```bash
python -m pytest tests/test_example.py -v
```

To run a specific test:

```bash
python -m pytest tests/test_example.py::test_example -v
```

Before running tests, ensure that:

- The virtual environment is active.
- All dependencies are installed.
- Test environment variables are configured.
- The required test database or test fixtures are available.

---

## Common Commands

| Task | Command |
|---|---|
| Activate virtual environment | `\.venv\Scripts\Activate.ps1` |
| Install dependencies | `python -m pip install -r requirements.txt` |
| Start backend | `python -m uvicorn app.main:app --reload --port 8000` |
| Check migration version | `python -m alembic current` |
| Apply migrations | `python -m alembic upgrade head` |
| Run tests | `python -m pytest tests/ -v` |
| View migration history | `python -m alembic history` |

---

## Troubleshooting

### Port 8000 Is Already in Use

If the server reports that port `8000` is already in use, another process may already be running the backend.

You can either:

- Stop the existing process, or
- Start the application on another port:

```bash
python -m uvicorn app.main:app --reload --port 8001
```

### Database Connection Errors

Check the following:

- MySQL is running.
- The database name is correct.
- The username and password are valid.
- The configured port is correct.
- The database driver is installed.
- The `DATABASE_URL` value is correctly formatted.

### Migration Errors

If a migration reports that a column or table already exists:

1. Inspect the actual database schema.
2. Check the current Alembic revision.
3. Compare the schema with the migration file.
4. Do not delete migration history without understanding the consequences.
5. Only use `alembic stamp` after verifying that the schema already matches the migration.

### Module Not Found Errors

Make sure you are running commands from the `backend` directory and that the virtual environment is active.

Use:

```bash
python -m pip install -r requirements.txt
```

instead of relying on a globally installed `pip`.

### Environment Variables Are Not Loading

Check that:

- The file is named `.env`.
- It is located where the application expects it.
- Variable names match `.env.example`.
- There are no accidental spaces or quotation issues.
- The application is restarted after changing the file.

---

## Security Recommendations

For development and deployment:

- Keep secrets outside the source code.
- Do not commit `.env` files.
- Use HTTPS in production.
- Use strong authentication secrets.
- Validate all incoming request data.
- Restrict CORS origins in production.
- Use least-privilege database credentials.
- Keep dependencies updated.
- Avoid returning sensitive information in API responses.
- Configure secure password hashing.
- Add rate limiting to authentication and OTP-related endpoints where appropriate.
- Review logs to ensure that tokens, passwords, and other secrets are never exposed.

---

## Deployment Notes

For production deployment:

1. Configure the production database.
2. Add all required environment variables to the hosting platform.
3. Run database migrations during deployment.
4. Bind Uvicorn to `0.0.0.0`.
5. Use the hosting provider's assigned `PORT` value.
6. Configure the production frontend URL in CORS settings.
7. Enable HTTPS.
8. Verify health-check and authentication endpoints after deployment.

Example production start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Use the actual deployment configuration required by your hosting provider.

---

## Contributing

Contributions are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make your changes.
4. Run the test suite.
5. Commit your changes:

   ```bash
   git commit -m "Add: your feature"
   ```

6. Push your branch:

   ```bash
   git push origin feature/your-feature
   ```

7. Open a pull request.

---

## License

Add the project's selected license here before publishing the repository.

If no license has been selected yet, the project remains subject to the applicable default copyright rules.

---

## Author

**Chehak**

GitHub: [@chehak655](https://github.com/chehak655)

---

> **Note:** Review the file and update route names, database names, environment variables, project structure, and deployment commands so that they exactly match the current implementation before publishing it.

