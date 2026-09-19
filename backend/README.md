# TaskFlow Backend

High-performance REST API built with FastAPI, SQLAlchemy 2.0, Pydantic, and MySQL.

## Architecture

```
backend/
├── app/
│   ├── core/         # Settings & security configuration
│   ├── database/     # SQLAlchemy engine, session maker, get_db dependency
│   ├── models/       # SQLAlchemy ORM models (User, Task)
│   ├── schemas/      # Pydantic request/response models
│   ├── routers/      # API route controllers
│   ├── services/     # Business logic layer
│   ├── utils/        # Utility helpers
│   └── main.py       # FastAPI application entrypoint
├── tests/            # Pytest test suite
├── requirements.txt  # Project dependencies
├── .env.example      # Environment variables template
└── README.md
```

## Setup & Running

1. **Activate Virtual Environment**:
   ```bash
   # Windows (PowerShell)
   .\.venv\Scripts\Activate.ps1
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and adjust database credentials as needed:
   ```bash
   copy .env.example .env
   ```

4. **Start Development Server**:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

5. **Run Tests**:
   ```bash
   pytest tests/ -v
   ```

6. **Interactive Documentation**:
   - Swagger UI: `http://127.0.0.1:8000/api/v1/docs`
   - ReDoc: `http://127.0.0.1:8000/api/v1/redoc`
   - Health Check: `http://127.0.0.1:8000/api/v1/health`
