@echo off
echo ========================================
echo Build and Deploy Firebase
echo ========================================
echo.

cd /d E:\unitymentor-hub

echo Step 1: Building project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Make sure Node.js is installed.
    pause
    exit /b %errorlevel%
)

echo.
echo Step 2: Deploying Firebase Rules...
call firebase deploy --only firestore:rules,storage:rules,database:rules
if %errorlevel% neq 0 (
    echo Rules deployment failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Step 3: Deploying to Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo Hosting deployment failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
pause
