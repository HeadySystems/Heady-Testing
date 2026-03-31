<#
.SYNOPSIS
    Codex Environment Variable Injection Script (HEA-134)
.DESCRIPTION
    Dynamically injects critical API keys, tokens, and routing variables into the project root .env file for Heady Codex operations.
    Supports headless/automated injection or interactive prompting.
#>

param (
    [switch]$Interactive
)

$ProjectRoot = "C:\Users\Heady\HeadySystems\Heady-Testing"
$EnvPath = Join-Path $ProjectRoot ".env"

Write-Host "Initializing Codex Environment Setup Engine..." -ForegroundColor Cyan

# Define the critical environment variables for Codex Autonomous Operations
# If run non-interactively, it expects the user to have set them in the shell session prior, or it prompts if run interactively.
$CodexEnvVars = @{
    "HEADY_GITHUB_TOKEN"    = $null
    "LINEAR_API_KEY"        = $null
    "SENTRY_DSN"            = $null
    "OPENAI_API_KEY"        = $null
    "HEADY_AUTO_SUCCESS"    = "true"
    "HEADY_SAFE_MODE"       = "false"
}

if ($Interactive) {
    $CodexEnvVars["HEADY_GITHUB_TOKEN"] = Read-Host "Enter HEADY_GITHUB_TOKEN (Classic PAT for Codex Auto-Commit)"
    $CodexEnvVars["LINEAR_API_KEY"]     = Read-Host "Enter LINEAR_API_KEY (For Auto-Success telemetry sync)"
    $CodexEnvVars["SENTRY_DSN"]         = Read-Host "Enter SENTRY_DSN (For Heady network trace routing)"
    $CodexEnvVars["OPENAI_API_KEY"]     = Read-Host "Enter OPENAI_API_KEY (For LLM dynamic reasoning pool)"
} else {
    Write-Host "Running in Headless mode. Attempting to lift keys from active external pipeline state..." -ForegroundColor Yellow
    $CodexEnvVars["HEADY_GITHUB_TOKEN"] = $env:HEADY_GITHUB_TOKEN
    $CodexEnvVars["LINEAR_API_KEY"]     = $env:LINEAR_API_KEY
    $CodexEnvVars["SENTRY_DSN"]         = $env:SENTRY_DSN
    $CodexEnvVars["OPENAI_API_KEY"]     = $env:OPENAI_API_KEY
}

# Ensure file exists
if (-Not (Test-Path $EnvPath)) {
    Write-Host "No .env file found at $EnvPath. Creating new..." -ForegroundColor Yellow
    New-Item -Path $EnvPath -ItemType File | Out-Null
}

$CurrentEnv = Get-Content $EnvPath -ErrorAction SilentlyContinue
if ($null -eq $CurrentEnv) { $CurrentEnv = @() }

foreach ($Key in $CodexEnvVars.Keys) {
    $Value = $CodexEnvVars[$Key]
    if ([string]::IsNullOrWhiteSpace($Value)) {
        Write-Host "Skipping $Key (Empty or Null input)" -ForegroundColor DarkGray
        continue
    }

    # If key exists, replace it
    if ($CurrentEnv -match "^$Key=") {
        Write-Host "Updating existing $Key in .env" -ForegroundColor Green
        $CurrentEnv = $CurrentEnv -replace "^$Key=.*", "$Key=$Value"
    } else {
        Write-Host "Injecting new $Key into .env" -ForegroundColor Green
        $CurrentEnv += "$Key=$Value"
    }
}

# Save the updated env back to the project root
$CurrentEnv | Set-Content $EnvPath -Encoding UTF8

Write-Host "Codex Environment Initialization Complete. 🟢 The Heady Ecosystem is locked and loaded." -ForegroundColor Cyan
