[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PreviewUrl,
  [ValidateRange(1, 100)]
  [int]$Concurrency = 25,
  [ValidateRange(1, 30)]
  [int]$DurationSeconds = 10
)

$ErrorActionPreference = "Stop"
$target = [Uri]$PreviewUrl
if ($target.Scheme -ne "https" -or -not $target.Host.EndsWith(".vercel.app") -or $target.AbsolutePath -ne "/api/health" -or $target.Query -or $target.Fragment) {
  throw "PreviewUrl must be an exact HTTPS Vercel deployment URL ending in /api/health."
}
if (@("kdbt-app-dat-hang-five.vercel.app", "kdbt-app-dat-hang.vercel.app") -contains $target.Host) {
  throw "Production domains are blocked."
}

$projectPath = Join-Path $PSScriptRoot "..\.vercel\project.json"
if (-not (Test-Path -LiteralPath $projectPath -PathType Leaf)) {
  throw "The repo must be linked to its Vercel project before a protected Preview load test."
}
$project = Get-Content -LiteralPath $projectPath -Raw | ConvertFrom-Json
if (-not $project.projectId) { throw "The linked Vercel project ID is missing." }

$vercelCommand = Get-Command vercel.cmd -ErrorAction Stop
$previousErrorActionPreference = $ErrorActionPreference
try {
  $ErrorActionPreference = "Continue"
  $deploymentJson = & $vercelCommand.Source inspect --json $PreviewUrl 2>$null
  $inspectExitCode = $LASTEXITCODE
} finally {
  $ErrorActionPreference = $previousErrorActionPreference
}
if ($inspectExitCode -ne 0) { throw "Could not inspect the target deployment with Vercel CLI." }
$deployment = $deploymentJson | ConvertFrom-Json
$deploymentUrl = [Uri]("https://" + $deployment.url.TrimStart('/'))
if ($deployment.target -ne "preview" -or $deployment.readyState -ne "READY" -or $deployment.name -ne $project.projectName -or $deploymentUrl.Host -ne $target.Host) {
  throw "Target must be a READY Preview deployment belonging to the linked Vercel project."
}

$tempEnvFile = Join-Path ([IO.Path]::GetTempPath()) ("cencom-preview-load-" + [Guid]::NewGuid().ToString("N") + ".env")
if (Test-Path -LiteralPath $tempEnvFile) { throw "Temporary environment file collision; refusing to overwrite." }

$envNames = @("VERCEL_OIDC_TOKEN", "LOAD_TEST_ALLOW_REMOTE", "LOAD_TEST_CONFIRM_ENV", "LOAD_TEST_PREVIEW_URL", "LOAD_TEST_PREVIEW_TARGET")
$originalEnv = @{}
foreach ($name in $envNames) { $originalEnv[$name] = [Environment]::GetEnvironmentVariable($name, "Process") }
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

try {
  # Pull to a unique temp file so a stale VERCEL_OIDC_TOKEN in .env.local cannot be reused.
  & $vercelCommand.Source env pull $tempEnvFile --environment=development --yes
  if ($LASTEXITCODE -ne 0) { throw "Could not retrieve a fresh Development OIDC token from the linked Vercel project." }

  $tokenLines = @(Get-Content -LiteralPath $tempEnvFile | Where-Object { $_ -match '^VERCEL_OIDC_TOKEN=' })
  if ($tokenLines.Count -ne 1) { throw "Expected exactly one VERCEL_OIDC_TOKEN in the temporary environment file." }
  $token = ($tokenLines[0] -replace '^VERCEL_OIDC_TOKEN=', '').Trim()
  if (($token.StartsWith('"') -and $token.EndsWith('"')) -or ($token.StartsWith("'") -and $token.EndsWith("'"))) {
    $token = $token.Substring(1, $token.Length - 2)
  }

  $parts = $token.Split('.')
  if ($parts.Count -ne 3) { throw "The Development OIDC token is not a JWT." }
  $payload = $parts[1].Replace('-', '+').Replace('_', '/')
  switch ($payload.Length % 4) {
    2 { $payload += '==' }
    3 { $payload += '=' }
  }
  $claims = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json
  $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  if ($claims.environment -ne "development" -or $claims.project_id -ne $project.projectId -or [long]$claims.exp -le $now) {
    throw "The OIDC token must be current, from this linked project, and from Development."
  }

  $env:VERCEL_OIDC_TOKEN = $token
  $env:LOAD_TEST_ALLOW_REMOTE = "1"
  $env:LOAD_TEST_CONFIRM_ENV = "preview"
  $env:LOAD_TEST_PREVIEW_URL = $PreviewUrl
  $env:LOAD_TEST_PREVIEW_TARGET = "preview"
  Push-Location $repoRoot
  try {
    & node scripts/load-test.mjs --url $PreviewUrl --concurrency $Concurrency --duration-seconds $DurationSeconds
    if ($LASTEXITCODE -ne 0) { throw "Preview load test failed with exit code $LASTEXITCODE." }
  } finally {
    Pop-Location
  }
} finally {
  foreach ($name in $envNames) {
    $oldValue = $originalEnv[$name]
    if ($null -eq $oldValue) {
      Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
    } else {
      [Environment]::SetEnvironmentVariable($name, $oldValue, "Process")
    }
  }
  if (Test-Path -LiteralPath $tempEnvFile -PathType Leaf) { Remove-Item -LiteralPath $tempEnvFile -Force }
}
