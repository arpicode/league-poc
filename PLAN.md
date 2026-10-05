# PLAN — league-poc: React SPA for Meeple League API

## Context
`arpicode/league-poc` is an empty repo (no branches on the remote). The goal is a simple, best-practice React SPA
that consumes the current API on `arpicode/league-api@feat/game-match-slice` (Spring Boot, `:8080`).
This file is copied to `PLAN.md` at the repo root as the first commit, so it can be referred to throughout the work.

### API surface (what actually exists on that branch)
- `/api/v1/players` — CRUD. Request `{username (3–50), email}`; response `{id, username, email, createdAt, updatedAt}`.
- `/api/v1/boardgames` — CRUD. Request `{name (2–120), minPlayers ≥1, maxPlayers ≥ min, avgDurationMin? ≥1}`.
- `/api/v1/tournaments` — CRUD. Create `{boardGameId, name (2–150), maxPlayers? ≥2, startsOn?, endsOn?}`;
  update adds `status`. Response embeds `boardGame {id, name}`. State machine:
  `DRAFT→OPEN|CANCELLED`, `OPEN→IN_PROGRESS|CANCELLED`, `IN_PROGRESS→CLOSED`. Only DRAFT can change board game / be deleted;
  CLOSED/CANCELLED are read-only.
- `/api/v1/tournaments/{id}/registrations` — POST `{playerId}`, GET list, GET/DELETE `/{playerId}`.
  Response `{tournamentId, player {id, username}, registeredAt, status CONFIRMED|WAITLISTED, waitlistPosition}`. Only while OPEN.
- Lists are Spring `PagedModel`: `{content: [], page: {size, number, totalElements, totalPages}}`, query `?page=&size=&sort=`.
- Errors are RFC 9457 ProblemDetail + `code`, `errorId`, and `errors: [{field, message}]` on `VALIDATION_ERROR`.
- **Game matches**: entity + `GameMatchStatus` only, *no controller yet* → not consumable; the frontend leaves a typed
  placeholder (types/status enum) but no screens. Revisit when the endpoint lands.
- **No CORS config** in the API → the SPA calls relative `/api/...`; Vite dev server proxies `/api` → `http://localhost:8080`,
  and the production Docker image (nginx) proxies the same path.

## Stack & dev dependencies
- pnpm, Node 22 (`packageManager` field + `.nvmrc`), Vite (latest), React (latest) + **TypeScript** (strict).
- React Router (latest, "data" mode with `createBrowserRouter`) **also handles server state**: route `loader`s fetch
  (page/size/sort read from the URL search params), route `action`s + `<Form>`/`useFetcher` do mutations, and the router
  revalidates loaders automatically after an action. `errorElement` per route renders `ApiError`s (404 → "not found").
  No extra data-fetching library, no fetch-in-useEffect.
- Bootstrap (latest) **from SCSS sources**: `sass-embedded`; `src/styles/main.scss` imports only functions/variables/maps/mixins/root/reboot
  + used partials (type, containers, grid, utilities API, buttons, forms, tables, nav, navbar, card, alert, badge, pagination, spinners,
  modal if used). No Bootstrap JS bundle; any interactive bits (navbar toggle, confirm dialog) are React state, not Bootstrap JS.
  Silence Sass deprecation noise from Bootstrap via `silenceDeprecations` in vite config.
- Testing: Vitest (latest), jsdom, @testing-library/react + user-event + jest-dom, **MSW** to mock the API in tests.
- Quality: ESLint (flat config, typescript-eslint, react-hooks, react-refresh), Prettier.

## Structure
```
src/
  main.tsx, router.tsx (createBrowserRouter + RouterProvider)
  styles/main.scss              # Bootstrap partial imports + small overrides
  api/
    client.ts                   # fetch wrapper: JSON, throws ApiError(ProblemDetail) on !ok, handles 204
    types.ts                    # DTOs, Page<T>, ProblemDetail, enums (incl. GameMatchStatus placeholder)
    players.ts, boardGames.ts, tournaments.ts, registrations.ts   # plain endpoint fns
  features/*/route.ts(x)        # loader/action per screen, calling the api fns; actions return
                                # validation ProblemDetails as data (useActionData) instead of throwing
  components/                   # Layout/NavBar, Pager, ErrorAlert (shows detail + field errors + errorId),
                                # ConfirmButton, StatusBadge, Loading, FormField
  features/
    players/      PlayersPage (list+pagination), PlayerFormPage (create/edit), delete
    boardgames/   same pattern
    tournaments/  TournamentsPage, TournamentFormPage, TournamentDetailPage
                  (status transition buttons from a client-side mirror of canTransitionTo,
                   roster with CONFIRMED/WAITLISTED + position, register player select, withdraw)
  test/setup.ts, test/server.ts (MSW handlers)
```
Server-side validation is the source of truth: forms do light client-side checks (required/min/max attrs) and map
`errors[].field` back onto inputs (`is-invalid` + `invalid-feedback`).

## Progress
- [x] 1 Git bootstrap (local; push blocked: Claude GitHub App has no access to the repo yet)
- [x] 2 Scaffold · [x] 3 Bootstrap SCSS · [x] 4 API layer · [x] 5–7 Features + tests (31 tests)
- [x] 8 Docker (image built, nginx SPA fallback and `/api` proxy checked against the real API)
- [x] 9 CI workflow · [x] 10 README
- [x] E2E scenario run with Playwright against the real API (players, board game, tournament, waitlist, promotion, 400/409/404)

Notes: TypeScript pinned to 6.0.x (typescript-eslint does not support TS 7 yet). MSW 3 renamed
`onUnhandledRequest` to `onUnhandledFrame`.

## Steps
1. **Git bootstrap**: initial commit (README stub, `.gitignore`, `PLAN.md`). Push `develop` first (GitHub makes the first pushed
   branch the default), then push `master` from the same commit. Create `claude/sweet-goodall-twda8e` from `develop` for the work.
   If `develop` doesn't end up default, the user switches it in repo Settings → Branches (no tool for it here).
2. Scaffold Vite React-TS with pnpm; pin versions; add scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `test`,
   `test:run`, `coverage`, `lint`, `format`, `typecheck`.
3. Bootstrap SCSS selective build + layout/navbar/home page.
4. API layer (`client.ts`, types, ApiError) + unit tests.
5. Players feature + tests; 6. Board games feature + tests; 7. Tournaments + registrations + tests.
8. Docker: multi-stage `Dockerfile` (node+pnpm build → nginx:alpine), `nginx.conf` (SPA fallback, `/api` proxy to `API_URL`
   via envsubst template), `docker-compose.yml` for the front (optionally pointing to the API on host).
9. GitHub Actions CI: pnpm install, lint, typecheck, test, build.
10. README: run instructions (API via its compose + `mvnw`, then `pnpm dev`), scripts, architecture notes. Update PLAN.md checklist as steps complete.
Commit per step with clear messages; push to `claude/sweet-goodall-twda8e`. No PR unless asked.

## Verification
- `pnpm lint && pnpm typecheck && pnpm test:run && pnpm build` all green.
- Check the built CSS only contains selected components (grep for e.g. `.carousel`/`.offcanvas` absent; size check).
- End-to-end: run the API locally (Postgres via its docker compose + `./mvnw spring-boot:run`, if Docker/Maven work in the
  container), `pnpm dev`, then drive the app with Playwright (Chromium preinstalled): create player, board game, tournament,
  open it, register players beyond `maxPlayers` → waitlist shown, withdraw → promotion, trigger a validation error → field errors shown.
- `docker build` the front image and smoke-test it serves the SPA and proxies `/api`.
