# Instagram Clone

A full-stack social media platform modelled on Instagram, built as a set of independently deployable microservices. It supports photo and video posts, likes, comments, saved posts, follows, a personalised feed, an explore page, 24-hour stories, direct messaging and realtime notifications.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Available Commands](#available-commands)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Features

| Area          | Capabilities                                                                              |
| ------------- | ----------------------------------------------------------------------------------------- |
| Accounts      | Registration, login by username or email, secure cookie sessions, logout                  |
| Profiles      | Editable name, username, category and bio; avatar upload; follower and following counts   |
| Social graph  | Follow and unfollow, user search, suggested accounts                                      |
| Posts         | Image and video uploads with captions and locations, deletion by the author               |
| Engagement    | Likes, comments and private saved collections                                             |
| Discovery     | Personalised home feed and an explore grid, both with infinite scrolling                  |
| Stories       | Image stories that expire after 24 hours, with seen state and view counts for the author  |
| Messaging     | One-to-one conversations with realtime delivery and unread counts                         |
| Notifications | Likes, comments and follows, delivered in realtime with an unread indicator               |

## Technology Stack

| Layer          | Technology                                                   |
| -------------- | ------------------------------------------------------------ |
| Frontend       | Next.js 14 (App Router), React 18, Tailwind CSS, socket.io   |
| Backend        | NestJS 10, Express, TypeScript                               |
| Data           | PostgreSQL 16 with Prisma 5, one database per service        |
| Messaging      | Apache Kafka 3.8 in KRaft mode                               |
| Media          | sharp for image processing, nginx for static delivery        |
| Infrastructure | Docker Compose, nginx reverse proxy                          |

## Getting Started

### Prerequisites

- Docker Desktop, or Docker Engine with Docker Compose v2
- Node.js 20 or later (only required to run the test suite)

### Installation

Clone the repository and start the stack:

```bash
git clone <repository-url>
cd insta_clone
docker compose up -d --build --wait
```

The first build takes a few minutes. Once every container reports healthy, open http://localhost in your browser.

Database migrations are applied automatically when each service starts, and demo data is seeded on startup. No additional setup steps are required.

## Demo Accounts

All demo accounts use the password `demo1234`.

| Username        | Email                       |
| --------------- | --------------------------- |
| `alex_morgan`   | `alex.morgan@example.com`   |
| `sarah_chen`    | `sarah.chen@example.com`    |
| `marcus_vance`  | `marcus.vance@example.com`  |
| `elena_rostova` | `elena.rostova@example.com` |
| `david_kim`     | `david.kim@example.com`     |

## Available Commands

Run these from the repository root.

| Command         | Description                                                 |
| --------------- | ----------------------------------------------------------- |
| `npm start`     | Build and start all services, waiting until they are healthy |
| `npm stop`      | Stop all services while preserving data                     |
| `npm run reset` | Stop all services and delete the database volume            |
| `npm run logs`  | Stream logs from every container                            |
| `npm test`      | Run the end-to-end test suite against the running stack     |

## Configuration

The default configuration is suitable for local development. To override a value, set it as an environment variable or add it to a `.env` file alongside `docker-compose.yml`.

| Variable            | Default                              | Description                                                |
| ------------------- | ------------------------------------ | ---------------------------------------------------------- |
| `JWT_SECRET`        | `local-development-secret-change-me` | Secret used to sign session tokens. Must be changed for any shared or public deployment. |
| `POSTGRES_PASSWORD` | `instagram`                          | Password for the PostgreSQL `instagram` user               |
| `HTTP_PORT`         | `80`                                 | Host port on which nginx serves the application            |
| `POSTGRES_PORT`     | `5433`                               | Host port for PostgreSQL, bound to `127.0.0.1` only        |
| `SEED_DEMO_DATA`    | `true`                               | Seeds demo accounts, posts and conversations on startup    |
| `COOKIE_SECURE`     | `false`                              | Marks the session cookie as secure; enable when using HTTPS |

Example `.env` file:

```bash
JWT_SECRET=replace-with-a-long-random-string
POSTGRES_PASSWORD=replace-with-a-strong-password
HTTP_PORT=8080
SEED_DEMO_DATA=false
```

## Architecture

### Request Flow

```text
Browser --> nginx (port 80)
              |-- /             --> frontend (Next.js, server-side rendering)
              |-- /api/*        --> api-gateway
              |                       |-- auth-service          --> auth_db
              |                       |-- user-service          --> user_db
              |                       |-- post-service          --> post_db
              |                       `-- notification-service  --> notification_db
              |-- /socket.io/*  --> notification-service (realtime events)
              `-- /media/*      --> ./uploads (static files)

user-service, post-service --(activity events)--> Kafka --> notification-service
```

### Services

| Service                | Responsibility                                               | Internal Port |
| ---------------------- | ------------------------------------------------------------ | ------------- |
| `api-gateway`          | Request routing, session verification, identity propagation  | 3051          |
| `auth-service`         | Account credentials, password hashing, session issuance      | 4001          |
| `user-service`         | Profiles, avatars, follows, search and suggestions           | 4002          |
| `post-service`         | Posts, media processing, likes, comments and saved posts     | 4003          |
| `notification-service` | Notifications, direct messages, stories and realtime updates | 4005          |
| `frontend`             | Server-rendered web application                              | 3000          |

Only nginx is published to the host (PostgreSQL is additionally bound to `127.0.0.1` for local tooling). All service-to-service communication happens on the internal Docker network.

### Authentication

`auth-service` issues a JSON Web Token valid for seven days, stored in an `HttpOnly`, `SameSite=Lax` cookie. The API gateway verifies the token on every request, removes any client-supplied `x-user-id` header, and forwards the verified user ID to downstream services. The realtime socket connection authenticates using the same cookie.

### Service Communication

- **Synchronous:** services call one another over HTTP using endpoints under `/internal/*`. The gateway never routes these paths, so they are unreachable from outside the Docker network.
- **Asynchronous:** `user-service` and `post-service` publish `user.followed`, `post.liked` and `post.commented` events to the `activity` Kafka topic. `notification-service` consumes these events, persists notifications and pushes them to connected clients.

### Media Storage

Uploaded images are resized and converted to WebP. Videos in MP4, WebM and MOV formats are stored unmodified. All media is written to `./uploads` and served by nginx under `/media/` with long-lived cache headers.

| Path                           | Contents                          |
| ------------------------------ | --------------------------------- |
| `uploads/profiles/demo/`       | Demo profile pictures (versioned) |
| `uploads/posts/demo/`          | Demo post images (versioned)      |
| `uploads/profiles/<userId>/`   | Uploaded avatars                  |
| `uploads/posts/<year>/<month>/`| Uploaded post images              |
| `uploads/videos/<year>/<month>/`| Uploaded post videos             |
| `uploads/stories/<userId>/`    | Uploaded stories                  |

Everything outside the demo directories is runtime data and is excluded from version control.

## API Reference

All endpoints are served under `/api` and require an authenticated session unless noted otherwise.

### Authentication

| Method | Endpoint             | Description                                  |
| ------ | -------------------- | -------------------------------------------- |
| POST   | `/api/auth/register` | Create an account (public)                   |
| POST   | `/api/auth/login`    | Log in with a username or email (public)     |
| POST   | `/api/auth/logout`   | Clear the session cookie (public)            |
| GET    | `/api/auth/me`       | Return the current account's email address   |

### Users

| Method | Endpoint                  | Description                              |
| ------ | ------------------------- | ---------------------------------------- |
| GET    | `/api/users/me`           | Current user's profile                   |
| PATCH  | `/api/users/me`           | Update name, username, category or bio   |
| POST   | `/api/users/me/avatar`    | Upload a new avatar (`multipart/form-data`) |
| GET    | `/api/users/search?q=`    | Search users by username or name         |
| GET    | `/api/users/suggestions`  | Suggested accounts to follow             |
| GET    | `/api/users/:username`    | Public profile with follow status        |
| POST   | `/api/users/:id/follow`   | Follow a user                            |
| DELETE | `/api/users/:id/follow`   | Unfollow a user                          |

### Posts

| Method | Endpoint                     | Description                                   |
| ------ | ---------------------------- | --------------------------------------------- |
| POST   | `/api/posts`                 | Create a post (`multipart/form-data`)         |
| GET    | `/api/posts/feed`            | Posts from followed accounts and the user     |
| GET    | `/api/posts/explore`         | Posts from other accounts                     |
| GET    | `/api/posts/bookmarked`      | The user's saved posts                        |
| GET    | `/api/posts/user/:userId`    | Posts by a user, including a total count      |
| GET    | `/api/posts/:id`             | Post details with comments                    |
| DELETE | `/api/posts/:id`             | Delete a post (author only)                   |
| POST   | `/api/posts/:id/like`        | Like a post                                   |
| DELETE | `/api/posts/:id/like`        | Remove a like                                 |
| POST   | `/api/posts/:id/bookmark`    | Save a post                                   |
| DELETE | `/api/posts/:id/bookmark`    | Remove a saved post                           |
| POST   | `/api/posts/:id/comments`    | Add a comment                                 |

List endpoints use cursor pagination. Pass `limit` (1 to 50, default 12) and the `nextCursor` value from the previous response as `cursor`.

### Notifications, Messages and Stories

| Method | Endpoint                                      | Description                          |
| ------ | --------------------------------------------- | ------------------------------------ |
| GET    | `/api/notifications`                          | Latest notifications                 |
| GET    | `/api/notifications/unread-count`             | Number of unread notifications       |
| POST   | `/api/notifications/read`                     | Mark all notifications as read       |
| GET    | `/api/messages/conversations`                 | Conversations with unread counts     |
| POST   | `/api/messages/conversations`                 | Open a conversation with a user      |
| GET    | `/api/messages/conversations/:id/messages`    | Messages in a conversation           |
| POST   | `/api/messages/conversations/:id/messages`    | Send a message                       |
| POST   | `/api/messages/conversations/:id/read`        | Mark a conversation as read          |
| POST   | `/api/stories`                                | Create a story (`multipart/form-data`) |
| GET    | `/api/stories/feed`                           | Active stories grouped by author     |
| POST   | `/api/stories/:id/view`                       | Record a story view                  |

### Realtime Events

Clients connect with socket.io at the site origin. The server emits:

| Event          | Payload                                         |
| -------------- | ----------------------------------------------- |
| `notification` | A new notification, including the actor profile |
| `message`      | A new direct message in one of the user's conversations |

## Project Structure

```text
.
|-- docker-compose.yml          Service orchestration
|-- frontend/                   Next.js web application
|   |-- Dockerfile
|   `-- src/
|       |-- app/                Routes and layouts
|       |-- components/         UI components
|       `-- lib/                API clients, types and utilities
|-- infrastructure/
|   |-- nginx/nginx.conf        Reverse proxy, rate limiting, media delivery
|   `-- postgres/init.sql       Per-service database creation
|-- services/
|   |-- Dockerfile              Shared build definition for all services
|   |-- api-gateway/
|   |-- auth-service/
|   |-- user-service/
|   |-- post-service/
|   `-- notification-service/
|-- tests/e2e.mjs               End-to-end test suite
`-- uploads/                    Media storage
```

Each service follows the same layout: `prisma/` holds the schema and migrations, and `src/` holds the controllers, services, DTOs and the idempotent demo seed.

## Development

Each service is an independent npm package with its own lockfile. To work on a service locally:

```bash
cd services/post-service
npm ci
npm run typecheck
```

The frontend offers the same commands, plus `npm run lint`.

To rebuild and restart a single service after making changes:

```bash
docker compose up -d --build --wait post-service
```

### Database Migrations

Schema changes are managed with Prisma migrations. After editing a service's `prisma/schema.prisma`, generate a migration against the running database:

```bash
cd services/post-service
DATABASE_URL=postgresql://instagram:instagram@localhost:5433/post_db \
  npx prisma migrate dev --create-only --name describe_change
```

Review the generated SQL, commit it, and rebuild the service. Pending migrations are applied with `prisma migrate deploy` whenever a service container starts.

## Testing

The end-to-end suite runs against the live stack through nginx, exercising the application exactly as a browser would.

```bash
npm start
npm test
```

The suite covers:

- Registration, login, input validation and uniqueness rules
- Gateway protections, including rejection of spoofed identity headers and internal endpoints
- Profile updates, avatar uploads, search and suggestions
- Following, feed composition and cursor pagination
- Image and video uploads, likes, comments and saved posts
- Kafka-driven notifications delivered over websockets
- Direct messaging, unread counts and conversation privacy
- Stories, visibility rules and view tracking
- Ownership checks, server-rendered pages, 404 handling and logout

If nginx runs on a port other than 80, set `HTTP_PORT` when running the tests, for example `HTTP_PORT=8080 npm test`.

## Troubleshooting

| Problem                                   | Resolution                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Port 80 or 5433 is already in use         | Set `HTTP_PORT` or `POSTGRES_PORT` to a free port and restart the stack    |
| A container fails to become healthy       | Inspect it with `docker compose logs <service>`                            |
| Requests return HTTP 429                  | nginx rate limiting is active; wait a minute and retry                     |
| You want to start again with fresh data   | Run `npm run reset`, then `npm start`                                      |
| Changes to code are not reflected         | Rebuild the affected service with `docker compose up -d --build <service>` |

## Security Considerations

Before deploying anywhere other than a local machine:

- Set `JWT_SECRET` and `POSTGRES_PASSWORD` to strong, randomly generated values.
- Serve the application over HTTPS and set `COOKIE_SECURE=true`.
- Set `SEED_DEMO_DATA=false` so the demo accounts with known passwords are not created.
- Remove the PostgreSQL port mapping from `docker-compose.yml` if host access is not required.
- Review the nginx rate limits in `infrastructure/nginx/nginx.conf` for your expected traffic.
