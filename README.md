# EVE — AI Assistant Platform

**EVE** is a full-stack SaaS platform for creating **virtual AI employees**. Each "Eve" belongs to a department,
learns from the documents you upload (PDF / DOCX), and chats with your team through a streaming AI chat powered by
[Cohere](https://cohere.com). A 3D virtual office lets you see and talk to your Eves.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Caddy](https://img.shields.io/badge/Caddy-HTTPS-1F88C0?logo=caddy&logoColor=white)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Local URLs](#local-urls)
- [API overview](#api-overview)
- [HTTPS on your machine (localhost)](#https-on-your-machine-localhost)
- [Deploying to a server](#deploying-to-a-server)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Authentication** — signup, login, JWT access + refresh tokens in cookies, logout, change password,
  profile updates, and password reset by email.
- **Virtual AI employees** — create, edit and delete Eves, each with its own settings and department.
- **Knowledge base** — upload PDF and DOCX files; their text is extracted, chunked and used as context for the AI.
- **AI chat** — conversations with an Eve, with streamed replies (Server-Sent Events), conversation history,
  rename and delete.
- **Departments** — organize Eves by department; admins (set via `ADMIN_EMAILS`) manage the list.
- **3D virtual office** — explore an office built with React Three Fiber and meet your Eves.
- **Internationalization** — UI translations with i18next.
- **Production-ready setup** — Docker Compose, automatic HTTPS with Caddy, one origin for app and API.

## Tech stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI, TanStack Query, Zustand, React Hook Form + Zod, Framer Motion, Three.js / React Three Fiber, i18next |
| **Backend** | Node.js 20, Express 4, TypeScript, Sequelize, MySQL 8, JWT, bcrypt, Joi, Multer, pdf.js, Mammoth, Nodemailer, Cohere SDK |
| **Infrastructure** | Docker Compose, Caddy (HTTPS reverse proxy), phpMyAdmin, Mailpit (dev email inbox) |

## Architecture

```mermaid
flowchart LR
    Browser -->|HTTPS| Caddy
    Caddy -->|/| Frontend["Frontend<br/>Next.js :3000"]
    Caddy -->|/api/*| Backend["Backend<br/>Express :5000"]
    Backend --> DB[(MySQL)]
    Backend --> Cohere[Cohere AI]
    Backend --> SMTP[SMTP / Mailpit]
```

Caddy is the single public entry point and serves everything over HTTPS on **one origin**:

| URL | Goes to |
|---|---|
| `https://SITE_ADDRESS/` | frontend |
| `https://SITE_ADDRESS/api/*` | backend (the `/api` prefix is stripped) |
| `http://…` | redirected to HTTPS |

## Project structure

```
.
├── backend/                  # Express API (TypeScript)
│   └── src/
│       ├── modules/          # auth, chat, conversation, department, eve-employee, knowledge
│       ├── services/         # mailer, token, password hashing, document text extraction, chunking
│       ├── middleware/       # auth, validation, uploads, errors
│       ├── db/               # Sequelize connection and seed data
│       └── config/           # environment configuration
├── frontend/                 # Next.js app (TypeScript)
│   ├── app/                  # routes (public pages + (protected) pages)
│   ├── features/             # feature modules: auth, chat, employees, knowledge, virtual-office, …
│   ├── components/           # shared UI components
│   ├── hooks/  lib/          # shared hooks and utilities
│   └── public/               # static assets
├── docker-compose.yml        # production stack
├── docker-compose.dev.yml    # development override (hot reload, Mailpit)
├── Caddyfile                 # HTTPS reverse proxy config
└── .env.example              # environment variables template
```

## Quick start

**Requirements:** [Docker](https://docs.docker.com/get-docker/) with Docker Compose, and a
[Cohere API key](https://dashboard.cohere.com/api-keys).

```bash
git clone https://github.com/mahmoud9877/AI-Assistant-Platform-SaaS.git
cd AI-Assistant-Platform-SaaS

cp .env.example .env        # then fill in real secrets: TOKEN_SIGNATURE, COHERE_API_KEY, passwords
```

**Production build:**

```bash
docker compose up -d --build
```

**Development** (frontend and backend reload on save, emails caught by Mailpit):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Open **https://localhost**. The app only works through Caddy, because the frontend calls the API at `/api`
on its own origin. The first time, trust Caddy's local certificate — see
[HTTPS on your machine](#https-on-your-machine-localhost).

Stop everything with `docker compose down` (add `-v` to also delete the database and uploads).

## Configuration

All settings live in `.env` at the project root (copy it from `.env.example`).

| Variable | Description |
|---|---|
| `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | MySQL credentials |
| `TOKEN_SIGNATURE` | Secret used to sign JWTs — use a long random string |
| `BEARER_KEY` | Prefix of the `Authorization` header, shared by frontend and backend |
| `SALT_ROUND` | bcrypt cost factor for password hashing |
| `COHERE_API_KEY` | Your Cohere API key |
| `COHERE_MODEL` | Cohere model (default `command-a-03-2025`) |
| `SMTP_URL` | Outgoing email, e.g. `smtp://user:password@smtp.example.com:587`. Empty: emails are printed to the backend log |
| `MAIL_FROM` | Sender address of emails |
| `APP_URL` | Public address of the app, used in email links |
| `ADMIN_EMAILS` | Comma-separated emails of admins (they manage departments) |
| `SITE_ADDRESS` | `localhost` or your domain |
| `HTTP_PORT`, `HTTPS_PORT` | Change if 80/443 are already taken |
| `CORS_ORIGINS` | Extra origins allowed to call the API directly (not needed behind Caddy) |

> Never commit `.env` — it is ignored by git.

## Local URLs

| Service | URL | Available in |
|---|---|---|
| App | https://localhost | production & dev |
| phpMyAdmin | http://localhost:8080 | production & dev |
| MySQL | `localhost:3307` | production & dev |
| Mailpit (email inbox) | http://localhost:8025 | dev |
| Frontend (direct, debugging) | http://localhost:3000 | dev |
| Backend (direct, debugging) | http://localhost:5000 | dev |

## API overview

All routes are served under `/api` through Caddy. Most require authentication.

| Resource | Endpoints |
|---|---|
| **Auth** `/auth` | `POST /signup`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `/change-password` · `PATCH /me` |
| **Employees** `/eve-employee` | `GET /`, `/all`, `/my-employee`, `/:id`, `/:id/settings` · `POST /` · `PUT /:id` · `DELETE /:id` |
| **Knowledge** `/knowledge` | `GET /` · `POST /` (file upload) · `DELETE /:id` |
| **Conversations** `/conversations` | `GET /`, `/:id` · `POST /` · `PATCH /:id` · `DELETE /:id` · `POST /:id/messages`, `/:id/messages/stream` |
| **Departments** `/departments` | `GET /` · `POST /`, `PATCH /:id`, `DELETE /:id` (admin only) |

## HTTPS on your machine (localhost)

Caddy issues the `localhost` certificate from its own local CA, so the browser warns until you trust that CA once.
Export it:

```bash
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

- **Windows (also when Docker runs in WSL):** in an **admin** PowerShell, `certutil -addstore -f ROOT caddy-root.crt`
  (or double-click the file → Install Certificate → Local Machine → *Trusted Root Certification Authorities*).
  Restart the browser.
- **macOS:** `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain caddy-root.crt`
- **Linux (Chrome/Firefox):** `certutil -d sql:$HOME/.pki/nssdb -A -t C,, -n "Caddy Local" -i caddy-root.crt`
- **Firefox on Windows/macOS** uses its own store: Settings → Certificates → View Certificates → Authorities → Import.

The CA lives in the `caddy_data` volume, so this is a one-time step unless that volume is deleted.

## Deploying to a server

1. Point the domain's DNS (A/AAAA record) at the server.
2. Open ports 80 and 443 in the firewall (Let's Encrypt validates over them).
3. In `.env`: `SITE_ADDRESS=eve.example.com`, `APP_URL=https://eve.example.com` and `CORS_ORIGINS=https://eve.example.com`.
4. Run `docker compose up -d --build`.

Caddy obtains and renews a Let's Encrypt certificate on its own. Once it works, uncomment the
`Strict-Transport-Security` line in `Caddyfile` and run `docker compose restart caddy`.

In production only Caddy publishes the web ports; the frontend and backend are reachable only through it.

## Troubleshooting

| Problem | Fix |
|---|---|
| Port 80 or 443 already in use (Apache, IIS, …) | Set `HTTP_PORT` / `HTTPS_PORT` in `.env`, e.g. `HTTPS_PORT=8443`, then open `https://localhost:8443` |
| Browser says the certificate is not trusted | Trust Caddy's local CA — see [above](#https-on-your-machine-localhost) |
| Code changes not picked up in dev (project under `/mnt/c` on WSL) | Set `WATCHPACK_POLLING=true` in `.env` |
| Password reset emails don't arrive | In dev, check Mailpit at http://localhost:8025; in production, set `SMTP_URL` |
| App loads but API calls fail at `localhost:3000` | Use https://localhost — the app only works through Caddy |
| See what's happening | `docker compose logs -f backend` (or `frontend`, `caddy`, `db`) |

---

## Author

**Mahmoud Ali** — [@mahmoud9877](https://github.com/mahmoud9877)
