# Runbook

## Prerequisites

| Requirement    | Version | Notes                                                  |
| -------------- | ------- | ------------------------------------------------------ |
| Docker         | 24+     | Docker Desktop on macOS/Windows, Docker Engine on Linux |
| Docker Compose | v2      | Included with Docker Desktop (`docker compose version`) |
| Node.js        | 20+     | Only needed to run the test suite                      |
| Free ports     | 80, 5433 | Change with `HTTP_PORT` / `POSTGRES_PORT` if taken    |
| Memory         | 4 GB    | Allocated to Docker                                    |

No other installs are required. Node dependencies are installed inside the Docker images.

## Environment

The stack runs with safe local defaults, so a `.env` file is optional. To customise settings:

```bash
cp .env.example .env
```

| Variable            | Default                              | When to change                          |
| ------------------- | ------------------------------------ | --------------------------------------- |
| `JWT_SECRET`        | `local-development-secret-change-me` | Always, outside local development       |
| `POSTGRES_PASSWORD` | `instagram`                          | Always, outside local development       |
| `HTTP_PORT`         | `80`                                 | Port 80 is in use                       |
| `POSTGRES_PORT`     | `5433`                               | Port 5433 is in use                     |
| `SEED_DEMO_DATA`    | `true`                               | Set `false` to start without demo data  |
| `COOKIE_SECURE`     | `false`                              | Set `true` when served over HTTPS       |

Generate a strong secret with `openssl rand -hex 32`.

## Start

```bash
docker compose up -d --build --wait
```

Open http://localhost (or `http://localhost:<HTTP_PORT>`). Log in as `alex_morgan` with password `demo1234`.

The first build takes a few minutes. Migrations and demo data are applied automatically.

## Verify

```bash
docker compose ps
npm test
```

All containers should show `healthy`, and the test suite should report all tests passed.

## Operate

| Task                         | Command                                          |
| ---------------------------- | ------------------------------------------------ |
| View logs                    | `docker compose logs -f`                         |
| Logs for one service         | `docker compose logs -f post-service`            |
| Rebuild one service          | `docker compose up -d --build --wait post-service` |
| Restart one service          | `docker compose restart post-service`            |
| Stop (keep data)             | `docker compose down`                            |
| Stop and delete all data     | `docker compose down --volumes`                  |
| Open a database shell        | `docker compose exec postgres psql -U instagram -d post_db` |

Databases: `auth_db`, `user_db`, `post_db`, `notification_db`. Uploaded media is stored in `./uploads` on the host.

## Troubleshooting

| Symptom                              | Fix                                                                  |
| ------------------------------------ | -------------------------------------------------------------------- |
| `port is already allocated`          | Set `HTTP_PORT` or `POSTGRES_PORT` in `.env` and start again          |
| Container stays `unhealthy`          | Check `docker compose logs <service>`, then rebuild that service      |
| Browser shows 502                    | A service is still starting; wait for `docker compose ps` to show healthy |
| HTTP 429 responses                   | Rate limit reached; wait one minute                                   |
| Login fails after resetting data     | Clear cookies for localhost and log in again                          |
| Need a completely fresh start        | `docker compose down --volumes && docker compose up -d --build --wait` |
