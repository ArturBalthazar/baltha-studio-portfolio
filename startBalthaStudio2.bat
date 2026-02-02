@echo off
title Start Baltha Studio v2

:: Go to project directory
cd /d "D:\Offline Drive\Baltha Studio\Baltha-Studio-Portfolio"

:: Start Vite dev server in a minimized terminal
start /min cmd /k "npm run dev"

:: Start chatbot server in a minimized terminal
:: start /min cmd /k "node chatbot-server.cjs"

:: Wait a moment for servers to start
:: timeout /t 2 /nobreak >nul

:: Open the frontend in default browser
start "" http://localhost:5173/