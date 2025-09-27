#!/usr/bin/env pwsh
# Backend startup script

Write-Host "🚀 Starting NavidDoggy Backend Server..." -ForegroundColor Green

# Change to backend directory
Set-Location -Path "backend"

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "📦 Activating virtual environment..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
}

# Start the backend server
Write-Host "🔥 Starting Flask development server..." -ForegroundColor Yellow
python start_simple.py 