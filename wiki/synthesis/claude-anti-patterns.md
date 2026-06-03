---
type: synthesis
created: 2026-06-02
updated: 2026-06-02
---

# Claude Anti-Patterns — Vessel Finance

Running log of failure modes caught while working in this repo. The next session reads this
to avoid repeating them. **Append-only, numbered.** Each entry: trigger pattern → why it's
tempting → why it's wrong → corrective rule.

A larger vendored base of generic anti-patterns ships in the LimitlessStack repo at
`templates/anti-patterns-base.md` — pull specific entries in here if/when they bite.

---

## 1. Assuming the toolchain is broken when it's a PATHEXT/PATH problem (Windows)

- **Trigger pattern**: A spawned shell reports `'node' is not recognized`, `'next' is not recognized`, or PowerShell throws *"Cannot run a document in the middle of a pipeline: …node.exe"* — and the instinct is "Node is broken / not installed."
- **Why it's tempting**: The errors look like a missing or corrupt install.
- **Why it's wrong**: Node, npm, git are all installed (`C:\Program Files\nodejs`, `C:\Program Files\Git`). The spawned shell on this machine has (a) a `PATHEXT` missing `.EXE`, so PowerShell treats `node.exe` as a "document," and (b) a PATH that sometimes omits the nodejs/git dirs. The tools work fine when invoked correctly.
- **Corrective rule**: Set `$env:PATHEXT = ".COM;.EXE;.BAT;.CMD"` and prepend `C:\Program Files\nodejs` to PATH, then invoke binaries by full path (e.g. `& "C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" build`). Use the repo's `_build.ps1` / `_start.ps1` helpers. Never conclude the toolchain is missing without checking `Test-Path` on the actual `.exe`.

## 2. Trying to run the app on Postgres/Docker

- **Trigger pattern**: `docker-compose.yml` defines Postgres on port 5433; the README quickstart says `docker compose up -d`. Natural move: start Docker to run the app.
- **Why it's tempting**: The README and compose file both point at Postgres.
- **Why it's wrong**: A prior session migrated the app to **SQLite**. `.env` is `DATABASE_URL="file:./dev.db"` and `prisma/schema.prisma` uses `provider = "sqlite"`. Docker isn't installed on the dev machine and isn't needed. `dev.db` already exists and is seeded.
- **Corrective rule**: The app is SQLite-backed. Ignore `docker-compose.yml` (legacy). To reset data use `npm run db:push` + `npm run db:seed`. Only revisit Postgres if explicitly asked to migrate back.

## 3. Indexing an `as const` tone map with a Prisma `string` field

- **Trigger pattern**: `next build` fails type-check: *"Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ readonly PENDING: …; … }'."* Source like `STATUS_TONE[e.status]`.
- **Why it's tempting**: It runs fine in dev (`next dev` doesn't hard-fail on type errors); the code looks correct.
- **Why it's wrong**: Prisma returns categorical columns as `string` (no SQLite enums). A map declared `as const` has a narrow key union, so a plain `string` index is rejected under strict TS during `next build`.
- **Corrective rule**: Cast the key to the map's key type: `STATUS_TONE[e.status as keyof typeof STATUS_TONE]`. Applies to any status/type/category lookup. (Fixed in `src/app/expenses/page.tsx` and `src/app/vessels/page.tsx` on 2026-06-02.) Maps typed `Record<string, …>` are unaffected.

## 4. Trusting Desktop Commander's streamed process output on this machine

- **Trigger pattern**: `start_process` + `read_process_output` returns 0 lines and "completed in 0.1s" even for long commands, making it look like commands produce no output / finish instantly.
- **Why it's tempting**: The empty result reads like success or failure with nothing to show.
- **Why it's wrong**: Live stdout capture is unreliable here. The command actually ran; the output just wasn't streamed back.
- **Corrective rule**: Redirect command output to a file (`… *> out.txt` / `Out-File`) and read the file with the Read tool. For long jobs, write a sentinel `*.done` file at the end and poll for it.

## 5. `npm install` that drops devDependencies → build fails on `tailwindcss` / `@/` not resolving

- **Trigger pattern**: After an `npm install <pkg>`, `next build` fails with `Module not found: Can't resolve '@/components/...'` (cascading on the alphabetically-first pages) and ultimately `Cannot find module 'tailwindcss'`. `npm install` reports a suspiciously low package count (~81 vs ~167).
- **Why it's tempting**: The `@/` errors look like a path-alias/tsconfig problem, sending you to fix `next.config.js` aliases — a red herring.
- **Why it's wrong**: The real cause is **missing devDependencies**. If `NODE_ENV=production` is in the environment (or an `omit=dev` is in effect), `npm install` skips devDeps — and `tailwindcss`, `typescript`, `postcss`, `autoprefixer`, `tsx`, `prisma` all live in `devDependencies`. Without tailwind, CSS processing fails; the alias/CSS errors are downstream symptoms. The "audited N packages" count is the tell (prod-only install ≈ half the packages).
- **Corrective rule**: Reinstall with dev deps: `npm install --include=dev` (and unset/clear `NODE_ENV` for the install). Confirm `node_modules/tailwindcss` exists before building. A production-only `node_modules` cannot build this app — `next build` needs the dev toolchain.
