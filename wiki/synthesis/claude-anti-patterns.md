---
type: synthesis
created: 2026-06-02
updated: 2026-06-04
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

## 6. Assuming Roll Call auto-fires in Cowork (it doesn't — hooks are CLI-only)

- **Trigger pattern**: A Claude Code `SessionStart` hook (`.claude/settings.json`) is set up to auto-run `tools/preflight.ps1`, but a fresh **Cowork** chat opens with a plain greeting and never runs Roll Call. Or a freshly-installed skill (e.g. `roll-call`) doesn't trigger in the chat it was installed in.
- **Why it's tempting**: The hook works in the Claude Code CLI, so it's easy to claim "Roll Call now runs automatically everywhere."
- **Why it's wrong**: `SessionStart` hooks are a **Claude Code CLI** feature; the Cowork desktop app does not execute them. And a skill installed to `~/.claude/skills/` mid-session is **not surfaced** into Cowork's available-skills list until a *new* session starts — so it can't be invoked in the session that installed it. In Cowork the only triggers are soft: the skill description (once surfaced) and the `CLAUDE.md` banner, both of which depend on the model choosing to act.
- **Corrective rule**: Don't promise hard auto-execution in Cowork. For a guaranteed trigger, use the Claude Code CLI (where the hook fires) or say "roll call" manually. After installing a skill, verify it's surfaced in a **new** session before relying on it. State the Cowork-vs-CLI distinction honestly rather than overclaiming.

## 7. Double quotes get mangled in Desktop Commander commands (cmd and PowerShell both)

- **Trigger pattern**: A command containing double quotes fails bizarrely: `git commit -m "fix: my message"` parses each word as a pathspec (`error: pathspec 'my' did not match`); a quoted exe path in cmd becomes `'\"C:\Program Files\...\gh.exe\"' is not recognized`; an inline `python -c "..."` dies with `SyntaxError: unterminated string literal`. Separately, PowerShell's `Compress-Archive` writes zip entries with backslash separators that strict unzippers (e.g. Cowork's .skill installer) reject.
- **Why it's tempting**: The same command works fine when typed into a real terminal, so the failure looks like a git/python/gh problem.
- **Why it's wrong**: Desktop Commander escapes or strips double quotes in transit on this machine, so anything depending on `"..."` survives only by luck. The tool isn't broken — the quoting is.
- **Corrective rule**: Avoid double quotes in `start_process` commands. Multi-word commit messages → `git commit -F msgfile.txt`. Inline scripts → write a `.py`/`.ps1` file first, then run it by path. In PowerShell prefer single quotes. For zips that other tools must read, use Python `zipfile` (forward slashes), not `Compress-Archive`.

## 8. cmd one-liners with `if`, `&&`, and `%VAR%` silently do the wrong thing (Desktop Commander)

