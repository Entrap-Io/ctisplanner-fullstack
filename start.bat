@echo off
echo Starting CTIS Planner Full-Stack Application...
echo.

REM Check if node_modules exists
if not exist "backend\node_modules" (
    echo Installing dependencies...
    cd backend
    call npm install
    cd ..
    echo Dependencies installed
    echo.
)

REM Start the server
echo Starting server on http://localhost:3000
cd backend
npm run dev
