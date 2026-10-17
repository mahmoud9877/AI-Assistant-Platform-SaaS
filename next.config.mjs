const isDev = process.env.NODE_ENV !== "production";
const apiBase = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:5000";
// A relative base (e.g. "/api" behind the Caddy proxy) is the page's own origin: 'self' covers it.
const apiOrigin = apiBase.startsWith("/") ? "" : ` ${new URL(apiBase).origin}`;

// The 3D office's text (troika-three-text) fetches glyph fonts from jsDelivr and
// renders them in blob: web workers. Those workers inherit this policy and
// importScripts() their modules from blob: URLs, which script-src governs.
const FONT_CDN = "https://cdn.jsdelivr.net";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js inlines its bootstrap scripts; dev mode also needs eval for hot reload.
  `script-src 'self' 'unsafe-inline' blob:${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${apiOrigin}`,
  "font-src 'self' data:",
  // Dev hot reload uses a websocket: ws: directly, wss: through the HTTPS proxy.
  `connect-src 'self'${apiOrigin} ${FONT_CDN}${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
