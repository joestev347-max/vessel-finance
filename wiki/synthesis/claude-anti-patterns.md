---
type: synthesis
created: 2026-06-02
updated: 2026-06-12
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

## 13. `pg` (node-postgres) crashes in the Vercel serverless bundle; use porsager/postgres

- **Trigger pattern**: The Express+`pg` app runs perfectly locally and the live API e2e passes against the Supabase pooler, but on Vercel every DB-backed route returns a **500 with an empty body** while DB-free routes (`/health`, an env-echo route) return 200. Runtime logs show only a truncated `(node:4) Warning: SECURITY ...` line and no caught error. The 500 comes back in **~0s** (measured) � an instant crash, not a hang/timeout.
- **Why it's tempting**: You assume the empty 500 is a connection hang/timeout and burn iterations on the connection string, pooler host (aws-0 vs aws-1), SSL flags, `connectionTimeoutMillis`, a `pool.on('error')` handler, IPv4-first DNS, and `maxDuration`. The env values were correct the whole time (verified via an env-echo route: correct host, sslNoVerify, JWT present).
- **Why it's wrong**: `pg` does not bundle/run cleanly as a `@vercel/node` serverless function � first use of the pool throws at a level that escapes the async try/catch and crashes the invocation (empty 500). It is environment-specific to the bundle, not the network or the credentials.
- **Corrective rule**: For Postgres on Vercel serverless, use **porsager/postgres** (`postgres`), a pure-JS driver that bundles cleanly, with **`prepare: false`** (the Supabase transaction pooler / Supavisor does not support named prepared statements). Keep the same small `Queryable {rows}` shim so routes and unit tests are unchanged; drive `begin/set_config(local)/commit` over a `sql.reserve()` connection to preserve the tenant-GUC RLS contract. (Fixed 2026-06-10: `pg` -> `postgres`, verified live on Vercel � login/me/vessels/jobs/logout all 200.)

## 14. An "empty-body 500" is a crash signal, not a timeout � measure latency before theorizing

- **Trigger pattern**: A serverless route 500s with no body. You theorize "the DB connect is hanging" and start tuning timeouts.
- **Why it's wrong**: A platform-level empty 500 can be an instant uncaught crash OR a function timeout � opposite causes. Guessing wrong sends you down a multi-commit rabbit hole (raising `connectionTimeoutMillis`/`maxDuration` does nothing for a 0-second crash).
- **Corrective rule**: Before theorizing, **measure**: wrap the request in a stopwatch (`ELAPSED ...s`). ~0s => crash (driver/bundle/uncaught throw); ~timeout-limit => genuine hang (network/DNS/connect). Also add a DB-free env-echo route early to confirm config without the DB in the path, and remember PowerShell's `Invoke-WebRequest` ignores a manually-set `Cookie` header � use `-SessionVariable`/`-WebSession` (a real cookie jar) when testing cookie auth, or you'll chase a phantom 401.

## 15. `NODE_ENV=production` in the build shell makes `npm install` silently skip devDependencies

- **Trigger pattern**: A fresh `npm install` exits 0 but the Next.js/Vite production build fails with `Cannot find module '@tailwindcss/postcss'` (or typescript/eslint). `node_modules` has ~50 packages, not hundreds; runtime deps (next/react) are present but build-time devDeps are missing.
- **Why it's tempting**: The install succeeds and runtime deps are there, so it looks complete.
- **Why it's wrong**: This machine's spawned shell has `NODE_ENV=production`; npm honors it as `--omit=dev`, so devDependencies (Tailwind/PostCSS, TypeScript, ESLint) are never installed and the production build (which needs them) breaks.
- **Corrective rule**: For local builds here, install with `npm install --include=dev` (or unset NODE_ENV for the install) and verify `Test-Path node_modules/@tailwindcss/postcss` before building. (Hit 2026-06-10 building the separate Boat Budget Next.js app.)

## 16. Roll Call reports the Pinecone key "set" off the User env var while the sync subprocess can't see it (false-green)

