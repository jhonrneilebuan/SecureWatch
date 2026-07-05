# SecureWatch

SecureWatch is an AI-powered security monitoring dashboard for IT administrators and security analysts. It analyzes uploaded authentication logs, detects suspicious behavior, calculates risk scores, creates incidents, supports IP/CVE lookups, exports PDF reports, and presents a dark SOC-style dashboard.

## Features

- JWT login, registration, refresh tokens, logout, and protected routes
- Admin and Analyst role-based authorization
- Admin user management with create, role edit, active/disabled status, and delete confirmation
- Actual SecureWatch login failed-attempt detection with threat creation, incident creation, SMTP alerting, and account lockout
- Log upload for `.log`, `.txt`, and `.csv` files
- Python FastAPI detection for brute force, failed logins, repeated IPs, successful logins, sensitive route access, and suspicious IP activity
- Risk scoring: Low, Medium, High, Critical
- Automatic incident creation for High/Critical threats
- Incident assignment, status updates, notes, and resolution
- AbuseIPDB-ready IP reputation lookup through backend-only API keys
- NVD CVE lookup by keyword/software name
- OpenAI-ready AI recommendation service with local fallback guidance
- SMTP alert service and frontend email alert history for High/Critical threats
- Dashboard analytics using Recharts
- Richer PDF security summary export with incidents, high-risk IPs, alert delivery counts, and recommendations
- Audit logs for important actions

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, React Router, Axios, Recharts, Lucide Icons
- Backend: ASP.NET Core Web API (.NET 8), EF Core, PostgreSQL, JWT
- Security Engine: Python, FastAPI
- DevOps: Docker, Docker Compose

## Local Development

PostgreSQL local connection is currently configured as:

```text
Host=localhost;Port=5432;Database=securewatch;Username=postgres;Password=ebuan
```

Apply migrations:

```powershell
cd C:\Users\jhonr\Desktop\SecureWatch\backend
dotnet ef database update
```

Run security engine:

```powershell
cd C:\Users\jhonr\Desktop\SecureWatch\security-engine
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Run backend:

```powershell
cd C:\Users\jhonr\Desktop\SecureWatch\backend
dotnet run
```

Run frontend:

```powershell
cd C:\Users\jhonr\Desktop\SecureWatch\frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Docker

```powershell
cd C:\Users\jhonr\Desktop\SecureWatch
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Security Engine: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

## Environment Variables

Do not expose these keys in the frontend.

Create or edit `.env` in the project root:

```text
ABUSEIPDB_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
NVD_API_KEY=
JWT_KEY=replace_with_a_long_random_jwt_secret_at_least_32_characters
JWT_EXPIRES_MINUTES=120
JWT_REFRESH_TOKEN_DAYS=7
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=alerts@securewatch.local
SMTP_TO=
```

The app works without OpenAI, AbuseIPDB, NVD, and SMTP by returning local defensive recommendations and not-configured status metadata. `JWT_KEY` is required before running the backend.

## Test Accounts

Local development password for both:

```text
SecureWatch@123
```

- Admin: `admin@securewatch.com`
- Analyst: `analyst@securewatch.com`

## Testing Flow

1. Login as Admin.
2. Upload [sample-auth.log](C:/Users/jhonr/Desktop/SecureWatch/sample-auth.log).
3. Open Dashboard and confirm cards/charts update.
4. Open Threat Analysis and review risk score/recommendations.
5. Open Incidents and resolve the auto-created incident.
6. Open IP Reputation and check an IP.
7. Open CVE Lookup and search a product keyword.
8. Open Reports and export the PDF summary.
9. Open Email Alerts and confirm sent/failed/skipped alert history.
10. Open Audit Logs and confirm activity was tracked.

## Failed Login Lockout Test

1. Restart the backend after setting `JWT_KEY` in `.env`.
2. Open `http://localhost:3000/login`.
3. Enter `admin@securewatch.com` with the wrong password 5 times within 15 minutes.
4. The backend records failed login attempts, creates a `SecureWatch Login Brute Force` threat, opens an incident, sends SMTP if configured, and locks the account for 15 minutes.
5. Login again after the lock expires, or use another seeded/admin account during testing.

## SMTP Alert Test

Set SMTP values in `.env`, restart the backend, then upload `sample-auth.log`. The sample creates a High brute-force threat, which sends an email alert to `SMTP_TO`.

For Gmail, use an App Password instead of your normal account password:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM=your_email@gmail.com
SMTP_TO=recipient_email@gmail.com
```

## Automated Checks

```powershell
cd C:\Users\jhonr\Desktop\SecureWatch\backend
dotnet build
dotnet run --project .\SecureWatch.Api.SmokeTests

cd C:\Users\jhonr\Desktop\SecureWatch\frontend
npm run build
npm run test:smoke

cd C:\Users\jhonr\Desktop\SecureWatch\security-engine
$env:PYTHONPATH = (Resolve-Path .pytest-packages).Path
python -m pytest tests
```

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/dashboard/summary`
- `POST /api/logs/upload`
- `GET /api/threats`
- `GET /api/threats/{id}`
- `GET /api/incidents`
- `POST /api/incidents`
- `PUT /api/incidents/{id}`
- `POST /api/incidents/{id}/notes`
- `GET /api/lookups/ip/{ipAddress}`
- `GET /api/lookups/cve?query=openssl`
- `GET /api/reports/security-summary.pdf`
- `GET /api/auditlogs`
- `GET /api/emailalerts`
- `GET /api/settings/status`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`

## Screenshots

Add dashboard, upload, threat analysis, incidents, reports, and user management screenshots here for portfolio presentation.

## Security Note

SecureWatch is for defensive cybersecurity monitoring and portfolio/demo use. Do not upload sensitive production logs without reviewing data handling, retention, key management, SMTP configuration, and third-party API privacy requirements.
