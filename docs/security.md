# TickTheTask Security Practices

## Authentication & Authorization
- **JWT (JSON Web Tokens):** Secure, stateless authentication. Tokens should be signed with a strong SECRET_KEY.
- **Tenant Isolation:** All database queries implicitly filter by the user_id extracted from the verified JWT.
- **Password Hashing:** Passwords are never stored in plaintext. They are hashed using crypt via PassLib.

## Network Security
- **CORS (Cross-Origin Resource Sharing):** Explicitly configured in main.py to prevent unauthorized domain access.
- **SQL Injection Prevention:** SQLAlchemy ORM parameterizes all queries natively.

## Data Protection
- **OTP Handling:** OTPs are hashed similarly to passwords. Plaintext OTPs are only visible in the outgoing email.
- **Rate Limiting:** OTP resend limits exist to prevent email spam.

## Remaining Concerns (Future Improvements)
- Token blocklisting for immediate logout invalidation.
- Refresh token rotation (currently relying on long-lived access tokens).
- Rate-limiting middleware (e.g., slowapi) for general API routes.
