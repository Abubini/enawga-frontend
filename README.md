# Enawga — Frontend

A React + Vite frontend for the Enawga multilingual RAG support platform, built to run
against the FastAPI backend in `rag_platform_backend.zip` — no mock data, every screen
calls a real backend endpoint.

## Stack

- **React 19** + **Vite** (JavaScript, no TypeScript)
- **react-router-dom** for routing
- **axios** for HTTP, with an automatic access-token refresh interceptor
- **lucide-react** for icons
- Hand-written CSS design system (no Tailwind) built directly on the light/dark color
  tokens you supplied — see `src/styles/tokens.css`

## Getting started

```bash
npm install
cp .env.example .env   # then edit VITE_API_URL if your backend isn't on localhost:8000
npm run dev            # http://localhost:5173
```

```bash
npm run build           # production build to dist/
npm run preview         # preview the production build
```

## Connecting to the backend

1. Start the Enawga backend (`rag_platform_backend.zip`) per its own README — FastAPI,
   Postgres, Redis, Qdrant, workers, etc.
2. In the backend's `.env`, set:
   ```
   FRONTEND_URL=http://localhost:5173
   ```
   This value is used to build the Google OAuth redirect, password-reset emails, the
   Telebirr payment return URL, and hosted-bot public URLs — it must match wherever this
   frontend is actually running (origin `http://localhost:5173` is already present in
   the backend's CORS allowlist by default for local dev).
3. In this frontend's `.env`, set `VITE_API_URL` to the backend's origin (default
   `http://localhost:8000`).
4. `npm run dev` and open `http://localhost:5173`.

All data — auth, projects, documents, chat, billing, notifications — is fetched live
from that backend. There is no mock/fixture layer.

## How auth works here

- `POST /auth/login` and `/auth/verify-email` return a short-lived JWT **access token**
  in the response body (kept in memory + `localStorage` for reload persistence) and set
  an **httpOnly refresh cookie** scoped to `/auth/refresh`.
- An axios response interceptor (`src/lib/http.js`) catches `401`s, calls
  `POST /auth/refresh` (cookie-authenticated), and retries the original request once.
- Google OAuth: the backend's authorization URL registers `{FRONTEND_URL}/auth/google/callback`
  as the redirect target (see `app/core/auth/oauth.py`). This frontend has a bridge page
  at that exact route (`src/pages/auth/GoogleCallbackBridge.jsx`) whose only job is to
  forward `?code&state` on to the backend's own `GET /auth/google/callback`, which then
  redirects to `{FRONTEND_URL}/auth/callback#token=...` — handled by
  `src/pages/auth/OAuthCallback.jsx`.

## Notes on backend gaps encountered while wiring this up

The frontend was built strictly against the actual FastAPI routes in the provided zip
(not the PDF spec, which describes a couple of endpoints that aren't implemented in
code). Two adaptations worth knowing about:

- **Hosted bot public pages** (`/bot/:botId`): `POST /hosted/create` returns a
  `public_url` built from a `slug`, but the only public, unauthenticated endpoints are
  keyed by `bot_id` (`/hosted/{bot_id}/chat`, `/hosted/{bot_id}/verify-password`) — there
  is no `slug → bot_id` lookup route, and `GET /hosted/{bot_id}/config` requires the
  owner's JWT. This frontend's public chat page therefore treats the route param as the
  bot's project ID directly and skips fetching branding/config for anonymous visitors.
  If you want the public page to resolve real slugs and show the bot's name/theme, add a
  small public `GET /hosted/by-slug/{slug}` (or similar) endpoint to the backend.
- **Telebirr return page** (`/billing/success`): the documentation mentions
  `GET /billing/orders/{outTradeNo}/status`, but the shipped backend only exposes
  `GET /billing/subscription` (latest active/pending subscription) and
  `GET /billing/history` — neither is keyed by `outTradeNo`. `BillingSuccess.jsx` polls
  `GET /billing/subscription` after a Telebirr redirect and treats `status: "active"` as
  confirmation. Add a per-order status route on the backend for a more precise result.

## Project structure

```
src/
  components/
    layout/       Navbar, Footer, DashboardLayout, ProtectedRoute
    chat/          ChatWindow, InstantChatPanel
    ui/            Modal, Logo, Primitives, FileDropzone, CopyField, ThemeToggle…
  context/         AuthContext, ThemeContext, ToastContext
  hooks/           useChatStream (SSE-style streaming chat)
  lib/             api.js (endpoint bindings), http.js (axios + refresh), plans.js, format.js
  pages/
    public/        Landing, Pricing, NotFound
    auth/          Login, Register, VerifyEmail, ForgotPassword, ResetPassword, OAuth bridges
    chat/          Public Instant Chat page, public hosted-bot chat page
    dashboard/     Overview, Instant, Hosted (list/detail), API (list/detail),
                   GitHub (list/detail), Billing (+ success), Notifications, Settings
  styles/          tokens.css (light/dark CSS variables), base.css, components.css
```

## Design system

Colors are wired as CSS custom properties in `src/styles/tokens.css`, switched via
`[data-theme="light"|"dark"]` on `<html>` (persisted to `localStorage`, defaults to the
OS preference). Every color from the supplied palette (`--color-primary`,
`--color-navy`, `--color-success`, `--color-teal`, `--color-gold`, etc.) is defined for
both themes and used throughout — buttons, badges, alerts, tables, charts, and the chat
UI all read from these variables, so no hard-coded hex values live in components.
