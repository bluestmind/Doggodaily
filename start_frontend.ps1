#!/usr/bin/env pwsh
# Frontend startup script

Write-Host "🚀 Starting NavidDoggy Frontend Server..." -ForegroundColor Green

# Change to frontend directory
Set-Location -Path "frontend"

# Start the frontend development server
Write-Host "🔥 Starting Vite development server..." -ForegroundColor Yellow
npm run dev 