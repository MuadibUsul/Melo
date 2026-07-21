param(
  [string]$PostgresBin = "C:\Program Files\PostgreSQL\12\bin"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$infra = Join-Path $root "artifacts\local-infra"
$pgData = Join-Path $infra "pgdata"
$env:DATABASE_URL = "postgresql://app:app@localhost:5433/music?schema=public"
$env:REDIS_URL = "redis://localhost:6379"
$env:S3_ENDPOINT = "http://127.0.0.1:9000"
$env:S3_REGION = "us-east-1"
$env:S3_ACCESS_KEY_ID = "minioadmin"
$env:S3_SECRET_ACCESS_KEY = "minioadmin"
$env:S3_BUCKET = "music-assets"
$env:JWT_ACCESS_SECRET = "dev-access-secret-change-me"
$env:JWT_REFRESH_SECRET = "dev-refresh-secret-change-me"
$env:API_PORT = "4000"
$env:PAYMENT_PROVIDER = "mock"
$env:ENABLE_BACKGROUND = "1"
$env:MINIMAX_BASE_URL = "http://127.0.0.1:9010"
$env:MINIMAX_API_KEY = "smoke-key"
$marker = Join-Path $infra "smoke-local-backend.trace.log"

function Mark($message) {
  $line = "[$(Get-Date -Format o)] $message"
  Write-Host "[smoke] $message"
  Add-Content -Path $marker -Value $line
}

function Assert-PortFree($port) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($conn) {
    throw "Port $port is already in use by PID $($conn[0].OwningProcess). Stop it before running this smoke test."
  }
}

function Start-CmdProcess($name, $command) {
  $out = Join-Path $infra "$name.log"
  $err = Join-Path $infra "$name.err.log"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/d", "/s", "/c", $command -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Hidden | Out-Null
}

function Wait-Port($port, $label) {
  for ($i = 0; $i -lt 30; $i++) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
      $async = $client.BeginConnect("127.0.0.1", $port, $null, $null)
      if ($async.AsyncWaitHandle.WaitOne(500)) {
        $client.EndConnect($async)
        $client.Close()
        Mark "$label is listening on $port."
      return
      }
    } catch {
      Start-Sleep -Milliseconds 500
    } finally {
      $client.Close()
    }
  }
  throw "$label did not start on port $port."
}

function Stop-Port($port) {
  $owner = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess
  if ($owner) {
    Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue
  }
}

New-Item -ItemType Directory -Path $infra -Force | Out-Null
Set-Content -Path $marker -Value "[$(Get-Date -Format o)] smoke start"

foreach ($port in 4000, 5433, 6379, 9000, 9010) {
  Assert-PortFree $port
}

