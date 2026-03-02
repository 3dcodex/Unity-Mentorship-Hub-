# Fix Password Reset Emails Going to Spam

## Quick Fixes (Do These Now)

### 1. Customize Firebase Email Template
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `unity-mentorship-hub-ca76e`
3. Navigate to: **Authentication → Templates → Password reset**
4. Click **Edit template**
5. Customize:
   - **From name**: Unity Mentorship Hub
   - **Reply-to email**: support@yourdomain.com (if you have one)
   - **Subject**: Reset Your Unity Password
   - **Body**: Use the template below

```
Hi %DISPLAY_NAME%,

We received a request to reset your password for Unity Mentorship Hub.

Click here to reset your password:
%LINK%

This link expires in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
Unity Mentorship Hub Team
```

### 2. Tell Users to Check Spam
✅ Already done - Updated success message to mention spam folder

### 3. Whitelist Instructions
Add this to your modal:

"If you don't see the email:
1. Check your spam/junk folder
2. Add noreply@unity-mentorship-hub-ca76e.firebaseapp.com to contacts
3. Wait a few minutes and try again"

## Long-term Solutions

### Option A: Custom Domain Email (Recommended)
1. Get a custom domain (e.g., unitymentor.com)
2. Set up email service (SendGrid, Mailgun, AWS SES)
3. Configure SPF, DKIM, DMARC records
4. Use Firebase Cloud Functions to send custom emails

**Cost**: $5-20/month for email service

### Option B: Use Firebase Extensions
1. Install "Trigger Email" extension
2. Configure with SendGrid/Mailgun
3. Customize email templates
4. Better deliverability

**Cost**: Free tier available

### Option C: Custom Email Handler
Use the function created in `functions/sendCustomPasswordReset.js`:

1. Install dependencies:
```bash
cd functions
npm install nodemailer
```

2. Set environment variables:
```bash
firebase functions:config:set email.user="your@gmail.com" email.password="app-password"
```

3. Deploy function:
```bash
firebase deploy --only functions
```

4. Update Login.tsx to call custom function instead

## Why Emails Go to Spam

1. **Generic sender domain**: Firebase uses `firebaseapp.com`
2. **No email authentication**: Missing SPF/DKIM/DMARC
3. **Shared IP reputation**: Many apps use same Firebase IPs
4. **Generic content**: Automated emails trigger spam filters
5. **No custom domain**: Not from your own domain

## Immediate Actions

### For Users:
1. Check spam folder
2. Mark as "Not Spam"
3. Add sender to contacts
4. Create filter to always allow

### For You:
1. ✅ Customize Firebase template (do this now)
2. ✅ Update success message to mention spam
3. Consider custom domain for production
4. Monitor email deliverability

## Testing Email Deliverability

Test with different providers:
- Gmail
- Outlook/Hotmail
- Yahoo
- ProtonMail
- Custom domains

## Production Checklist

- [ ] Customize Firebase email template
- [ ] Add custom domain
- [ ] Set up SPF records
- [ ] Set up DKIM
- [ ] Set up DMARC
- [ ] Use professional email service
- [ ] Monitor bounce rates
- [ ] Test with multiple providers

## Quick Deploy

After customizing Firebase template:
```bash
npm run build
firebase deploy --only hosting
```

No code changes needed - just update the template in Firebase Console!
