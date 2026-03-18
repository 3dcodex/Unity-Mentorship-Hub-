# Changelog

## [Unreleased]

### Email Verification Enforcement
- Signup signs out user immediately — must verify email before accessing app
- Login blocks unverified emails with resend verification button
- ProtectedLayout gates all protected routes behind `emailVerified` check

### Mobile Responsiveness
- SessionHistory: responsive stat cards, compact action buttons, smaller avatars on mobile
- MentorshipBooking: responsive headers, padding, access denied page scales down
- Mentorship: removed duplicate Tailwind classes, responsive buttons/padding/image heights
- ProfileSettings: responsive header sizing
- AdminDashboard & DashboardByRole: responsive grid, padding, text sizes

### Billing System
- Single source of truth for subscription plans in `src/config/subscriptionPlans.ts`
- PaymentManagement: correct Firestore collection, commission rate fix (10%), real Stripe refund via Cloud Function
- Billing: shared config import, polling retry for post-checkout sync, starter plan direct switch
- BillingCheckout: shared config, starter redirect, plan name display
- ManageSubscription: shared config, status badge styling
- subscriptionService: filtered query for stats, proration for tier changes

### Security
- AdminRoute guard on all admin pages
- Password reset rate limiting and reCAPTCHA support
- Suspended account blocking on login (email + OAuth)

### Features
- Real-time presence tracking (online/offline status)
- Video/voice call initiation with WebRTC setup
- Session booking with recurring options, mentor linking, quota enforcement
- Mentor application flow with focus area tags and admin approval
- Community groups, feeds, discussion threads
- Career tools: resume builder, mock interviews, cover letter templates
- Multi-language support (EN, FR, ES) and dark mode
- Cookie consent banner

---

## Setup

### Prerequisites
- Node.js 18+, npm, Firebase CLI
- Firebase project with Firestore, Auth, Storage, Functions enabled

### Install & Run
```bash
git clone <repo-url>
cd unitymentor-hub
npm install
cp .env.example .env.local   # fill in Firebase + Stripe + Gemini keys
npm run dev                   # http://localhost:5173
```

### Environment Variables
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_GEMINI_API_KEY=
VITE_RECAPTCHA_SITE_KEY=       # optional
```

### Deploy
```bash
npm run build
firebase deploy --only hosting              # hosting only
firebase deploy --only firestore:rules      # Firestore rules
firebase deploy --only database             # Realtime DB rules
firebase deploy --only functions            # Cloud Functions
firebase deploy --only hosting,firestore:rules,database  # combo
```

### OAuth Setup
1. Firebase Console → Authentication → Sign-in method → Enable Google
2. Enable Microsoft provider (for LinkedIn)
3. Add authorized domains: production URL + localhost

### Gemini AI (Mock Interviews)
- Get key from https://makersuite.google.com/app/apikey
- Set `VITE_GEMINI_API_KEY` in `.env.local`
- Falls back to preset questions if key missing

### Project Structure
```
├── components/       # Reusable UI components
├── contexts/         # Theme, Language contexts
├── functions/        # Firebase Cloud Functions
├── hooks/            # Custom React hooks
├── pages/            # All page components
│   ├── admin/        # Admin dashboard pages
│   ├── career/       # Career tools
│   ├── community/    # Community features
│   ├── resources/    # Resource pages
│   └── support/      # Help & support
├── services/         # Business logic / Firestore queries
├── src/config/       # Subscription plans, Stripe config
├── types.ts          # TypeScript types
└── App.tsx           # Routes & auth context
```
