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
With Nix, enter the development shell for Node.js 22, npm, and Git:

```bash
nix develop
```

Then install the locked dependencies and start the app (also works with your own Node.js installation):

```bash
npm ci
npm run dev
# open http://localhost:3000
```

## Production
```bash
npm run lint   # optional
npm run build
npm start      # uses PORT or 3000
```

## Semester overview and examinations

Open **Semester** in the sidebar and choose a study program. The selection is saved to your account; the page uses that program's current semester (or trimester). It summarizes courses, completed courses, planned/earned ECTS, and examinations.

Add or edit examinations from a semester course or its detail page. Each examination has a name, optional date and grade, and a positive relative weight. A course's grade is calculated in the database as `sum(grade * weight) / sum(weight)` for graded examinations. Missing results are excluded and the result is marked provisional. Course completion remains an explicit course setting.

Examinations are the only source of course grades. Courses without graded examinations have no grade. Existing standalone grades are migrated into a single undated examination named after the course, with weight 100 (100% of the course result).

Database migrations live in `supabase/migrations` (including the fetched remote baseline). For a linked project:

```bash
supabase db push --linked
npm test
supabase db query --linked -f supabase/tests/semester_examinations.sql
```

The SQL checks use temporary account fixtures inside a transaction and roll back all test data. Supabase link metadata in `supabase/.temp` is ignored.

## Notable Paths
- `app/app/*`: authenticated dashboard (programs, courses, settings).
- `auth*`: user management routes (e.g., `auth/delete` for account removal).
- `lib/supabase/*`: browser/server Supabase clients.

## Deployment Notes
- Do not expose `SERVICE_ROLE_KEY` on the client; it must be set as a server-side env var only.
- Ensure all Supabase env vars are configured in your hosting platform.

## Supabase data and sessions

The authenticated layout verifies the user and loads workspace data with that request's cookie-based client. It passes the initial results into an account-scoped TanStack Query cache; failed datasets retry in the browser. Queries use owner filters, abort signals, and paginated reads so larger accounts are not silently truncated by the API response limit.

Auth changes cancel pending requests and clear the previous account's cache. Realtime INSERT/UPDATE events update cached rows, while DELETE events remove matching cached primary keys (without depending on a deleted row's `user_id`). Reconnecting or returning to the window refreshes the workspace to recover missed events. Mutation refreshes use the same query cache.

Set `SITE_URL` (or `NEXT_PUBLIC_SITE_URL`) to the canonical public origin, such as `https://plan.example.com`. Auth callbacks ignore forwarded host headers and allow only local redirect paths. The proxy preserves refreshed cookies and cache headers, including on redirects. Privileged clients live in `lib/supabase/admin.ts`, which is guarded by `server-only`; browser code uses the publishable key and RLS.

## Optional university templates

On **Add a program** or **Edit program**, enable **Use a university template**, select **Technical University of Munich (TUM)**, then search the live TUMonline program catalogue. Choosing a curriculum fills the name, degree, institution, ECTS goal, and duration where available. All fields remain editable. The university and curriculum version ID (`pStpStpNr`, e.g. `5217` for Informatics M.Sc. 20231) are saved on your program. Switching the option off unlinks the template without changing entered details or deleting courses.

When adding a course to a linked program, expand **Choose from the university catalogue** to search its modules. Selecting a module fills its name, code, and known ECTS; no courses are created automatically. Credit-bearing modules are used rather than lecture occurrences, because a module may group several lectures or have repeated offerings. The list describes the curriculum, not a guarantee that a lecture is offered this semester. Unknown or conflicting ECTS remain empty for manual entry. Fractional course ECTS are supported.

The server fetches the public program portfolio and expanded curriculum pages from `campus.tum.de`. TUM credentials are not needed. Only public catalogue results are cached for 24 hours; no user information is sent to TUM. Module pages load progressively in batches of at most three, with loading progress and retry/manual-entry options. TUMonline availability and HTML changes can affect importing; manual programs and courses work independently.

`public.universities` is an authenticated read-only list seeded with TUM. Adding another university requires its own server adapter. The optional links and fractional ECTS are introduced by `20261015223000_university_templates.sql`. Run parser checks with `npm test` and transactional database checks with `supabase db query --linked -f supabase/tests/university_templates.sql`.

The TUMonline curriculum approach was researched with [Vuenc/TUM-Master-Informatics-Offered-Lectures](https://github.com/Vuenc/TUM-Master-Informatics-Offered-Lectures). This integration reads TUMonline directly and does not use that repository's scraped catalogue as a fallback.
