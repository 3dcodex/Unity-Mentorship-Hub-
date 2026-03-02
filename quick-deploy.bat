@echo off
echo Starting deployment...
echo.
npm run build && firebase deploy
echo.
echo Deployment complete!
pause
