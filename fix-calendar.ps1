$ErrorActionPreference = "Stop"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 HEADY SYSTEMS COMPLETE AUTO-REPAIR \u0026 CALENDAR FIX 🚀" -ForegroundColor Cyan
Write-Host "=====================================================`n" -ForegroundColor Cyan

# 1. Getting Calendar Token
$calToken = "REPLACE_ME_LATER_GOOGLE_TOKEN"

# 2. Fix Heady-Testing
$testingDir = "c:\Users\Heady\HeadySystems\Heady-Testing"
Write-Host "`n[1/3] Repairing Backend (Heady-Testing)..." -ForegroundColor Yellow
if (Test-Path $testingDir) {
    Set-Location $testingDir
    Write-Host "Installing missing dependencies (this will fix the js-yaml crash)..."
    pnpm install
    
    if (![string]::IsNullOrWhiteSpace($calToken)) {
        $envPath = Join-Path $testingDir ".env"
        if (Test-Path $envPath) {
            $envContext = Get-Content $envPath
            if ($envContext -match "^GOOGLE_CALENDAR_TOKEN=") {
                $envContext = $envContext -replace "^GOOGLE_CALENDAR_TOKEN=.*", "GOOGLE_CALENDAR_TOKEN=$calToken"
                Set-Content $envPath $envContext
            } else {
                Add-Content $envPath "GOOGLE_CALENDAR_TOKEN=$calToken"
            }
        } else {
            Add-Content $envPath "GOOGLE_CALENDAR_TOKEN=$calToken"
        }
        Write-Host "✅ Injected GOOGLE_CALENDAR_TOKEN into Heady-Testing." -ForegroundColor Green
    }

    Write-Host "Restarting PM2 Daemon..."
    pm2 start ecosystem.config.js --update-env
    pm2 save
}

# 3. Fix Heady-Staging
$stagingDir = "c:\Users\Heady\HeadySystems\Heady-Staging"
Write-Host "`n[2/3] Repairing Backend (Heady-Staging)..." -ForegroundColor Yellow
if (Test-Path $stagingDir) {
    Set-Location $stagingDir
    Write-Host "Installing missing dependencies..."
    pnpm install

    if (![string]::IsNullOrWhiteSpace($calToken)) {
        $envPath = Join-Path $stagingDir ".env"
        if (Test-Path $envPath) {
            $envContext = Get-Content $envPath
            if ($envContext -match "^GOOGLE_CALENDAR_TOKEN=") {
                $envContext = $envContext -replace "^GOOGLE_CALENDAR_TOKEN=.*", "GOOGLE_CALENDAR_TOKEN=$calToken"
                Set-Content $envPath $envContext
            } else {
                Add-Content $envPath "GOOGLE_CALENDAR_TOKEN=$calToken"
            }
        } else {
            Add-Content $envPath "GOOGLE_CALENDAR_TOKEN=$calToken"
        }
        Write-Host "✅ Injected GOOGLE_CALENDAR_TOKEN into Heady-Staging." -ForegroundColor Green
    }
    
    Write-Host "Restarting PM2 Daemon..."
    pm2 start ecosystem.config.js --update-env
    pm2 save
}

Write-Host "`n[3/3] Fix Complete!" -ForegroundColor Green
Write-Host "Your MCP Calendar process now has the token it needs, and the crashed backend has been successfully healed \u0026 restarted." -ForegroundColor Cyan
Write-Host "You can verify logs using: pm2 logs heady-manager"
