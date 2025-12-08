# UPlan

Planning workspace built on Next.js + Supabase with protected dashboard views for programs and courses, user account management, and a themed landing page.

## Features
- Supabase auth: sign-up, login, password reset/update, and account deletion (server-side via service role).
- Program and course management UI with tables/forms and authenticated layout.
- Responsive design with light/dark theme toggle and animated landing background.
- Server + client Supabase helpers for SSR and client-side data access.

## Stack
- Next.js (App Router), TypeScript, React 19
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Tailwind/shadcn-ui components, Radix Primitives

## Prerequisites
- Node.js 20+ and npm
- Supabase project (URL + keys)

## Environment
Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SERVICE_ROLE_KEY=your-supabase-service-role-key  # used only on the server
```

## Local Development
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Production
```bash
npm run lint   # optional
npm run build
npm start      # uses PORT or 3000
```

## Notable Paths
- `app/app/*`: authenticated dashboard (programs, courses, settings).
- `auth*`: user management routes (e.g., `auth/delete` for account removal).
- `lib/supabase/*`: browser/server Supabase clients.

## Deployment Notes
- Do not expose `SERVICE_ROLE_KEY` on the client; it must be set as a server-side env var only.
- Ensure all Supabase env vars are configured in your hosting platform.
