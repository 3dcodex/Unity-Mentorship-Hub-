# Replace YOUR_EMAIL with your actual email address
$email = "YOUR_EMAIL"
$url = "https://us-central1-unity-mentorship-hub-ca76e.cloudfunctions.net/initializeSuperAdmin?email=$email&secret=unity_admin_secret_2024"

Write-Host "Creating super admin for: $email" -ForegroundColor Green
Invoke-WebRequest -Uri $url

Write-Host "`nDone! Now:" -ForegroundColor Green
Write-Host "1. Logout (if logged in)" -ForegroundColor Yellow
Write-Host "2. Login with: $email" -ForegroundColor Yellow
Write-Host "3. Navigate to /admin" -ForegroundColor Yellow
Write-Host "4. You have full admin access!" -ForegroundColor Green
