param(
  [switch]$Build,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

$repoRoot = $PSScriptRoot
$dockerDesktopExe = Join-Path $Env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
$healthUrl = 'http://localhost:8085/healthz'
$appUrl = 'http://localhost:8085'

function Test-DockerReady {
  cmd /c "docker info >nul 2>nul"
  return $LASTEXITCODE -eq 0
}

function Wait-ForDocker {
  param(
    [int]$TimeoutSeconds = 120
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  do {
    if (Test-DockerReady) {
      return
    }

    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)

  throw 'Docker Desktop did not become ready in time.'
}

function Wait-ForApp {
  param(
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  do {
    try {
      $response = Invoke-WebRequest -UseBasicParsing $healthUrl -TimeoutSec 5
      if ($response.StatusCode -eq 200) {
        return
      }
    }
    catch {
      # Keep waiting until the container responds.
    }

    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)

  throw 'The app did not become ready on port 8085 in time.'
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker CLI was not found on PATH.'
}

if (-not (Test-DockerReady)) {
  if (-not (Test-Path $dockerDesktopExe)) {
    throw 'Docker Desktop is not running and its launcher was not found.'
  }

  Start-Process $dockerDesktopExe
  Wait-ForDocker
}

$composeArgs = @('compose', 'up', '-d')
if ($Build) {
  $composeArgs += '--build'
}

$composeCommand = "docker $($composeArgs -join ' ')"

Push-Location $repoRoot
try {
  cmd /c $composeCommand
  if ($LASTEXITCODE -ne 0) {
    throw 'docker compose up failed.'
  }
}
finally {
  Pop-Location
}

Wait-ForApp

if (-not $NoBrowser) {
  Start-Process $appUrl
}

Write-Host "App is ready at $appUrl"