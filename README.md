# 📦 eve-backend

Back-end system for EVE: a smart AI employee assistant built with Node.js, Express, Sequelize, and AI integration (Cohere).  
This project handles authentication, employee knowledge storage, file parsing (PDF/DOCX), and communication with an AI model.

---

## 🚀 Features

- ✅ User signup & login (with JWT)
- ✅ Role-based access
- ✅ Employee creation & knowledge updates
- ✅ File uploads (.pdf, .docx)
- ✅ AI integration via Cohere
- ✅ PDF & DOCX parsing
- ✅ Full CORS support
- ✅ MySQL with Sequelize
- ✅ Ready for Windows Server or local deployment

---

## ⚙️ Requirements

- Node.js 20+
- npm
- MySQL
- Windows Server or local machine

---

## 📁 Installation

```bash
git clone <your-repo-url>
cd eve-backend
npm install

🚀 Run with PM2 (Production)


npm install -g pm2

// ecosystem.config.js
export default {
  apps: [
    {
      name: "eve-backend",
      script: "./index.js",
      watch: true,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

pm2 start ecosystem.config.js
pm2 save
pm2 startup

---

## ⚙️ Environment variables

Set these in `config/.env` for local runs (Docker Compose passes them from the root `.env`):

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | `mysql://user:password@host:3306/db` |
| `TOKEN_SIGNATURE` | ✅ | Secret used to sign JWTs |
| `BEARER_KEY` | ✅ | Prefix of the `authorization` header (the frontend sends `employee<token>`) |
| `SALT_ROUND` | | bcrypt rounds (default `8`) |
| `COHERE_API_KEY` | | Needed for chatting with EVEs |
| `COHERE_MODEL` | | Cohere chat model (default `command-a-03-2025`) |
| `CORS_ORIGINS` | | Comma-separated allowed origins |
| `PORT` | | Default `5000` |
| `API_PATH_PREFIX` | | Public path the API is served under, e.g. `/api` behind Caddy (sets the refresh cookie's path) |
| `SMTP_URL` | | SMTP server for password-reset emails (`smtp://user:pass@host:587`); unset prints emails to the log |
| `MAIL_FROM` | | Sender of emails (default `EVE <no-reply@eve.local>`) |
| `APP_URL` | | Public frontend URL used in email links (default `https://localhost`) |
| `ADMIN_EMAILS` | | Comma-separated emails of admins, who manage departments |
| `COOKIE_SAME_SITE` | | `lax`, `strict` or `none` for the refresh cookie (default `none` in production, `lax` otherwise) |

## 🛠️ Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run from TypeScript source with auto-reload (`tsx watch`) |
| `npm run build` | Compile `src/` to `dist/` |
| `npm start` | Run the compiled server (`dist/index.js`) |
| `npm run typecheck` | Type-check without emitting |

## 🗂️ Project structure

Every dependency is created once and wired together in `App` (`src/app.ts`).

```
src/
  index.ts                 # connects the Database, then starts the App
  app.ts                   # App: middleware, routers, dependency wiring
  config/env.ts            # Config: loads and validates environment variables
  core/                    # AppError, BaseController, BaseRouter, asyncHandler
  db/
    database.ts            # Database: connection, sync, missing-column migration
    models/                # User, Employee, Conversation, Message, KnowledgeDocument, KnowledgeChunk
  middleware/              # AuthMiddleware, Validator, UploadMiddleware, ErrorMiddleware
  services/                # TokenService, PasswordHasher, DocumentTextExtractor, text chunker
  modules/
    auth/                  # AuthService + AuthController + AuthRouter  (/auth)
    eve-employee/          # EmployeeService + controller + router      (/eve-employee)
    chat/                  # ChatService (grounded replies), CohereService (v2 Chat + Embed)
    knowledge/             # KnowledgeService + controller + router     (/knowledge)
    conversation/          # ConversationService + controller + router  (/conversations)
  types/                   # AuthUser and the req.user typing
```

## 🔐 Auth

`POST /auth/login` returns a 15-minute `accessToken` (send it as `authorization: <BEARER_KEY><token>`)
and sets a 7-day `refreshToken` httpOnly cookie scoped to `/auth`. `POST /auth/refresh` trades the
cookie for a new access token (and rotates it); `POST /auth/logout` revokes every refresh token of
the user and clears the cookie.

## 🏢 Departments

Departments live in the `Departments` table (seeded with the original 31 on first start). Employees
reference one by `departmentId`; employee responses include both `departmentId` and `department` (its name).
Admins are the users listed in `ADMIN_EMAILS`; `user.role` is `"admin"` or `"user"` in login/refresh responses.

| Method | Path | Who | Body | Returns |
|---|---|---|---|---|
| `GET` | `/departments` | anyone signed in | | `{ departments: [{ id, name, employeeCount }] }`, A–Z |
| `POST` | `/departments` | admin | `{ name }` | `{ department }`; `409` if the name exists |
| `PATCH` | `/departments/:id` | admin | `{ name }` | `{ department }` |
| `DELETE` | `/departments/:id` | admin | | `204`; `409` while EVEs are still in it |

## 📚 Knowledge

Each file an EVE is taught becomes a `KnowledgeDocument`. Its full text is split into ~1,200-character
overlapping passages, embedded with Cohere `embed-v4.0` (512 dimensions) and stored in `KnowledgeChunks`.
For every question, the 8 most similar passages are passed to Cohere chat as `documents`; the passages the
reply cites are stored on the message as `sources`. Limits: 100 files and 1,000,000 characters per EVE.

Only the EVE's owner can list, add or delete its files.

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/knowledge?employeeId=` | | `{ documents }`, newest first |
| `POST` | `/knowledge` | multipart `employeeId`, `file` (PDF/DOCX, ≤ 10 MB) | `{ document }` |
| `DELETE` | `/knowledge/:id` | | `204` |

EVEs created before this kept their uploads in `EveEmployees.knowledgeText`. Those are moved into documents
("Earlier upload (date)") the first time the EVE is used, and the field is cleared. Until that succeeds
(e.g. Cohere is unreachable), replies fall back to the old text.

## 💬 Conversations

Each conversation belongs to one user and one EVE employee. Anyone can chat with any EVE, but only
its owner can attach files, which are added to the EVE's knowledge.

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/conversations?employeeId=` | | `{ conversations }`, latest first |
| `POST` | `/conversations` | `{ employeeId }` | `{ conversation }` |
| `GET` | `/conversations/:id` | | `{ conversation, messages }` |
| `PATCH` | `/conversations/:id` | `{ title }` | `{ conversation }` |
| `DELETE` | `/conversations/:id` | | `204` |
| `POST` | `/conversations/:id/messages` | multipart `message`, optional `file` (PDF/DOCX, owner only, added to the knowledge) | `{ conversation, messages }` (the sent message and the reply, with `sources`) |
| `POST` | `/conversations/:id/messages/stream` | same as above | Server-Sent Events: `delta` `{ text }` per piece of the reply, then `done` (same body as above) or `error` `{ message }`. Input and permission errors are plain JSON statuses before the stream starts. |