try {
  Mark "Preparing local PostgreSQL..."
  if (!(Test-Path $pgData)) {
    & (Join-Path $PostgresBin "initdb.exe") -D $pgData -U app --auth=trust --encoding=UTF8 --locale=C | Out-Host
  }

  $pgStart = Start-Process -FilePath (Join-Path $PostgresBin "pg_ctl.exe") `
    -ArgumentList "-D `"$pgData`" -l `"$((Join-Path $infra "postgres-smoke.log"))`" -o `"-p 5433`" start" `
    -RedirectStandardOutput (Join-Path $infra "pg-start-smoke.log") `
    -RedirectStandardError (Join-Path $infra "pg-start-smoke.err.log") `
    -WindowStyle Hidden `
    -PassThru
  if (!$pgStart.WaitForExit(15000)) {
    Stop-Process -Id $pgStart.Id -Force -ErrorAction SilentlyContinue
    throw "pg_ctl start did not exit within 15 seconds."
  }
  Wait-Port 5433 "PostgreSQL"

  $createdb = Start-Process -FilePath (Join-Path $PostgresBin "createdb.exe") `
    -ArgumentList "-w", "-h", "127.0.0.1", "-p", "5433", "-U", "app", "music" `
    -RedirectStandardOutput (Join-Path $infra "createdb-smoke.log") `
    -RedirectStandardError (Join-Path $infra "createdb-smoke.err.log") `
    -WindowStyle Hidden `
    -PassThru
  if (!$createdb.WaitForExit(10000)) {
    Stop-Process -Id $createdb.Id -Force -ErrorAction SilentlyContinue
    throw "createdb did not exit within 10 seconds."
  }
  if ($createdb.ExitCode -ne 0) {
    Mark "Database 'music' already exists or createdb returned $($createdb.ExitCode)."
  }

  Mark "Starting Redis..."
  Start-Process -FilePath "redis-server.exe" -ArgumentList "--port", "6379", "--save", '""', "--appendonly", "no", "--logfile", (Join-Path $infra "redis-smoke.log") -WindowStyle Hidden | Out-Null
  Wait-Port 6379 "Redis"
  redis-cli FLUSHDB | Out-Null

  Mark "Starting S3 and MiniMax protocol mocks..."
  Start-Process -FilePath "node.exe" -ArgumentList (Join-Path $root "scripts\smoke\s3-smoke-server.cjs") -RedirectStandardOutput (Join-Path $infra "s3-smoke-script.log") -RedirectStandardError (Join-Path $infra "s3-smoke-script.err.log") -WindowStyle Hidden | Out-Null
  Wait-Port 9000 "S3 smoke server"

  Start-Process -FilePath "node.exe" -ArgumentList (Join-Path $root "scripts\smoke\minimax-smoke-server.cjs") -RedirectStandardOutput (Join-Path $infra "minimax-smoke-script.log") -RedirectStandardError (Join-Path $infra "minimax-smoke-script.err.log") -WindowStyle Hidden | Out-Null
  Wait-Port 9010 "MiniMax smoke server"

  Push-Location $root
  try {
    Mark "Building API and worker, syncing database..."
    pnpm --filter @music/api build
    pnpm --filter @music/worker build
    pnpm --filter @music/api db:push
    pnpm --filter @music/api exec tsx prisma/seed.ts
  } finally {
    Pop-Location
  }

  Mark "Starting API and worker..."
  Start-CmdProcess "api-smoke-script" "cd /d `"$root\apps\api`" && pnpm start"
  Wait-Port 4000 "API"

  Start-CmdProcess "worker-smoke-script" "cd /d `"$root\apps\worker`" && pnpm start"
  Start-Sleep -Seconds 3

  Mark "Running end-to-end API/worker checks..."
  @'
async function api(path, options = {}) {
  const res = await fetch('http://127.0.0.1:4000/api/v1' + path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`${path} ${res.status}: ${text}`);
  return data;
}

const health = await api('/health');
if (health.status !== 'ok' || health.dependencies.minimax !== 'configured') {
  throw new Error(`Unexpected health: ${JSON.stringify(health)}`);
}

const login = await api('/auth/login', { method: 'POST', body: JSON.stringify({ identifier: 'admin@music.local', password: 'admin123' }) });
const auth = { authorization: `Bearer ${login.accessToken}` };
const before = await api('/entitlement/balance', { headers: auth });
const job = await api('/generation/jobs', {
  method: 'POST',
  headers: { ...auth, 'idempotency-key': `smoke-script-${Date.now()}` },
  body: JSON.stringify({
    type: 'music',
    mode: 'simple',
    params: {
      prompt: 'Melo scripted worker smoke',
      lyrics: '[Verse]\nMelo starts inside the queue\n[Chorus]\nThe worker sings it through',
      isInstrumental: false,
    },
  }),
});
let current = job;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 500));
  current = await api(`/generation/jobs/${job.id}`, { headers: auth });
  if (['succeeded', 'failed', 'canceled'].includes(current.status)) break;
}
if (current.status !== 'succeeded' || !current.assetId) {
  throw new Error(`Generation did not succeed: ${JSON.stringify(current)}`);
}
const after = await api('/entitlement/balance', { headers: auth });
if (before.balance - after.balance !== 10) {
  throw new Error(`Expected 10 credit spend, saw ${before.balance} -> ${after.balance}`);
}
const play = await api(`/assets/${current.assetId}/play`, { headers: auth });
const got = await fetch(play.url);
const body = Buffer.from(await got.arrayBuffer()).toString('utf8');
if (body !== 'MELO-WORKER-MINIMAX-SMOKE') {
  throw new Error(`Unexpected audio body: ${body}`);
}

const refundBefore = await api('/entitlement/balance', { headers: auth });
const refundJob = await api('/generation/jobs', {
  method: 'POST',
  headers: { ...auth, 'idempotency-key': `smoke-refund-${Date.now()}` },
  body: JSON.stringify({ type: 'music', mode: 'simple', params: { prompt: 'missing lyrics should refund', isInstrumental: false } }),
});
let failed = refundJob;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 500));
  failed = await api(`/generation/jobs/${refundJob.id}`, { headers: auth });
  if (['succeeded', 'failed', 'canceled'].includes(failed.status)) break;
}
const refundAfter = await api('/entitlement/balance', { headers: auth });
if (failed.status !== 'failed' || refundBefore.balance !== refundAfter.balance) {
  throw new Error(`Refund smoke failed: ${JSON.stringify({ failed, refundBefore, refundAfter })}`);
}

console.log(JSON.stringify({
  health,
  succeededJob: current.id,
  assetId: current.assetId,
  creditSpend: before.balance - after.balance,
  refundJob: failed.id,
  finalBalance: refundAfter.balance,
}, null, 2));
'@ | node -
} finally {
  Mark "Cleaning up temporary services..."
  Stop-Port 4000
  Stop-Port 6379
  Stop-Port 9000
  Stop-Port 9010
  try {
    & (Join-Path $PostgresBin "pg_ctl.exe") -D $pgData stop -m fast 2>$null | Out-Null
  } catch {
    # Postgres may not have started if an earlier smoke step failed.
  }
}
