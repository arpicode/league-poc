# league-poc

A React single-page app for the [Meeple League API](https://github.com/arpicode/league-api)
(branch `feat/game-match-slice`): players, board games, tournaments and their registrations.
The design notes and progress are in [PLAN.md](PLAN.md).

## Stack

React 19 · React Router 8 (data mode) · TypeScript · Vite 8 · Bootstrap 5.3 (built from SCSS) ·
Vitest 5 + Testing Library + MSW · ESLint + Prettier · pnpm

## Run it

Start the API first (see its README): Postgres with `docker compose up -d`, then
`./mvnw spring-boot:run`. The API listens on `:8080`.

```bash
pnpm install
pnpm dev            # http://localhost:5173, /api is proxied to http://localhost:8080
```

Set `API_URL` to point the proxy at another API: `API_URL=http://api.example:8080 pnpm dev`.

### With Docker

```bash
docker compose up --build   # http://localhost:5173, nginx proxies /api to the API on the host
```

The image is a static build served by nginx. `API_URL` (default `http://host.docker.internal:8080`)
sets where `/api` is forwarded.

## Scripts

| Command          | What it does                                 |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Dev server with hot reload                   |
| `pnpm build`     | Type-check, then build into `dist/`          |
| `pnpm preview`   | Serve the build (with the same `/api` proxy) |
| `pnpm test`      | Vitest in watch mode                         |
| `pnpm test:run`  | Vitest once (CI)                             |
| `pnpm coverage`  | Tests with a coverage report                 |
| `pnpm lint`      | ESLint                                       |
| `pnpm typecheck` | `tsc -b`                                     |
| `pnpm format`    | Prettier (write); `format:check` to verify   |

## How it is built

- **Same origin, no CORS.** The API has no CORS configuration, so the app only calls relative `/api/v1/...`
  URLs: Vite proxies them in development and nginx in the Docker image.
- **The router owns server state.** Each screen has a route `loader` (fetches, aborted on navigation) and
  an `action` (mutates). After an action the router revalidates the loaders on screen, so lists and
  rosters update without any client cache. Pagination lives in the URL (`?page=2`).
- **One error shape.** `src/api/client.ts` turns every failure, including a proxy answering 502 or no
  network at all, into an `ApiError` carrying an RFC 9457 problem detail. Actions return 400/409 problems to
  their form, which marks each field from `errors[]` and shows the `errorId` the API logged; anything else
  reaches the route's error boundary (404 page, generic error).
- **Server-side rules stay on the server.** Forms are `noValidate`: the API validates and the UI shows its
  messages. The tournament status buttons mirror the API's state machine
  (`DRAFT → OPEN → IN_PROGRESS → CLOSED`, `CANCELLED` from `DRAFT` or `OPEN`) so that only legal moves are offered.
- **Bootstrap from sources.** `src/styles/main.scss` imports only the partials the app uses (no carousel,
  modal, dropdown, …) and no Bootstrap JavaScript: the navbar toggle and delete confirmations are React state.
- **Tests** render the real route tree in a memory router against MSW handlers, so loaders, actions and
  components are exercised together.

```
src/
  api/          fetch client, DTO types, one module per resource
  components/   layout, pager, form field, alerts, confirm button
  features/     players/, boardgames/, tournaments/: one module per screen (component + loader/action)
  lib/          form parsing, error mapping, formatting
  routes.tsx    the route tree
  styles/       Bootstrap build
  test/         Vitest setup, MSW server, render helpers
```

## Not covered yet

Game matches exist in the API as an entity only; there is no endpoint to consume. `GameMatchStatus` is
typed in `src/api/types.ts`, and screens will follow once the API exposes matches.
