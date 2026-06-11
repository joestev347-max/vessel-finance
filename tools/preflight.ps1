# Roll Call - Limitless Stack readiness preflight (vessel-finance, Windows)
#
# Mechanical gate run at the start of substantive sessions. Checks each of the seven
# tools and reports a green/yellow/red verdict.
#
#   Exit 0 = READY (all green) - proceed
#   Exit 1 = WARN  (yellow drift) - report briefly, then proceed unless told otherwise
#   Exit 2 = BLOCK (red) - do not start substantive work until fixed or overridden
#
# Idempotent and read-only (except `notebooklm auth check --test`, which refreshes the
# token silently). ASCII only on purpose (em-dashes break the PS parser when written by tools).

$ErrorActionPreference = "Continue"
# This machine's spawned shells drop .EXE from PATHEXT; without this, `& python.exe`/`& git.exe`
# fail as "cannot run a document" and every exe-based check silently false-positives. (anti-pattern #1)
$env:PATHEXT = ".COM;.EXE;.BAT;.CMD"
$repo     = "C:\Users\joest\vessel-finance"
$skills   = "C:\Users\joest\.claude\skills"
$git      = "C:\Program Files\Git\cmd\git.exe"
$py       = "C:\Users\joest\AppData\Local\Programs\Python\Python312\python.exe"
$reminder = "202e85d1-7659-4c1a-a35c-bad1b1c81a64"

$green = 0; $yellow = 0; $red = 0
$warnings = @(); $blocks = @()
function Green ($m) { Write-Output "  [green]  $m"; $script:green++ }
function Yellow($m) { Write-Output "  [yellow] $m"; $script:yellow++; $script:warnings += $m }
function Red   ($m) { Write-Output "  [red]    $m"; $script:red++; $script:blocks += $m }

Write-Output "=== Roll Call - vessel-finance ==="

# 1. Claude - reasoning engine (implicitly present: it invoked this script)
Green "Claude - reasoning engine present"

# 2. CLAUDE.md - trust anchor (missing = BLOCK)
if (Test-Path "$repo\CLAUDE.md") { Green "CLAUDE.md present (trust anchor)" } else { Red "CLAUDE.md missing" }

# 3. Obsidian - wiki readable, page count, git clean
if (Test-Path "$repo\wiki\index.md") {
  $pages = @(Get-ChildItem "$repo\wiki" -Recurse -Filter *.md -ErrorAction SilentlyContinue).Count
  if ($pages -ge 5) { Green "Obsidian wiki: index.md present, $pages pages" }
  else { Yellow "Obsidian wiki: only $pages pages - vault looks thin" }
} else { Red "wiki/index.md missing" }
if (Test-Path $git) {
  $status = & $git -C $repo status --porcelain 2>$null
  if ([string]::IsNullOrWhiteSpace($status)) { Green "Obsidian/git: working tree clean" }
  else { $n = @($status | Where-Object { $_ -ne "" }).Count; Yellow "$n uncommitted files in vault - git status --short - ask before committing" }
} else { Yellow "git not found at $git" }

# 4. Pinecone - key resolvable the way pinecone-sync.py resolves it (process env OR .env),
#    package importable, last sync newer than newest wiki edit. We check .env (not just the User
#    env var) because a spawned sync subprocess does NOT reliably inherit a User-level var set after
#    the parent shell started - reporting "key set" off the User env alone was a false-green that let
#    the sync fail with "PINECONE_API_KEY is not set". (anti-pattern #5)
$envFile = "$repo\.env"
$keyInProc = [bool]$env:PINECONE_API_KEY
$keyInDotenv = $false
if (Test-Path $envFile) { $keyInDotenv = [bool](Select-String -Path $envFile -Pattern '^\s*PINECONE_API_KEY\s*=' -Quiet) }
$keyInUserEnv = [bool][Environment]::GetEnvironmentVariable("PINECONE_API_KEY", "User")
if (-not ($keyInProc -or $keyInDotenv)) {
  if ($keyInUserEnv) {
    Yellow "Pinecone: key only in User env, not in .env - spawned sync shells may not inherit it; add PINECONE_API_KEY to .env"
  } else {
    Yellow "Pinecone: PINECONE_API_KEY not set (checked process env, .env, User env) - semantic search disabled"
  }
} elseif (-not (Test-Path $py)) {
  Yellow "Pinecone: python not found at $py"
} else {
  & $py -c "import pinecone" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Yellow "Pinecone: pip package missing - python -m pip install pinecone --include=dev"
  } else {
    $state = "$repo\tools\.pinecone-sync-state.json"
    $newestWiki = (Get-ChildItem "$repo\wiki" -Recurse -Filter *.md -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
    if (-not (Test-Path $state)) {
      Yellow "Pinecone: key set but never synced - run 'python tools\pinecone-sync.py'"
    } elseif ($newestWiki -gt (Get-Item $state).LastWriteTime) {
      Yellow "Pinecone stale: wiki edited since last sync - run 'python tools\pinecone-sync.py --changed-only'"
    } else {
      Green "Pinecone: key set, index synced (newer than newest wiki edit)"
    }
  }
}

# 5. NotebookLM - auth check, reminder bucket configured
if (-not (Test-Path "$repo\wiki\notebooklm-buckets.json")) {
  Yellow "NotebookLM: wiki/notebooklm-buckets.json missing - buckets not set up"
} elseif (-not (Test-Path $py)) {
  Yellow "NotebookLM: python not found"
} else {
  & $py -m notebooklm auth check --test 1>$null 2>$null
  if ($LASTEXITCODE -eq 0) { Green "NotebookLM: authenticated; reminder bucket $($reminder.Substring(0,8)) configured" }
  else { Yellow "NotebookLM: auth check failed - run 'notebooklm login' (cookie/token may have expired)" }
}

# 6. Hub Workspace - documented skip (Open Scaffold proprietary, not in use here)
Green "Hub Workspace - documented skip (Open Scaffold proprietary)"

# 7. Paperclip - documented skip (Open Scaffold proprietary, not in use here)
Green "Paperclip - documented skip (Open Scaffold proprietary)"

# Skills installed (supporting the protocol)
$want = "limitless-stack","roll-call","four-tool-lookup","verify-before-claim","karpathy-guidelines","notebooklm","notebooklm-workflow","obsidian-wiki-workflow","end-of-session-checklist","audit-before-claim"
$missing = @($want | Where-Object { -not (Test-Path "$skills\$_\SKILL.md") })
if ($missing.Count -eq 0) { Green "Skills: all $($want.Count) installed" }
else { Yellow "Skills missing: $($missing -join ', ')" }

# --- verdict ---
Write-Output ""
Write-Output "  green: $green"
Write-Output "  yellow: $yellow"
Write-Output "  red: $red"
Write-Output ""
if ($red -gt 0) {
  Write-Output "VERDICT: BLOCK - $red red finding(s)"
  Write-Output "Blockers:"
  $blocks | ForEach-Object { Write-Output "  - $_" }
  exit 2
} elseif ($yellow -gt 0) {
  Write-Output "VERDICT: WARN - $yellow drift finding(s)"
  Write-Output "Warnings:"
  $warnings | ForEach-Object { Write-Output "  - $_" }
  exit 1
} else {
  Write-Output "VERDICT: READY - all green"
  exit 0
}
