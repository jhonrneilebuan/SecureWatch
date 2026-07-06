# SecureWatch Deployment Notes

SecureWatch runs locally with Docker Compose, but production deployment should use managed secrets, HTTPS, and restricted CORS.

## Local Docker

```powershell
cd C:\Users\jhonr\Desktop\SecureWatch
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Security engine: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

## Production Checklist

- Use a managed PostgreSQL database or a hardened PostgreSQL container with backups.
- Put secrets in the platform secret manager, not in source control.
- Set `JWT_KEY` to a long random value.
- Set `FRONTEND_ALLOWED_ORIGINS` to the real frontend URL.
- Enable HTTPS at the reverse proxy or hosting platform.
- Set `USE_HTTPS_REDIRECTION=true` only when the API receives HTTPS directly or trusted proxy headers are configured.
- Keep SMTP/API keys server-side only.
- Rotate API keys after demos or public screenshots.

## Hosting Options

- Azure App Service or Azure Container Apps for the API and frontend.
- Render or Railway for a simple portfolio deployment.
- AWS ECS, Lightsail, or a VPS for Docker Compose style hosting.
- Managed PostgreSQL from Azure, AWS RDS, Neon, Supabase, or Render.

## Optional Threat Intelligence Keys

The app currently uses AbuseIPDB for IP reputation and exposes readiness checks for:

- `VIRUSTOTAL_API_KEY`
- `SHODAN_API_KEY`
- `OTX_API_KEY`

Those are optional portfolio extensions and are not required for the local demo.