- **Trigger pattern**: Roll Call shows `Pinecone: key set` (green), but `pinecone-sync.py` then fails with `PINECONE_API_KEY is not set` when run from a spawned shell. The preflight and the sync disagree about whether the key exists.
- **Why it's tempting**: The preflight check resolved the key from the **User-level** environment variable (`[Environment]::GetEnvironmentVariable('PINECONE_API_KEY','User')`), which is genuinely set — so "key present" looks correct.
- **Why it's wrong**: A child process spawned by Desktop Commander does **not** reliably inherit a User-level env var that was set after the parent DC server process started — and the key was **not** in `.env`. So the preflight checked a source (User env) the sync couldn't actually use, and the sync resolves the key differently (process env, then `.env`). The green was real for the preflight's own shell but meaningless for the sync. A readiness gate that resolves a dependency differently from the tool it's gating will false-green. (Observed 2026-06-11.)
- **Corrective rule**: A readiness check must resolve a dependency the **same way the consumer does**. Fixed on two sides: (a) `pinecone-sync.py` now has `load_dotenv_file()` that reads the vault `.env` into `os.environ` (without overriding an existing var) before fetching the key, so the key lives in gitignored `.env` and no longer depends on the calling shell; (b) `preflight.ps1` check #4 now treats the key as present only if it's in the **process env OR `.env`** (the sources the sync uses), and downgrades "key only in User env, not in `.env`" to an explicit **yellow** ("spawned sync shells may not inherit it; add PINECONE_API_KEY to .env") instead of a green. Verified by stripping `PINECONE_API_KEY` from the shell and confirming both the sync and preflight still resolve it from `.env`.

## 17. Inline `$`-variables get stripped/mangled in Desktop Commander PowerShell `-Command` (use a `.ps1`)

- **Trigger pattern**: A `powershell -Command "...$env:PINECONE_API_KEY=...; ..."` one-liner run via Desktop Commander fails bizarrely — the `$env:X=` assignment loses its `$env:X` and PowerShell reports `=[Environment]::... is not recognized`; a `for ($i=0; $i -lt N; $i++)` poll loop dies with `Missing expression after unary operator '++'` because `$i`/`$d` were eaten; `echo EXITCODE:$LASTEXITCODE` prints an empty value. Each fragment is valid PowerShell when typed in a real terminal.
- **Why it's tempting**: A one-liner feels faster than writing a file, and the syntax is correct — so the failure looks like a PowerShell or tool bug rather than a transport problem.
- **Why it's wrong**: Desktop Commander mangles `$`-prefixed tokens (env vars, loop variables, `$LASTEXITCODE`) in transit on this machine — the same transport issue as the double-quote mangling in anti-pattern #7, different symptom. Anything depending on an inline `$`-reference survives only by luck.
- **Corrective rule**: For any PowerShell that references `$`-variables — env injection (`$env:X = [Environment]::GetEnvironmentVariable(...)`), loop counters, `$LASTEXITCODE` capture — **write a `.ps1` file and run it with `-File`**, never `-Command "...$..."`. This was hit repeatedly on 2026-06-11 (Pinecone env injection, build/commit poll loops, exit-code capture); every case was solved by moving the logic into a redirected-output `.ps1`. Pairs with #4 (redirect stdout to a file) and #7 (quoting) — the general rule is *scripts on disk, not inline, for anything non-trivial*.

## 18. NotebookLM `source delete-by-title` is a silent no-op on ambiguous titles → duplicates pile up

- **Trigger pattern**: The end-of-session refresh runs `notebooklm source delete-by-title "claude-anti-patterns.md" --notebook <id>` then `source add` the new file. The delete prints `Title '…' matches 2 sources. Delete by ID instead:` and exits **non-zero without deleting**, but the `source add` on the next line still runs — so every wrap adds another copy. Over several sessions the reminder bucket accumulates 3+ identical-titled sources.
- **Why it's tempting**: delete-by-title reads as idempotent ("remove the old copy, add the new one"), and the verification query still passes because NotebookLM answers from the *newest* copy — so the refresh looks healthy while clutter grows. (This is the real mechanism behind earlier "refresh didn't land" notes.)
- **Why it's wrong**: `delete-by-title` refuses to act when >1 source shares the title (it can't disambiguate). The first duplicate is usually created the first time the title-delete silently failed; after that it compounds. An old copy can later outrank the new one in a query, returning stale rules to a fresh session.
- **Corrective rule**: Refresh by **ID**, not title. `notebooklm source list --notebook <id> --json` to get ids, keep the newest, `notebooklm source delete --notebook <id> <source_id> -y` the rest, then `source add` once. Verify with a known-new fact AND confirm the source count is 1 per title. (Cleanup of the accumulated dupes done 2026-06-12.)


## 19. Parsing a multi-sheet workbook by "first sheet that matches" grabs the wrong sheet

