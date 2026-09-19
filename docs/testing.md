# TickTheTask Testing Guide

## Backend Tests
The backend test suite is written using pytest.

1. Activate your virtual environment: .\venv\Scripts\activate (Windows)
2. Ensure you have a test MySQL database or adjust the connection string.
3. Run the tests:
   pytest -v

Tests cover authentication, OTP logic, tenant isolation, CRUD operations, and SMTP mocking.

## Web Tests (Linting & Build)
Validate the React frontend by running:
1. 
pm run lint (Checks for code quality and unused variables)
2. 
pm run build (Ensures the Vite production build compiles successfully)

## Mobile Tests
Validate the Expo environment:
1. 
px expo install --check (Validates dependency compatibility)
2. 
px expo export (Verifies the bundle compiles)
