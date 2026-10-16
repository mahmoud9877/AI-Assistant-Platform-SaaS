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

## 🗂️ Project structure

```
index.js                 # starts the DB, then the HTTP server
src/
  app.js                 # express app: middleware + routes
  config/env.js          # loads and validates environment variables
  db/                    # Sequelize connection, models, startup sync
  middleware/            # auth, validation, uploads, error handling
  modules/
    auth/                # POST /auth/signup, /auth/login
    eve-employee/        # /eve-employee CRUD, paging, count
    chat/                # POST /chat (file knowledge + Cohere)
  utils/                 # errors, tokens, passwords, PDF parsing
```
