# SecureWatch

**AI-Powered Security Monitoring Dashboard**

SecureWatch is a full-stack cybersecurity monitoring platform built for IT administrators and security analysts. It analyzes uploaded system logs, detects suspicious login activity, identifies brute-force attack patterns, enriches threats with security intelligence, manages incidents, and presents results in a responsive SOC-style dashboard.

## Live Demo

- Frontend: [https://securewatch-4l1r.onrender.com](https://securewatch-4l1r.onrender.com)
- Backend API: [https://securewatch-backend-2124.onrender.com](https://securewatch-backend-2124.onrender.com)
- Security Engine: [https://securewatch-security-engine.onrender.com/docs](https://securewatch-security-engine.onrender.com/docs)

Demo accounts:

```text
Admin: admin@securewatch.com
Analyst: analyst@securewatch.com
Password: SecureWatch@123
```

## Project Overview

SecureWatch simulates a defensive SOC workflow:

1. Analysts upload authentication/system logs.
2. The ASP.NET Core API forwards logs to a FastAPI security engine.
3. The security engine detects failed login bursts, repeated source IPs, brute-force patterns, and suspicious activity.
4. Threats and incidents are stored in PostgreSQL.
5. The dashboard updates with charts, threat analysis, IP reputation, CVE lookup, audit logs, reports, and alert history.

## Core Features

- JWT authentication with refresh tokens
- Admin and Analyst role-based authorization
- Admin user management and account unlock
- Failed-login lockout and brute-force threat creation
- Log upload for `.log`, `.txt`, and `.csv` files
- FastAPI-based threat detection engine
- Risk scoring: Low, Medium, High, Critical
- MITRE ATT&CK mapping for detected threats
- Automatic incident creation for High/Critical threats
- Incident assignment, notes, evidence references, timeline, and resolution notes
- Live in-app notifications
- IP reputation lookup with AbuseIPDB support
- Threat intelligence readiness for VirusTotal, Shodan, and AlienVault OTX
- NVD CVE lookup by product/software keyword
- AI-assisted recommendation service with fallback guidance
- Email alert history and delivery status tracking
- SOC dashboard analytics using Recharts
- Cyberthreat real-time map visualization
- PDF security summary export
- Audit logging for important actions
- Responsive dark SOC dashboard UI

## Tech Stack

Frontend:

- React
- TypeScript
- Tailwind CSS
- React Router
- Axios
- Recharts
- Lucide Icons
- D3 Geo / TopoJSON / World Atlas

Backend:

- ASP.NET Core Web API (.NET 8)
- Entity Framework Core
- PostgreSQL
- JWT Authentication
- Role-Based Authorization

Security Engine:

- Python
- FastAPI
- Log parsing
- Threat detection algorithms

DevOps / Cloud:

- Docker
- Docker Compose
- Render
- Neon PostgreSQL

## Project Structure

```text
SecureWatch/
├── frontend/          React + TypeScript client
├── backend/           ASP.NET Core Web API
├── security-engine/   Python FastAPI microservice
├── database/          PostgreSQL init files
├── docs/              Deployment notes
├── samples/           Sample logs for testing
├── docker-compose.yml
└── README.md
```

## Local Setup

Prerequisites:

- Node.js
- .NET 8 SDK
- Python 3.11+
- PostgreSQL
- Docker Desktop, optional

Create a local PostgreSQL database:

```text
Database: securewatch
```

Create a project root `.env` file. Use `.env.example` as reference and set at least:

```text
JWT_KEY=replace_with_a_long_random_secret_at_least_32_characters
JWT_EXPIRES_MINUTES=120
JWT_REFRESH_TOKEN_DAYS=7
FRONTEND_ALLOWED_ORIGINS=http://localhost:3000
USE_HTTPS_REDIRECTION=false
```

Configure your backend connection string in `backend/appsettings.json` or via environment variable:

```text
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=securewatch;Username=postgres;Password=your_password
```

Apply database migrations:

```powershell
cd backend
dotnet ef database update
```

Run the security engine:

```powershell
cd security-engine
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Run the backend:

```powershell
cd backend
dotnet run
```

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Docker Setup

```powershell
docker compose up --build
```

Default local service URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Security Engine: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

## Environment Variables

Do not expose backend secrets in the frontend.

Local root `.env` example:

```text
ABUSEIPDB_API_KEY=
VIRUSTOTAL_API_KEY=
SHODAN_API_KEY=
OTX_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
NVD_API_KEY=
JWT_KEY=replace_with_a_long_random_jwt_secret
JWT_EXPIRES_MINUTES=120
JWT_REFRESH_TOKEN_DAYS=7
FRONTEND_ALLOWED_ORIGINS=http://localhost:3000
USE_HTTPS_REDIRECTION=false
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=
SMTP_TO=
```

Render backend environment variable format:

```text
ConnectionStrings__DefaultConnection=
SecurityEngine__BaseUrl=https://securewatch-security-engine.onrender.com
Frontend__AllowedOrigins__0=https://securewatch-4l1r.onrender.com
Jwt__Key=
Jwt__Issuer=SecureWatch
Jwt__Audience=SecureWatchUsers
Jwt__ExpiresMinutes=120
Jwt__RefreshTokenDays=7
AbuseIPDB__ApiKey=
OpenAI__ApiKey=
OpenAI__Model=gpt-4o-mini
Nvd__ApiKey=
VirusTotal__ApiKey=
Shodan__ApiKey=
Otx__ApiKey=
Smtp__Host=
Smtp__Port=587
Smtp__Username=
Smtp__Password=
Smtp__From=
Smtp__To=
```

Render frontend environment variable:

```text
VITE_API_URL=https://securewatch-backend-2124.onrender.com/api
```

## Testing Flow

1. Login as Admin.
2. Upload a sample log from `samples/`.
3. Open Dashboard and confirm metrics/charts update.
4. Open Threat Analysis and review severity, risk score, source IP, MITRE mapping, and recommendations.
5. Open Incident Management and update the auto-created incident.
6. Open IP Reputation and check a public IP.
7. Open CVE Lookup and search a keyword such as `openssl`, `nginx`, or `windows`.
8. Open Reports and export the PDF security summary.
9. Open Audit Logs and confirm system activity was tracked.
10. Open Email Alerts and review sent/failed/skipped alert history.

## Sample Logs

The `samples/` folder contains example authentication logs for testing different countries and source IPs:

- `sample-auth-us.log`
- `sample-auth-germany.log`
- `sample-auth-uk.log`
- `sample-auth-japan.log`
- `sample-auth-australia.log`

Uploading these files triggers the detection pipeline and updates dashboard analytics.

## SMTP Note

SMTP alert generation and delivery history are implemented. On some cloud hosts, outbound SMTP ports such as `587`, `465`, or `25` may be blocked. In that case, SecureWatch records the delivery attempt as failed and displays the provider/network error in the Email Alerts page.

This keeps alert observability visible even when the hosting provider restricts direct SMTP delivery.

## Automated Checks

Backend:

```powershell
cd backend
dotnet build
```

Frontend:

```powershell
cd frontend
npm run build
```

Security engine:

```powershell
cd security-engine
python -m pytest tests
```

## API Highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/logs/upload`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/live-feed`
- `GET /api/threats`
- `GET /api/threats/{id}`
- `GET /api/incidents`
- `GET /api/incidents/{id}`
- `POST /api/incidents/{id}/notes`
- `POST /api/incidents/{id}/evidence`
- `GET /api/lookups/ip/{ipAddress}`
- `GET /api/lookups/cve?query=openssl`
- `GET /api/reports/security-summary.pdf`
- `GET /api/auditlogs`
- `GET /api/emailalerts`
- `GET /api/users`
- `POST /api/users`
- `POST /api/users/{id}/unlock`

## Portfolio Description

SecureWatch is an AI-powered cybersecurity monitoring dashboard that analyzes uploaded system logs, detects brute-force attack patterns, enriches threats with IP reputation and CVE intelligence, manages incidents, and provides SOC-style reporting through a full-stack cloud-deployed architecture.

## Security Notice

SecureWatch is a defensive cybersecurity portfolio project. Do not upload sensitive production logs without reviewing data retention, privacy, access control, secrets management, and third-party API policies.
