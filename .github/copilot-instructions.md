## Repo snapshot for AI coding agents

This file gives succinct, actionable guidance for AI coding agents working on the SkillUp mobile app.

Key facts (big picture)
- Expo + Expo Router (file-based routing). Top-level routes live in `app/` and route groups use parentheses: e.g. `(auth)`, `(teacher)`, `(booking)`.
- React Native app (Expo SDK 54) with TypeScript. Main client wiring is in `app/_layout.tsx` and `app/index.tsx`.
- Backend: Supabase (Postgres) with Row Level Security. SQL migrations are in `migrations/` (and `supabase/` in some places).
- Payments: Stripe Connect + Supabase Edge Functions for server-side operations.
- Data fetching: TanStack Query (React Query) + Zustand for client state.

Where to look for specific patterns
- Routing & app lifecycle: `app/_layout.tsx` (QueryClient defaults, AuthProvider, i18n init, RTL/Credits providers).
- Authentication: `src/features/auth/auth-context` (hook: `useAuth`) and `test-supabase-connection.ts` for example Supabase auth calls.
- Supabase helpers: `src/lib/supabase` (lib-level client), and SQL migrations in `migrations/` (run `000_enable_extensions.sql` first).
- API & queries: `src/api/` contains app-specific Supabase queries and RPC usage; search there for `.from(` or `.rpc(` calls.
- UI & styling: `components/`, `src/ui/`, and `global.css` + `nativewind` (Tailwind for RN). Gluestack UI provider is in `components/ui/gluestack-ui-provider`.

Project-specific conventions
- Route groups use parentheses to represent modal/flow groups. Use the file-based router conventions rather than manual route mapping.
- TypeScript path aliases are defined in `tsconfig.json` (e.g. `@/*`, `@lib/*`, `@features/*`) — prefer these imports.
- React Query defaults are centralized in `app/_layout.tsx`. Prefer reusing QueryClient settings and sensible staleTime/retry semantics.
- DB migrations are numbered and run manually (or pasted into Supabase SQL editor). Migrations assume RLS is enabled — don't bypass RLS in new SQL.
- Seed/test accounts and queries are referenced in `test-supabase-connection.ts`; useful for local integration checks.

Developer workflows & important commands
- Install: `npm install`
- Dev server: `npm start` (Expo)
- Run on Android/iOS: `npm run android` / `npm run ios` (uses `expo run:*`)
- Type check: `npm run type-check` (tsc --noEmit)
- Lint: `npm run lint`
- Prebuild/bundle for native: `npm run prebuild` then use EAS for production builds (`eas build`).
- Migrations: run SQL files in `migrations/`; `000_enable_extensions.sql` must be applied first. For migration runner you may need `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

Integration & security notes
- Environment variables: public Expo keys (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) are used in the app. Do NOT commit `.env` or service role keys.
- Supabase service-role key is required for DB migration scripts and privileged RPCs — keep it out of git.
- Stripe: Connect flow and webhooks are used; check `/src/lib` and Edge Functions configuration for server-side webhook handlers.

Examples to cite when making changes
- To add a new client query, follow patterns in `src/api/*` and reuse the QueryClient defaults in `app/_layout.tsx`.
- To add a new route group, create a folder in `app/` with the appropriate `(group)` naming and add screens following existing patterns like `(booking)/`.
- To test Supabase connectivity or query shapes locally, run `node test-supabase-connection.ts` after setting `.env` (it demonstrates selects, view usage and a seed login).

When editing SQL/migrations
- Keep migration files sequential and include rollback notes in comments if possible.
- Run `000_enable_extensions.sql` first — it enables `uuid-ossp` and `pg_trgm` which other migrations rely on.

If something is missing
- Check these canonical locations first: `README.md`, `app/_layout.tsx`, `tsconfig.json`, `migrations/`, `src/lib/supabase`, and `test-supabase-connection.ts`.

Questions for repository owner
- Are there any additional private scripts or CI jobs that run migrations automatically? If so, add their locations here.
- Confirm preferred PR checklist items (e.g., require migration review, seeds updated, RLS changes audited).

— end of file
