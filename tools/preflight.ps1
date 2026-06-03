# Roll Call - Windows preflight for the Limitless Stack (vessel-finance)
#
# Faithful Windows equivalent of the upstream tools/limitless-preflight.sh (step 8.5).
# Verifies the local stack is wired up and reports READY / WARN / BLOCK.
#
#   Exit 0 = READY  (proceed)
#   Exit 1 = WARN   (proceed unless the user says otherwise)
#   Exit 2 = BLOCK  (do not start substantive work until fixed)
#
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File tools\preflight.ps1

$ErrorActionPreference = "Continue"
$repo   = "C:\Users\joest\vessel-finance"
$skills = "C:\Users\joest\.claude\skills"
$block = 0; $warn = 0
function Ok   ($m) { Write-Output "  [OK]    $m" }
function Warn ($m) { Write-Output "  [WARN]  $m"; $script:warn++ }
function Block($m) { Write-Output "  [BLOCK] $m"; $script:block++ }

Write-Output "=== Roll Call - vessel-finance ==="

# 1. Trust anchor + wiki (core - missing = BLOCK)
if (Test-Path "$repo\CLAUDE.md") { Ok "CLAUDE.md present (trust anchor)" } else { Block "CLAUDE.md missing" }
foreach ($f in "index.md","log.md","overview.md") {
  if (Test-Path "$repo\wiki\$f") { Ok "wiki/$f present" } else { Block "wiki/$f missing" }
}
if (Test-Path "$repo\wiki\synthesis\claude-anti-patterns.md") { Ok "anti-patterns log present" } else { Warn "wiki/synthesis/claude-anti-patterns.md missing" }

# 2. Skills installed
$want = "limitless-stack","roll-call","four-tool-lookup","verify-before-claim","karpathy-guidelines","notebooklm","notebooklm-workflow","obsidian-wiki-workflow"
foreach ($s in $want) {
  if (Test-Path "$skills\$s\SKILL.md") { Ok "skill: $s" } else { Warn "skill missing: $s" }
}

# 3. Git state (uncommitted work = WARN - last session may not have wrapped)
$git = "C:\Program Files\Git\cmd\git.exe"
if (Test-Path $git) {
  $status = & $git -C $repo status --porcelain 2>$null
  if ([string]::IsNullOrWhiteSpace($status)) {
    Ok "git working tree clean"
  } else {
    $n = @($status | Where-Object { $_ -ne "" }).Count
    Warn "git has uncommitted changes ($n files) - commit/push to wrap the session"
  }
} else { Warn "git not found at $git" }

# 4. Pinecone (semantic memory) - WARN if not set up
if ($env:PINECONE_API_KEY) { Ok "PINECONE_API_KEY set" } else { Warn "PINECONE_API_KEY not set - semantic search disabled (step 8.2)" }
$py = "C:\Users\joest\AppData\Local\Programs\Python\Python312\python.exe"
if (Test-Path $py) {
  & $py -c "import pinecone" 2>$null
  if ($LASTEXITCODE -eq 0) { Ok "pinecone python package installed" } else { Warn "pinecone package not installed - pip install pinecone --break-system-packages" }
} else { Warn "python not found at $py" }

# 5. NotebookLM (reminder/default buckets) - WARN if not set up
if (Test-Path "$repo\wiki\notebooklm-buckets.json") { Ok "notebooklm-buckets.json present" } else { Warn "wiki/notebooklm-buckets.json missing - buckets not created yet (steps 8.3-8.4)" }

# --- verdict ---
Write-Output ""
$summary = "blocking=$block warnings=$warn"
if ($block -gt 0)    { Write-Output "RESULT: BLOCK   $summary"; exit 2 }
elseif ($warn -gt 0) { Write-Output "RESULT: WARN   $summary"; exit 1 }
else                 { Write-Output "RESULT: READY"; exit 0 }
