# Self-Heal Setup — vessel-finance

The self-healing pipeline is **built and wired** in this repo. It captures bugs in-app, has Claude
diagnose them (with `CLAUDE.md` as the system prompt), and — on operator dispatch — runs a
sandboxed GitHub Actions agent that opens a PR. **Auto-merge is OFF**: every fix is reviewed by a
human. This file is what an operator sets to turn it on.

## What's already in the repo

- `BugReport` Prisma model (SQLite) — `prisma/schema.prisma`.
- In-app bug reporter widget (🐞, bottom-right of every page) — `src/components/debug/BugReporter.tsx`.
- Admin view — `/bug-reports` (`src/app/bug-reports/page.tsx`).
- API routes:
  - `POST /api/bug-reports` — capture + Claude diagnosis (`src/lib/self-heal/diagnose.ts`).
  - `POST /api/bug-reports/[id]/dispatch` — fire the repair workflow.
  - `POST /api/self-heal/callback` — receive status updates from the workflow.
- Repair agent — `scripts/self-heal-agent.mjs` (tool whitelist: read/list/grep/edit/write/bash/finish; 25-turn budget).
- Workflow — `.github/workflows/self-heal.yml` (triggered by `repository_dispatch`).

## Environment variables (the app)

Set these where the app runs (locally: `setx` or your shell; deployed: your host's env settings).

| Variable | Purpose | Needed for |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude diagnostic pass | **Diagnosis** |
| `ANTHROPIC_MODEL` | Optional model override (default `claude-sonnet-4-6`) | optional |
| `GITHUB_TOKEN` | Fine-grained PAT, this repo, **contents:write + pull-requests:write** | **Dispatch** |
| `GITHUB_REPO` | `joestev347-max/vessel-finance` | **Dispatch** |
| `SELF_HEAL_CALLBACK_TOKEN` | Shared secret for the callback webhook (`openssl rand -hex 32`) | callbacks |
| `SELF_HEAL_CALLBACK_URL` | Public origin of the deployed app (e.g. `https://…`) | callbacks (deployed only) |

Without `ANTHROPIC_API_KEY`, bug reports are still **captured and stored** — diagnosis is just
skipped (the `/bug-reports` page shows a notice). Without `GITHUB_TOKEN`/`GITHUB_REPO`, the
"Dispatch self-heal" button is disabled.

## GitHub repository secrets (Actions)

Add under **Settings → Secrets and variables → Actions**:

| Secret | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key for the repair agent |
| `SELF_HEAL_CALLBACK_TOKEN` | Must match the app's `SELF_HEAL_CALLBACK_TOKEN` |

(`GITHUB_TOKEN` inside Actions is provided automatically.) Optionally add a repo **variable**
`ANTHROPIC_MODEL` to override the model in CI.

## Going live

1. Set `ANTHROPIC_API_KEY` for the app → file a test bug with the 🐞 button → confirm a diagnosis
   appears on `/bug-reports`.
2. Add the two GitHub Actions secrets above.
3. Set `GITHUB_TOKEN` + `GITHUB_REPO` (and `SELF_HEAL_CALLBACK_TOKEN`) for the app.
4. On a diagnosed report, click **Dispatch self-heal**. The workflow runs, the agent attempts a
   surgical fix, and opens a PR.
5. Review and merge the PR through the normal process. **Keep auto-merge off.**

## Local vs deployed callbacks

The workflow posts status callbacks (`started` / `pr-opened` / `failed`) to
`SELF_HEAL_CALLBACK_URL` (or the request origin). GitHub Actions can't reach `localhost`, so on an
**undeployed** app the callbacks just won't land — that's fine: the PR still opens, and you'll see
it on GitHub. Once the app is deployed with a public `SELF_HEAL_CALLBACK_URL`, the `/bug-reports`
page updates itself with the self-heal status and PR link.

## Safety model

- `CLAUDE.md` is the trust anchor — both the diagnostic and repair agents receive it as system prompt.
- The repair agent is **sandboxed** in an ephemeral Actions runner with a code-level tool whitelist;
  it can't touch `.github/`, `.env`, `node_modules/`, lockfiles, `.git/`, `prisma/dev.db`, or itself.
- **Diagnose before repair** — diagnosis is cheap and automatic; repair is gated behind the operator's
  dispatch click.
- **Human merge by default** — PRs only, never direct commits to `master`.
