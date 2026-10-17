# EVE

Virtual AI employees: a Next.js frontend (`frontend/`) and an Express API (`backend/`), run together with
Docker Compose behind [Caddy](https://caddyserver.com), which serves everything over HTTPS on one origin:

| URL | Goes to |
|---|---|
| `https://SITE_ADDRESS/` | frontend |
| `https://SITE_ADDRESS/api/*` | backend (the `/api` prefix is stripped) |
| `http://…` | redirected to HTTPS |

## Run it

```bash
cp .env.example .env        # then fill in real secrets: TOKEN_SIGNATURE, COHERE_API_KEY, passwords

# Production build
docker compose up -d --build

# Development: frontend with hot reload; backend on :5000 and frontend on :3000 for debugging
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Open **https://localhost**. The app only works through Caddy: the frontend calls the API at `/api` on its own origin.

phpMyAdmin stays on http://localhost:8080 (local only).

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

**Port 80 or 443 already in use** (e.g. by Apache or IIS)? Set `HTTP_PORT` / `HTTPS_PORT` in `.env`,
e.g. `HTTP_PORT=8088`. With a non-default `HTTPS_PORT` the app is at `https://localhost:<HTTPS_PORT>`.

## HTTPS on a server (real domain)

1. Point the domain's DNS (A/AAAA record) at the server.
2. Open ports 80 and 443 in the firewall (Let's Encrypt validates over them).
3. In `.env`: `SITE_ADDRESS=eve.example.com` and `CORS_ORIGINS=https://eve.example.com`.
4. `docker compose up -d --build`

Caddy obtains and renews a Let's Encrypt certificate on its own. Once it works, uncomment the
`Strict-Transport-Security` line in `Caddyfile` and run `docker compose restart caddy`.

Only Caddy publishes ports in the production setup; the frontend and backend are reachable only through it.
