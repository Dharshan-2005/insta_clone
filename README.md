# Instagram Clone — Microservices Monorepo

A full-stack, microservices-based Instagram Clone built with NestJS, Next.js, Prisma, PostgreSQL, Redis, Kafka, and Docker.

---

## 📋 Prerequisites

Make sure you have the following installed on your machine:

- **Node.js**: v20+ 
- **Docker & Docker Desktop**: Ensure Docker Desktop is running.
- **Git**

---

## 🚀 Quick Start (Running on Another System)

Follow these step-by-step instructions to clone, set up, and run the project from scratch on a new machine.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd instagram-clone-hackathon-fixed
```

### 2. Install Dependencies

In the root directory, run:

```bash
npm install
```

> **Note**: If `npm install` runs out of memory on low-RAM systems, increase Node's heap memory:
> - **Linux/macOS**: `NODE_OPTIONS="--max-old-space-size=4096" npm install`
> - **Windows (PowerShell)**: `$env:NODE_OPTIONS="--max-old-space-size=4096"; npm install`
> - **Windows (CMD)**: `set NODE_OPTIONS=--max-old-space-size=4096 && npm install`

---

### 3. Setup Environment Variables

The project works out of the box with default Docker configurations. If you want to configure optional settings (e.g., Google OAuth):

1. Go to the `frontend` folder:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```
2. (Optional) Update `frontend/.env.local` with your Google OAuth credentials or custom settings if required.

---

### 4. Start the Microservices Stack with Docker

From the project root directory, run:

```bash
docker compose up -d --build
```

This will spin up:
- **PostgreSQL** (`localhost:5433`)
- **Redis** (`localhost:6380`)
- **ZooKeeper & Kafka** (`localhost:2181`, `localhost:29092`)
- **Kafka UI** (`localhost:8080`)
- **Microservices**:
  - `auth-service` (Port 4001)
  - `user-service` (Port 4002)
  - `post-service` (Port 4003)
  - `feed-service` (Port 4004)
  - `notification-service` (Port 4005)
  - `api-gateway` (Port 3051)
- **Frontend App** (Next.js - Port 3050)
- **Nginx Reverse Proxy** (Port 80)

---

### 5. Seed the Databases & Prepare Demo Media

Once the Docker containers are healthy, run the master database seed script from the project root:

```bash
npm run seed
```

This script will automatically:
1. Push Prisma schemas to PostgreSQL for all 5 microservices (`auth`, `user`, `post`, `feed`, `notification`).
2. Seed 5 demo accounts with profile pictures, posts, likes, comments, and bookmarks.
3. Prepare the checked-in 20 demo media assets.

---

### 6. Access the Application

- **Web Application**: Open [http://localhost](http://localhost) in your browser.
- **Kafka UI**: Open [http://localhost:8080](http://localhost:8080) to monitor event streams.

---

## 🔑 Demo Login Accounts

All demo accounts share the password **`demo1234`**.

| Username | Email | Password |
| --- | --- | --- |
| `alex_morgan` | `alex.morgan@instagram.com` | `demo1234` |
| `sarah_chen` | `sarah.chen@instagram.com` | `demo1234` |
| `marcus_vance` | `marcus.vance@instagram.com` | `demo1234` |
| `elena_rostova` | `elena.rostova@instagram.com` | `demo1234` |
| `david_kim` | `david.kim@instagram.com` | `demo1234` |

---

## 🛠 Useful NPM Scripts

Run these commands from the root directory:

| Script | Description |
| --- | --- |
| `npm run seed` | Syncs database schemas & seeds all 5 microservices |
| `npm run docker:up` | Starts all Docker services (`docker compose up -d`) |
| `npm run docker:down` | Stops all Docker services (`docker compose down`) |
| `npm run docker:logs` | View tail logs from Docker container stack |
| `npm run build:all` | Compiles shared packages, backend microservices & frontend |

---

## 🏗 System Architecture

```text
               ┌───────────────────────┐
               │    Browser Client     │
               └───────────┬───────────┘
                           │ (Port 80)
               ┌───────────▼───────────┐
               │      Nginx Proxy      │
               └─────┬───────────┬─────┘
                     │           │
        ┌────────────▼──┐     ┌──▼────────────┐
        │ Next.js App   │     │  API Gateway  │
        │ (Port 3050)   │     │ (Port 3051)   │
        └───────────────┘     └──────┬────────┘
                                     │
    ┌─────────────┬─────────────┼────┴────────┬─────────────┐
    │             │             │             │             │
┌───▼───┐     ┌───▼───┐     ┌───▼───┐     ┌───▼───┐     ┌───▼───┐
│ Auth  │     │ User  │     │ Post  │     │ Feed  │     │ Notif │
│Service│     │Service│     │Service│     │Service│     │Service│
└───┬───┘     └───┬───┘     └───┬───┘     └───┬───┘     └───┬───┘
    │             │             │             │             │
    └─────────────┴──────┬──────┴─────────────┴─────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌─────▼──────┐ ┌───────▼────────┐
│   PostgreSQL   │ │   Redis    │ │ Apache Kafka   │
│  (Port 5433)   │ │ (Port 6380)│ │ (Port 29092)   │
└────────────────┘ └────────────┘ └────────────────┘
```

---

## 📂 Media & Storage Structure

Uploaded media is stored in `./uploads/` and served statically by Nginx:

```text
uploads/
  profiles/
    demo/                  # 5 pre-seeded demo profile pictures
    <userId>/              # User-uploaded profile pictures
  posts/
    demo/                  # 15 pre-seeded demo post images
    YYYY/MM/               # User-uploaded post images
  videos/
    YYYY/MM/               # User-uploaded videos (MP4/WebM/MOV)
  stories/
    <userId>/              # User-uploaded stories
```

---

## 🛑 Troubleshooting

### 1. `Environment variable not found: DATABASE_URL` during `npm run seed`
Ensure Docker containers are running (`docker compose up -d`). The seed script connects to PostgreSQL on `localhost:5433`.

### 2. Container name conflict
If you get a container conflict error (e.g. `ig-zookeeper is already in use`), run:
```bash
docker compose down
docker compose up -d --build
```

### 3. Node Heap Memory Error during `npm install`
Run `npm install` with increased memory:
```bash
npx --max-old-space-size=4096 npm install
```

