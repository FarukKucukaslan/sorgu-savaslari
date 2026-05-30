@echo off
echo 🚀 Sorgu Savaslari Backend + Frontend Baslatiliyor...
echo.

echo 📦 Backend baslatiliyor (Port 3001)...
cd backend
start cmd /k "npm run start:dev"
cd ..

timeout /t 3 /nobreak

echo 📱 Frontend baslatiliyor...
npm run web

pause
