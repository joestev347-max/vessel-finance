# TugOS Web — Surface 1 (Dispatch board)

React 19 + Vite + Tailwind UI for the TugOS dispatch board. Talks to the Surface 2
REST API (`tugos/api`). First slice: sign in → see vessels/jobs → create a job →
advance job status across the board.

## Run

```
cp .env.example .env          # set VITE_API_BASE to the API origin
npm install
npm run dev                   # http://localhost:5173
```

The API (`tugos/api`) must be running and its `CORS_ORIGINS` must allow this
origin (unset CORS reflects the request origin in dev). Sign in with a user
provisioned via the API (`POST /users`) or seeded in the DB.

## Verify

```
npm run typecheck             # tsc --noEmit
npm run build                 # tsc --noEmit && vite build
```

## What it does

- **Login** (`/auth/login`) — stores the 15-min JWT in localStorage; a 401 from
  any call signs the user out.
- **Dispatch board** — four status columns (scheduled / en route / on scene /
  complete); each job card shows its vessel + client and buttons for the allowed
  next transitions (`PATCH /jobs/:id`). A form creates a job from a vessel +
  optional client.

All data is tenant-scoped by the API's RLS — the UI only ever sees the signed-in
user's company.
