# AI Avengers MDAT

## Deployment Checklist

- **Backend environment variables** (server runtime; do not commit):
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN` (optional)
  - `JWT_REFRESH_EXPIRES_IN` (optional)
  - `CORS_ALLOWED_ORIGINS` (comma-separated list; e.g., `https://ai-avengers-mdat.netlify.app,http://localhost:5173`)
  - `GROK_API_KEY` (optional)
  - `MAX_RESUME_SIZE_BYTES` (optional)

- **Frontend environment variables** (Netlify build):
  - `VITE_API_BASE_URL` (public URL to backend; do not use localhost in production)
  - See `client/.env.example`.

- **Netlify config**: `netlify.toml`
  - `[build] base = "client"`
  - `[build] publish = "dist"`
  - `[build] command = "npm ci --legacy-peer-deps && npm run build"`
  - SPA redirects to `/index.html`.

- **CORS** (`src/index.js` + `src/config/env.js`):
  - Server reads `CORS_ALLOWED_ORIGINS` and allows requests from matching origins.
  - Example: `CORS_ALLOWED_ORIGINS=https://ai-avengers-mdat.netlify.app,http://localhost:5173`

## Local Development

- **Backend**
  - `npm install --legacy-peer-deps`
  - `npm run dev`
  - Ensure `.env` provides `MONGODB_URI`, `JWT_SECRET`, etc.

- **Frontend**
  - `cd client && npm install && npm run dev`
  - Optional: `VITE_API_BASE_URL=http://localhost:4000`

## Notes

- Secrets must never be committed. Husky pre-push hook blocks `.env` files.
- The frontend should only use `VITE_*` variables; these are baked at build time and are public.
