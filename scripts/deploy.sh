#!/bin/bash

# Környezeti változók ellenőrzése
if [ -z "$NEXT_PUBLIC_FIREBASE_API_KEY" ]; then
    echo "Hiba: NEXT_PUBLIC_FIREBASE_API_KEY nincs beállítva"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" ]; then
    echo "Hiba: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN nincs beállítva"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ]; then
    echo "Hiba: NEXT_PUBLIC_FIREBASE_PROJECT_ID nincs beállítva"
    exit 1
fi

# Production build
echo "Production build készítése..."
npm run build

# Build ellenőrzése
if [ $? -ne 0 ]; then
    echo "Hiba: A build sikertelen volt"
    exit 1
fi

# Típusok ellenőrzése
echo "Típusok ellenőrzése..."
npm run type-check

if [ $? -ne 0 ]; then
    echo "Hiba: A típusok ellenőrzése sikertelen volt"
    exit 1
fi

# Tesztek futtatása
echo "Tesztek futtatása..."
npm run test

if [ $? -ne 0 ]; then
    echo "Hiba: A tesztek sikertelenek voltak"
    exit 1
fi

# Deployment
echo "Deployment indítása..."
npm run deploy

echo "Deployment sikeresen befejezve!" 