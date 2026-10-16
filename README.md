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
| `COHERE_API_KEY` | | Needed for `/chat` |
| `CORS_ORIGINS` | | Comma-separated allowed origins |
| `PORT` | | Default `5000` |

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
    models/                # User, Employee (Sequelize model classes)
  middleware/              # AuthMiddleware, Validator, UploadMiddleware, ErrorMiddleware
  services/                # TokenService, PasswordHasher, DocumentTextExtractor
  modules/
    auth/                  # AuthService + AuthController + AuthRouter  (/auth)
    eve-employee/          # EmployeeService + controller + router      (/eve-employee)
    chat/                  # ChatService, CohereService + controller    (/chat)
  types/                   # AuthUser and the req.user typing
```
