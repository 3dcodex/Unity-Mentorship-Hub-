# Firebase Email Configuration Guide

## Issue: Users Not Receiving Password Reset Emails

If users report not receiving password reset emails, follow these steps:

### 1. Configure Firebase Email Templates

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `unity-mentorship-hub-ca76e`
3. Navigate to **Authentication** → **Templates** tab
4. Click on **Password reset** template

### 2. Customize Email Template

**From Name:** Unity Mentorship Hub
**From Email:** noreply@unity-mentorship-hub-ca76e.firebaseapp.com

**Subject:** Reset your Unity password

**Email Body:**
```
Hello,

We received a request to reset your Unity Mentorship Hub password.

Click the link below to reset your password:
%LINK%

If you didn't request this, you can safely ignore this email.

This link will expire in 1 hour.

Best regards,
Unity Mentorship Hub Team
```

### 3. Configure Email Sender

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Ensure your domain is listed:
   - `unity-mentorship-hub-ca76e.web.app`
   - `unity-mentorship-hub-ca76e.firebaseapp.com`
   - Your custom domain (if any)

### 4. Check Email Deliverability

**Common Issues:**
- Emails going to spam folder
- Email provider blocking Firebase emails
- Rate limiting (too many requests)
- Invalid email addresses

**Solutions:**
1. **Whitelist Firebase emails:**
   - Add `noreply@unity-mentorship-hub-ca76e.firebaseapp.com` to contacts
   - Check spam/junk folder

2. **Use Custom Domain (Recommended):**
   - Set up custom email domain in Firebase
   - Improves deliverability
   - Looks more professional

3. **Enable Email Verification:**
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Email link (passwordless sign-in) if needed

### 5. Test Password Reset

1. Go to your app: https://unity-mentorship-hub-ca76e.web.app
2. Click "Forgot Password"
3. Enter a test email
4. Check inbox and spam folder
5. Verify link works and redirects properly

### 6. Monitor Email Logs

Check Firebase Console → Authentication → Users for:
- Failed email attempts
- Bounced emails
- Rate limit errors

### 7. Alternative: Custom Email Service

If Firebase emails continue to have issues, consider:
- SendGrid
- AWS SES
- Mailgun
- Postmark

Implement via Firebase Cloud Functions for better control.

## Current Implementation

The app now provides:
- ✅ Clear error messages
- ✅ Email format validation
- ✅ Rate limiting (3 attempts per 15 minutes)
- ✅ Audit logging
- ✅ Spam folder reminder
- ✅ 1-hour link expiration notice

## Support

If issues persist:
1. Check Firebase Console logs
2. Verify email template is configured
3. Test with different email providers (Gmail, Outlook, etc.)
4. Contact Firebase Support if needed
