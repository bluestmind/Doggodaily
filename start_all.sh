#!/bin/bash
# Script to run both backend (Flask) and frontend (Vite React) in parallel

# Start backend
cd backend
source venv/Scripts/activate
python manage.py &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both to finish
wait $BACKEND_PID $FRONTEND_PID 