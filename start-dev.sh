#!/bin/bash

# Sorgu Savaşları - Tüm Uygulamayı Başlat

echo "🚀 Sorgu Savaşları Backend + Frontend Başlatılıyor..."
echo ""

# Backend'i başlat (arka planda)
echo "📦 Backend başlatılıyor (Port 3001)..."
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

# Biraz bekle
sleep 3

# Frontend'i başlat
echo "📱 Frontend başlatılıyor..."
npm run web

# Backend'i kapat (ESC ile çıkıldığında)
kill $BACKEND_PID
