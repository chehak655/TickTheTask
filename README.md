# TickTheTask

## Project Overview
TickTheTask is a comprehensive, full-stack task management application designed to help users track their daily priorities, deadlines, and schedules. It features a seamless cross-platform experience with a React web interface, an Expo React Native mobile application, and a high-performance FastAPI Python backend. TickTheTask emphasizes productivity, providing secure authentication, calendar scheduling, real-time reminders, and multi-theme customization out of the box.

## Features
- **Task Management**: Create, read, update, and delete tasks with priorities, status tracking, and deadlines.
- **Interactive Calendar**: View tasks by date, see exact due times, and differentiate between pending, completed, overdue, and high-priority tasks.
- **Secure Authentication**: JWT-based stateless authentication paired with secure password hashing.
- **Email OTP Verification**: Secure 4-digit One-Time Password verification via Gmail SMTP for account validation.
- **Task Reminders**: Automated email reminders sent safely via background workers for upcoming deadlines.
- **Multi-Theme Support**: Dark/Light modes along with built-in accent color themes .
- **Network Resiliency**: Built-in support for seamless local-network cross-device testing.

## Technology Stack
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy (ORM), PyMySQL, Pytest, Pydantic.
- **Web Frontend**: React, Vite, Tailwind CSS v4, React Router, Axios, Lucide React.
- **Mobile Frontend**: React Native, Expo, Expo SecureStore, React Navigation.
- **Database**: MySQL.

## Project Structure
```text
TaskTracker/
├── backend/            # FastAPI python server, database models, and endpoints
├── web/                # React Vite web application
├── mobile/             # Expo React Native mobile application
├── docs/               # Documentation files
├── .env.example        # Safe template for environment configurations
├── LOCAL_NETWORK_SETUP.md # Guide for LAN testing
└── start_tickthetask.bat  # Windows startup batch script
```

## Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **MySQL Server** (running locally on port 3306)
- **Expo Go** app installed on your physical mobile device (or an Android/iOS emulator).

## Backend Installation
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv .venv`
3. Activate the virtual environment:
   - Windows: `.\.venv\Scripts\activate`
   - Mac/Linux: `source .venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`

## Database Setup
1. Ensure your local MySQL server is running.
2. Log into MySQL and create the required database:
   ```sql
   CREATE DATABASE tickthetask_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Update your `.env` file with the correct `DB_USER` and `DB_PASSWORD`.
4. The FastAPI application utilizes SQLAlchemy's `create_all` hook on startup to provision tables automatically if they do not exist.

## Environment-Variable Configuration
1. Copy the `.env.example` file provided in the root directory.
2. Save it as `backend/.env`.
3. Do NOT commit the `.env` file to version control. Keep all placeholder keys and update them with your real configurations (DB credentials, secret key, etc.).

## Gmail App Password Setup
To enable OTP verification and task reminders:
1. Go to your **Google Account** settings.
2. Navigate to **Security** > **2-Step Verification** (ensure this is enabled).
3. Scroll down to **App Passwords**.
4. Create a new App Password named "TickTheTask".
5. Copy the 16-character code (without spaces) and paste it into your `backend/.env` under `SMTP_PASSWORD`.
6. Set `SMTP_USERNAME` and `SMTP_FROM_EMAIL` to your Gmail address.

## Backend Startup Commands
From the `backend/` directory (with your virtual environment activated):
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Note: Binding to `0.0.0.0` is required to allow local network devices (like mobile phones) to reach the API.*

## Web Startup Commands
From the `web/` directory:
```bash
npm install
npm run dev -- --host 0.0.0.0
```

## Mobile Startup Commands
From the `mobile/` directory:
```bash
npm install
npx expo start
```
Scan the generated QR code using the Expo Go app on your physical device.

## Local-Network Access Instructions
To use TickTheTask across multiple devices on the same network:
1. Both devices (e.g., your PC and mobile phone) must be connected to the same Wi-Fi network.
2. The backend is configured with dynamic CORS regex that automatically allows private LAN IP address blocks (e.g., `192.168.x.x`, `10.x.x.x`).
3. The Web and Mobile apps are coded to auto-resolve their host configurations. 
4. If auto-resolution fails on your device, explicitly define the IP by modifying the `EXPO_PUBLIC_API_URL` or `VITE_API_URL` environment variables in their respective `.env` files.
*(See `LOCAL_NETWORK_SETUP.md` for extended documentation).*

## OTP Verification Instructions
1. Register an account using a valid email address.
2. The backend generates a cryptographically secure 4-digit OTP.
3. The OTP is sent to your email and is valid for **10 minutes**.
4. Enter the code on the verification screen.
5. **Security**: The system locks out OTP verification after 5 consecutive incorrect attempts. You must wait for the 60-second cooldown period before requesting a resend.

## Testing Commands
- **Backend**: `python -m pytest -v` (Requires a running local MySQL instance on port 3306).
- **Web (Lint & Build)**: `npm run lint` followed by `npm run build`.
- **Mobile (Build Check)**: `npx expo export`.

## Troubleshooting Guide
- **Database OperationalError (2003)**: Ensure MySQL is running on localhost:3306 and the credentials in `.env` match.
- **SMTP Authentication Error**: Verify your Google App Password. Do not use your standard Gmail account password.
- **Expo Network Issues / Blank Screens**: If the mobile app cannot connect to the backend, try starting expo with the tunnel flag: `npx expo start --tunnel`.
- **Unexpected Token in Expo Build**: Ensure your Node.js and Expo versions match the project's required versions (e.g., `npx expo install --fix`).
- **401 Unauthorized loops**: Close the app completely or clear local storage to flush out stale JWT tokens.

## Security Notes
- **JWT Secrets**: The application strictly refuses to boot in `production` mode if the `SECRET_KEY` is weak, default, or shorter than 32 characters.
- **CORS Constraints**: Wildcard CORS (`*`) paired with credentials is fundamentally blocked in production mode.
- **Credential Masking**: Stack traces, environment variables, and email tokens are sanitized and never exposed in REST API HTTP responses.
- **Git Security**: `.env` files are tracked in `.gitignore`. **Never track production secrets via Git.**

## Deployment Instructions
1. **Database**: Provision a managed MySQL database (e.g., AWS RDS, GCP Cloud SQL).
2. **Backend**: Host the FastAPI server on platforms like Render, Heroku, or GCP Cloud Run. Set `ENVIRONMENT=production` and map all `.env` secrets into the cloud configuration dashboard.
3. **Frontend Web**: Deploy the `web/dist` folder to Vercel, Netlify, or Firebase Hosting. Ensure API URL mappings point to your hosted backend.
4. **Mobile**: Build standalone `.apk` or `.ipa` files using Expo Application Services (EAS): `eas build --profile production`.

## Known Limitations
- **Database Hard Requirement**: The backend test suite is directly tied to MySQL. SQLite fallback testing is known to fail due to incompatible schema paradigms.
- **Email Delivery Speed**: Real-time OTP dispatch speed relies entirely on Google's SMTP responsiveness. Under heavy loads, delivery may be delayed by a few seconds.
- **Dependency Warnings**: Some React hooks trigger minor non-fatal dependency exhaustion warnings (`react-hooks/exhaustive-deps`) during strict linting runs.
