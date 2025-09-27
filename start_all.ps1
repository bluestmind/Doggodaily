# PowerShell script to run both backend and frontend in parallel

Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; venv\Scripts\activate; python manage.py' -WindowStyle Normal
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend; npm run dev' -WindowStyle Normal

Write-Host "Both backend and frontend are starting in new windows." 