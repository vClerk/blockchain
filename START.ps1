# SmartSubsidy - Startup Script
# Run this script to start both servers

Write-Host "`n🚀 STARTING SMARTSUBSIDY BLOCKCHAIN PROJECT" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor White

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found! Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Stop any existing node processes
Write-Host "`nStopping existing Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null | Out-Null
Start-Sleep -Seconds 2
Write-Host "✅ Cleared existing processes" -ForegroundColor Green

# Start Backend Server
Write-Host "`n📦 Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
$backendPath = "c:\Users\sampa\OneDrive\Desktop\blockchain2\backend"
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:backendPath
    node server.js
}
Write-Host "✅ Backend starting... (Job ID: $($backendJob.Id))" -ForegroundColor Green

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "`n🎨 Starting Frontend Server (Port 3000)..." -ForegroundColor Yellow
$frontendPath = "c:\Users\sampa\OneDrive\Desktop\blockchain2\frontend"
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:frontendPath
    npm start
}
Write-Host "✅ Frontend starting... (Job ID: $($frontendJob.Id))" -ForegroundColor Green

# Wait for servers to start
Write-Host "`n⏳ Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n==========================================`n" -ForegroundColor White
Write-Host "🎉 SERVERS STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "`n📱 Open in browser:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "`n📝 Quick Actions:" -ForegroundColor Cyan
Write-Host "   • Landing Page:       http://localhost:3000" -ForegroundColor White
Write-Host "   • Farmer Registration: http://localhost:3000/register-farmer" -ForegroundColor White
Write-Host "   • Govt Dashboard:      http://localhost:3000/government-dashboard" -ForegroundColor White
Write-Host "   • Farmer Dashboard:    http://localhost:3000/farmer-dashboard" -ForegroundColor White
Write-Host "`n🔧 Features Available:" -ForegroundColor Cyan
Write-Host "   ✅ Mock Mode (No blockchain needed)" -ForegroundColor Green
Write-Host "   ✅ Farmer Registration with Private Key" -ForegroundColor Green
Write-Host "   ✅ Government Verification" -ForegroundColor Green
Write-Host "   ✅ Document Upload System" -ForegroundColor Green
Write-Host "   ✅ In-Memory Data Storage" -ForegroundColor Green
Write-Host "`n⚠️  To stop servers: Press Ctrl+C or run: taskkill /F /IM node.exe" -ForegroundColor Yellow
Write-Host "`n==========================================`n" -ForegroundColor White

# Keep script running
Write-Host "Press any key to stop servers and exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup
Write-Host "`nStopping servers..." -ForegroundColor Yellow
Stop-Job $backendJob -ErrorAction SilentlyContinue
Stop-Job $frontendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -ErrorAction SilentlyContinue
Remove-Job $frontendJob -ErrorAction SilentlyContinue
taskkill /F /IM node.exe 2>$null | Out-Null
Write-Host "✅ Servers stopped" -ForegroundColor Green
