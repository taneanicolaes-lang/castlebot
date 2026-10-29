@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "node_modules" (
  echo Устанавливаю зависимости...
  call npm install
)
if not exist ".env" (
  echo Скопируй .env.example в .env и вставь токен BotFather.
  pause
  exit /b 1
)
npm start
pause
