@echo off
echo Building Unity Mentor Hub...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

echo Deploying to Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo Deploy failed!
    exit /b %errorlevel%
)

echo Done! Your app is now live.
