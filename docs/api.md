# TickTheTask API Documentation

The TickTheTask API is built with FastAPI. It auto-generates documentation via OpenAPI.

## Accessing Documentation
When the backend is running locally, access the interactive documentation at:
- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

## Important API Routes

### Authentication (/api/auth)
- POST /api/auth/register - Register a new user (triggers OTP).
- POST /api/auth/verify-otp - Verify the 4-digit OTP.
- POST /api/auth/resend-otp - Resend the OTP to an unverified email.
- POST /api/auth/login - Authenticate and retrieve a JWT token.
- GET /api/auth/me - Get current user profile.
- PUT /api/auth/profile - Update user settings (e.g., timezone).

### Tasks (/api/tasks)
- GET /api/tasks/ - Retrieve all tasks for the logged-in user.
- POST /api/tasks/ - Create a new task.
- PUT /api/tasks/{task_id} - Update a specific task.
- DELETE /api/tasks/{task_id} - Delete a task.
- POST /api/tasks/{task_id}/complete - Mark a task as completed (or incomplete).

### Health (/api/health)
- GET /api/health - Basic API availability check.