- **Trigger pattern**: An Excel auto-reader for accounting's income statement scans every tab and uses the first sheet that has a "Revenue" line with a numeric value. It returns plausible-but-wrong numbers (or zeros), and the reconciliation is off.
- **Why it's tempting**: "First sheet with a Revenue line" feels robust and avoids hard-coding a tab name. On a single-statement file it works.
- **Why it's wrong**: Real ERP exports (Viewpoint/Vista here) are one giant workbook with **dozens of division P&Ls** (HEG Fiber, Grace Civil, …) that each have an identical "Revenue" row — all appearing *before* the entity you want. First-match locks onto the wrong division and silently maps that division's figures.
- **Corrective rule**: Target the **specific named sheet** the user identified (here: the tab whose name contains "hms comb"), with a narrow fallback (`includes("hms")`). Confirm the picked sheet's totals against a known value before trusting it. (Hit 2026-06-19 building the Boat Budget monthly-report Excel reader; the user had to say "only categorize the HMS Comb tab." Validated the fix locally against `HMS APRIL.xlsx` → Revenue 1,089,389.82 before deploying.)

## 20. Parsing an uploaded file in a serverless action is unreliable; parse it in the browser

- **Trigger pattern**: A Next.js server action downloads an uploaded `.xlsx` from storage and parses it with SheetJS server-side. The action runs without throwing but creates **zero** rows — the report saves with $0 everywhere. The same parse logic works perfectly in a local Node script against the same file.
- **Why it's tempting**: Doing the parse + DB write in one server action is tidy, keeps the category-mapping and id-lookups server-side, and "it's just Node."
- **Why it's wrong**: The combination of storage `download()` + a heavy CJS lib (`xlsx`) bundled into a Vercel serverless function is fragile — the failure is silent (caught and returns empty), so you can't see *which* part broke, and local `readFile` doesn't reproduce it. You burn time on RLS/MIME/bundle theories.
- **Corrective rule**: Parse the file **client-side**, where the `File` object already lives and the browser SheetJS path is well-trodden. Map to category **names** in the browser, ship a small JSON of `{direction, cat, sub, amount}` to the server, and let the server only resolve names→ids and insert. Reserve server-side file parsing for cases the browser genuinely can't do. (Hit 2026-06-19; moving the HMS parse to the client fixed the $0 reports immediately.)


## 21. Re-scoping a value (exclude/move it) but updating only the headline figure, not every place it's aggregated

- **Trigger pattern**: A requirement says "value X should no longer count toward Y." You change the headline total and a stat card, ship it, and claim it done — but the same value is also summed in a secondary breakdown (a by-unit table, a chart, a CSV), which still includes it. The user catches the leak in the next message.
- **Why it's tempting**: The headline total is the obvious surface and where the requirement "points." Once it reads right, the change *looks* complete.
- **Why it's wrong**: A value usually appears in several aggregations. On Boat Budget, splitting barge **charter** out of barge net income updated the net-income calc and the headline stat, but the "Revenue by barge #" per-unit table still summed *all* barge revenue — so charter still showed on the Barges tab (caught 2026-06-22, immediately after a "done" claim). Updating one aggregation and not its siblings ships a half-applied rule.
- **Corrective rule**: When re-scoping a value, **grep for every aggregation of it** (every `sum/reduce/filter` over the same source, every table/chart/export) and apply the rule to all of them — or consciously decide each one's treatment. Then, per audit-before-claim, actually trace where the value surfaces in the UI before saying "done"; a TypeScript build passing does not prove the rule landed everywhere.

## 22. PowerShell mangles `git commit -m` messages containing `()`, `$`, or `/` — use `git commit -F <file>`

- **Trigger pattern**: `git commit -m "Feature (with parens), $var-ish text, a/b"` run via the spawned PowerShell shell fails with `The term 'with' is not recognized` / `month/YTD is not recognized` — PowerShell parses fragments of the message as commands. Same root as #7 (quote mangling) and #17 (`$`-token stripping), new surface (the commit message).
- **Why it's tempting**: `-m` inline is the reflexive way to commit; the message is "just a string."
- **Why it's wrong**: The message rides through the same DC→PowerShell transport that eats `$`, unbalanced quotes, and parses `()`/`/` — so any non-trivial commit message (which our descriptive commits always are) breaks unpredictably.
- **Corrective rule**: Write the commit message to a file and `git commit -F <msgfile>` (then delete it), or keep `-m` messages to plain ASCII words with no `()`/`$`/`/`/quotes. Hit ~6× on 2026-06-22; every descriptive commit went through `-F`. (Also note: git writes progress to **stderr**, which Desktop Commander renders as a red `NativeCommandError` — that is NOT a failure; verify via `$LASTEXITCODE` and the `-> master` line.)