- **Trigger pattern**: A chained cmd one-liner "succeeds" (exit 0) but part of it never ran. Three observed forms (2026-06-04): (a) `if not exist X mkdir X && copy …` — the `&&` chain binds to the `if` body, so when the condition is false the *entire rest of the line is skipped*, silently (the raw/ PDF copies no-op'd this way); (b) `… & echo EXITCODE:%ERRORLEVEL%` — `%ERRORLEVEL%` expands at *parse* time, so it reports the pre-command value (always 0), not the result; (c) `copy` with a long quoted source path failed with "cannot find the file specified" / "syntax incorrect" where PowerShell `Copy-Item -LiteralPath '…'` (single quotes) worked.
- **Why it's tempting**: One-liners are fast, exit code 0 + no error text reads as success, and each fragment is valid cmd in isolation.
- **Why it's wrong**: cmd parses the whole line up front: `if` consumes the rest of the line as its body, env vars expand before execution, and quote handling interacts with anti-pattern #7. "Exit 0" only means the *last parsed thing* didn't fail.
- **Corrective rule**: Anything beyond a single command goes in a `.cmd`/`.ps1` script file (one command per line) run by path. Verify side effects directly (dir listing, file read) rather than trusting exit codes. For copies with long/spaced paths use PowerShell `Copy-Item -LiteralPath` with single quotes. For exit codes, capture them inside the script on their own line.

## 9. Testing RLS as Supabase `postgres` proves nothing — it has `BYPASSRLS`

- **Trigger pattern**: You apply RLS policies, then run SELECT/INSERT as the connection the Supabase MCP uses (`current_user = postgres`) to "verify isolation." Everything is visible / every write succeeds, so either you wrongly conclude RLS is broken, or (worse) you wrongly conclude it passed because no error was thrown.
- **Why it's tempting**: `postgres` is the default MCP/SQL-editor identity and `execute_sql` just works; it *feels* like the app's identity.
- **Why it's wrong**: On Supabase the `postgres` role is **not a superuser but has `rolbypassrls = true`** (verified 2026-06-09 on project `naxqxajzlmisqdnfvhzm`). `BYPASSRLS` skips every policy regardless of `FORCE ROW LEVEL SECURITY`. So RLS tests run as `postgres` are meaningless. The app's real identity is a non-bypass role (here `tug_app`).
- **Corrective rule**: Exercise RLS as a role **without** `BYPASSRLS`. In a single MCP transaction: seed (postgres bypass is fine for seeding), then `set local role tug_app`, set the tenant GUC, run the assertions, and `raise` at the end so the whole thing rolls back (zero residue, no commit of test data). Confirm `rolbypassrls=false` for the role you assert under. Always finish with `get_advisors(security)` after DDL.

## 10. PostgreSQL 16+ `SET ROLE` needs the membership `SET` option, not just membership

- **Trigger pattern**: `pg_has_role('postgres','tug_app','MEMBER')` returns true, but `SET ROLE tug_app` fails with `42501: permission denied to set role "tug_app"`.
- **Why it's tempting**: Being a MEMBER of a role historically implied you could `SET ROLE` to it.
- **Why it's wrong**: PG16 split role membership into `INHERIT` / `SET` / `ADMIN` options. A grant made implicitly (e.g. creator gets `ADMIN` but `set_option=false`) does **not** permit `SET ROLE`. Check `pg_auth_members.set_option`.
- **Corrective rule**: If you hold `ADMIN` on the role (creators usually do), grant yourself the SET option: `GRANT <role> TO <me> WITH SET TRUE;` then `SET ROLE` works. Inspect `pg_auth_members` (admin/inherit/set options) rather than trusting `pg_has_role(...,'MEMBER')` alone.

## 11. A `SECURITY DEFINER` function in `public` is exposed over PostgREST to anon

- **Trigger pattern**: You add a `SECURITY DEFINER` helper in the `public` schema (e.g. a login lookup that returns rows the caller normally couldn't see), `REVOKE … FROM public` and `GRANT … TO` your app role, and assume it's locked down. The Supabase security advisor then fires `0028_anon_security_definer_function_executable` / `0029` — the function is callable at `/rest/v1/rpc/<fn>` by the `anon`/`authenticated` roles. In TugOS this meant `public.tug_auth_lookup` could return **password hashes** to anonymous HTTP callers.
- **Why it's tempting**: `REVOKE FROM public` *looks* like it removes access, and the function is "only called by the server."
- **Why it's wrong**: Supabase's PostgREST auto-exposes everything in the `public` schema and grants EXECUTE to `anon`/`authenticated` via default privileges, which a `REVOKE … FROM public` doesn't undo. A `SECURITY DEFINER` function runs as its owner (here a `BYPASSRLS` role), so over RPC it leaks owner-level data to the internet.
- **Corrective rule**: Keep `SECURITY DEFINER` helpers **out of `public`** — put them in a schema PostgREST doesn't expose (e.g. `private`), `REVOKE ALL … FROM public`, and `GRANT EXECUTE` only to the app role (which reaches it over a direct SQL connection, not RPC). Always run `get_advisors(type: security)` after any DDL and treat 0028/0029 as blockers. (Fixed in migration 0005: moved `tug_auth_lookup` to `private`.)

## 12. A broad `_*` gitignore silently swallows `__tests__` (and other `_`-prefixed dirs)

- **Trigger pattern**: Unit tests pass locally, but a fresh checkout / CI has **zero** tests and fails with `Could not find '…/__tests__/foo.test.ts'`. `git ls-files` shows the test dir isn't tracked; `git check-ignore -v <file>` points at a `_*` line.
- **Why it's tempting**: `_*` is a tidy way to ignore underscore-prefixed scratch files (the Limitless Stack convention on this repo).
- **Why it's wrong**: `_*` is unanchored, so it matches **any path segment** starting with `_` at any depth — including `__tests__`, `__mocks__`, `_internal`, etc. The whole directory is ignored and never committed. Local test runs use the untracked working-copy files, so they pass and mask the gap; only a clean checkout (CI) reveals it.
- **Corrective rule**: After adding any broad ignore, confirm intended files are still tracked (`git status`, `git ls-files <dir>`). Either anchor the scratch rule (e.g. `tugos/_*` or per-extension) or add a negation for legitimate dirs: `!**/__tests__/` then `!**/__tests__/**`. Treat CI-on-clean-checkout as the source of truth, not local runs. (Caught by `tugos-ci` 2026-06-10; fixed with the `!**/__tests__/` negation.)
