# TickTheTask Architecture

## High-Level Architecture
TickTheTask is a full-stack, cross-platform task management application consisting of:
1. **Web Frontend:** A responsive React application built with Vite and Tailwind CSS.
2. **Mobile Frontend:** A cross-platform mobile app built with React Native and Expo.
3. **Backend API:** A high-performance Python application built with FastAPI.
4. **Database:** A relational MySQL database accessed asynchronously via SQLAlchemy.

## Request Flow
1. The client (Web or Mobile) sends an HTTP request to the FastAPI backend.
2. If authentication is required, the get_current_user dependency intercepts the request, verifying the JWT in the Authorization header.
3. The request hits the appropriate router (e.g., outers/tasks.py), where Pydantic schemas validate incoming JSON payloads.
4. Business logic interacts with the database via SQLAlchemy async sessions.
5. A JSON response is returned to the client.

## Authentication Flow
1. **Registration:** User submits email/password. The backend creates an inactive user, hashes the password (bcrypt), and generates a 4-digit OTP. An email is sent via SMTP.
2. **OTP Verification:** User submits the OTP. The backend marks the user as active.
3. **Login:** User submits credentials. The backend verifies the password hash and returns an access token (JWT).
4. **Authorization:** Subsequent requests include the token.

## Task CRUD Flow
- **Create:** User submits task details. Backend assigns ownership to the current user.
- **Read:** Queries filter tasks belonging *only* to the authenticated user.
- **Update/Delete:** Before modifying a task, the backend checks if 	ask.user_id == current_user.id to prevent cross-tenant data access.

## Email Notification Flow
The application uses Python's smtplib and email packages to send asynchronous notifications.
- **OTP Delivery:** Triggered during registration.
- **Task Reminders:** A background asyncio worker (eminder_scheduler.py) polls the database every 60 seconds. It identifies overdue or upcoming tasks and triggers email alerts natively through a dedicated thread pool to avoid blocking the async event loop.
