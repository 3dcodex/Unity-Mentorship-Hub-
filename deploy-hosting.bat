@echo off
echo ========================================
echo Firebase Hosting Deployment
echo ========================================
echo.

cd /d e:\unitymentor-hub

echo Step 1: Building project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Step 2: Deploying to Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo Deployment failed! You may need to run: firebase login
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your app is live at:
echo https://unity-mentorship-hub-ca76e.web.app
echo.
pause
