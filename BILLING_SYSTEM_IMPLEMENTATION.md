# Unity Mentorship Hub - Complete Billing System Implementation

## 🎯 Business Model

### Student Subscription Tiers

#### 1. STARTER (FREE)
- **Price:** $0
- **Features:**
  - 1 Career Clarity Session (one-time)
  - Industry pathway discussion
  - Skills gap identification
  - Job-readiness assessment
  - Mentor matching guidance
- **Goal:** Build trust, no pressure

#### 2. JOB-READY (Most Popular)
- **Price:** $45/month
- **Features:**
  - Biweekly 1-on-1 mentorship sessions (2 per month)
  - CV & LinkedIn optimization
  - Target job strategy planning
  - Interview preparation
  - Application review & feedback
  - Industry resources & hiring tips
  - FREE monthly networking event access
  - Job application accountability
- **Outcome:** Fully prepared for employment

#### 3. CAREER ACCELERATOR
- **Price:** $95/month
- **Features:**
  - Everything in Job-Ready PLUS:
  - Weekly mentorship sessions (4 per month)
  - Personalized career strategy plan
  - Advanced CV & portfolio review
  - Intensive mock interviews
  - Priority mentor access
  - Referral & industry introduction support (when available)
  - VIP networking access
- **Outcome:** Compete confidently for jobs

### Mentor Commission Model
- Mentors join **FREE**
- **15% UMH commission** on all paid subscriptions
- **85% goes to mentor**
- Monthly payouts via Stripe Connect
- Transparent earnings dashboard

---

## 📊 Current State Analysis

### ✅ What Exists (in pages/Billing.tsx)
- Basic subscription UI (Free/Basic/Premium)
- Simple plan selection
- Payment methods placeholder
- Transaction history viewer
- Basic payment intent creation
- Session-based payment flow

### ❌ What's Missing
1. **Stripe Integration:**
   - No actual Stripe API calls
   - No Stripe Checkout
   - No webhook handlers
   - No subscription management
   - No Connect for mentor payouts

2. **Database Schema:**
   - No subscriptions collection
   - No proper payment tracking
   - No mentor payout records
   - No session quota tracking

3. **Business Logic:**
   - No 85/15 commission split
   - No recurring billing
   - No session consumption tracking
   - No automatic renewals
   - No failed payment handling

4. **Mentor Features:**
   - No earnings dashboard
   - No payout requests
   - No commission tracking

5. **Admin Features:**
   - No revenue analytics
   - No payout management
   - No subscription administration

---

## 🏗️ Implementation Plan

### Phase 1: Database Schema & TypeScript Types (2 days)

#### New Firestore Collections

```typescript
// subscriptions/
interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  mentorId: string;
  mentorName: string;
  tier: 'starter' | 'job-ready' | 'career-accelerator';
  status: 'active' | 'cancelled' | 'past_due' | 'paused';
  priceMonthly: number; // 0, 45, 95
  sessionsPerMonth: number; // 1, 2, 4
  sessionsRemaining: number;
  
  // Stripe data
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  
  // Billing period
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  billingCycleAnchor: Timestamp;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastPaymentDate?: Timestamp;
}

// payments/
interface Payment {
  id: string;
  subscriptionId: string;
  userId: string;
  userName: string;
  mentorId: string;
  mentorName: string;
  
  // Amounts
  totalAmount: number; // Full subscription price
  mentorAmount: number; // 85%
  platformFee: number; // 15%
  
  // Stripe
  stripePaymentIntentId: string;
  stripeChargeId: string;
  
  // Status
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  failureReason?: string;
  
  // Period
  billingPeriodStart: Timestamp;
  billingPeriodEnd: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
  paidAt?: Timestamp;
}

// mentorPayouts/
interface MentorPayout {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  
  // Amounts
  totalAmount: number; // Sum of all mentorAmount from payments
  paymentIds: string[]; // References to payment documents
  subscriptionCount: number;
  
  // Stripe Connect
  stripeConnectedAccountId: string;
  stripePayoutId?: string;
  stripeDestination?: string; // bank account
  
  // Status
  status: 'pending' | 'processing' | 'paid' | 'failed';
  failureReason?: string;
  
  // Dates
  periodStart: Timestamp;
  periodEnd: Timestamp;
  scheduledDate: Timestamp;
  paidDate?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// sessionBookings/ (enhancement to existing)
interface SessionBooking {
  // ... existing fields ...
  subscriptionId?: string; // Link to subscription
  deductedFromQuota: boolean;
  quotaDeductedAt?: Timestamp;
}
```

#### Update existing types.ts
Add these interfaces to your types file.

---

### Phase 2: Stripe Setup (3 days)

#### 2.1 Install Dependencies
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
npm install --save-dev @types/stripe
```

#### 2.2 Environment Variables
```env
# .env (root level)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 2.3 Create Stripe Products & Prices
In Stripe Dashboard or via script:
- Product: "Starter Tier" → Price: $0/month
- Product: "Job-Ready Tier" → Price: $45/month (set as default)
- Product: "Career Accelerator Tier" → Price: $95/month

#### 2.4 Stripe Connect for Mentors
- Enable Stripe Connect
- Create onboarding flow for mentors
- Store `stripeConnectedAccountId` in mentor profile

---

### Phase 3: Subscription Service (4 days)

#### 3.1 Create services/subscriptionService.ts

```typescript
import { db } from '../src/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const subscriptionService = {
  // Create new subscription
  async createSubscription(
    userId: string,
    mentorId: string,
    tier: 'starter' | 'job-ready' | 'career-accelerator'
  ) {
    // 1. Get user and mentor data
    const userDoc = await getDoc(doc(db, 'users', userId));
    const mentorDoc = await getDoc(doc(db, 'users', mentorId));
    
    if (!userDoc.exists() || !mentorDoc.exists()) {
      throw new Error('User or mentor not found');
    }
    
    const user = userDoc.data();
    const mentor = mentorDoc.data();
    
    // 2. Determine subscription details
    const tierConfig = {
      'starter': { price: 0, sessions: 1, stripePriceId: null },
      'job-ready': { price: 45, sessions: 2, stripePriceId: 'price_xxx' },
      'career-accelerator': { price: 95, sessions: 4, stripePriceId: 'price_yyy' }
    };
    
    const config = tierConfig[tier];
    
    // 3. Create Stripe subscription (if paid tier)
    let stripeSubscription = null;
    let stripeCustomerId = user.stripeCustomerId;
    
    if (config.price > 0) {
      // Create or retrieve Stripe customer
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId }
        });
        stripeCustomerId = customer.id;
        
        // Update user with customer ID
        await updateDoc(doc(db, 'users', userId), {
          stripeCustomerId
        });
      }
      
      // Create subscription
      stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: config.stripePriceId }],
        metadata: {
          userId,
          mentorId,
          tier
        },
        application_fee_percent: 15, // Platform fee
        transfer_data: {
          destination: mentor.stripeConnectedAccountId, // 85% to mentor
        },
      });
    }
    
    // 4. Create subscription document in Firestore
    const subscriptionRef = doc(collection(db, 'subscriptions'));
    const now = Timestamp.now();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    const subscription = {
      id: subscriptionRef.id,
      userId,
      userName: user.name,
      userEmail: user.email,
      mentorId,
      mentorName: mentor.name,
      tier,
      status: 'active',
      priceMonthly: config.price,
      sessionsPerMonth: config.sessions,
      sessionsRemaining: config.sessions,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscription?.id || null,
      stripePriceId: config.stripePriceId,
      currentPeriodStart: now,
      currentPeriodEnd: Timestamp.fromDate(oneMonthLater),
      billingCycleAnchor: now,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(subscriptionRef, subscription);
    
    return subscription;
  },
  
  // Cancel subscription
  async cancelSubscription(subscriptionId: string, immediate = false) {
    const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
    if (!subDoc.exists()) throw new Error('Subscription not found');
    
    const sub = subDoc.data();
    
    // Cancel in Stripe if paid tier
    if (sub.stripeSubscriptionId) {
      await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: !immediate,
      });
      
      if (immediate) {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      }
    }
    
    // Update Firestore
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      cancelAtPeriodEnd: !immediate,
      status: immediate ? 'cancelled' : sub.status,
      cancelledAt: immediate ? Timestamp.now() : null,
      updatedAt: Timestamp.now(),
    });
  },
  
  // Upgrade/downgrade subscription
  async changeSubscriptionTier(
    subscriptionId: string,
    newTier: 'starter' | 'job-ready' | 'career-accelerator'
  ) {
    // Implementation for tier changes
    // Handle proration, Stripe updates, etc.
  },
  
  // Consume session from quota
  async consumeSession(subscriptionId: string, sessionId: string) {
    const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
    if (!subDoc.exists()) throw new Error('Subscription not found');
    
    const sub = subDoc.data();
    
    if (sub.sessionsRemaining <= 0) {
      throw new Error('No sessions remaining in subscription');
    }
    
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      sessionsRemaining: sub.sessionsRemaining - 1,
      updatedAt: Timestamp.now(),
    });
    
    // Link session to subscription
    await updateDoc(doc(db, 'sessions', sessionId), {
      subscriptionId,
      deductedFromQuota: true,
      quotaDeductedAt: Timestamp.now(),
    });
  },
  
  // Renew subscription (called by webhook or scheduled function)
  async renewSubscription(subscriptionId: string) {
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
    const sub = subDoc.data();
    
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      currentPeriodStart: Timestamp.now(),
      currentPeriodEnd: Timestamp.fromDate(oneMonthLater),
      sessionsRemaining: sub.sessionsPerMonth, // Reset quota
      updatedAt: Timestamp.now(),
    });
  },
};
```

#### 3.2 Create services/paymentService.ts

```typescript
export const paymentService = {
  // Record successful payment
  async recordPayment(
    subscriptionId: string,
    stripePaymentIntentId: string,
    amount: number
  ) {
    const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
    const sub = subDoc.data();
    
    const mentorAmount = amount * 0.85;
    const platformFee = amount * 0.15;
    
    const paymentRef = doc(collection(db, 'payments'));
    const payment = {
      id: paymentRef.id,
      subscriptionId,
      userId: sub.userId,
      userName: sub.userName,
      mentorId: sub.mentorId,
      mentorName: sub.mentorName,
      totalAmount: amount,
      mentorAmount,
      platformFee,
      stripePaymentIntentId,
      status: 'succeeded',
      billingPeriodStart: sub.currentPeriodStart,
      billingPeriodEnd: sub.currentPeriodEnd,
      createdAt: Timestamp.now(),
      paidAt: Timestamp.now(),
    };
    
    await setDoc(paymentRef, payment);
    
    // Update subscription last payment date
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      lastPaymentDate: Timestamp.now(),
    });
    
    return payment;
  },
  
  // Calculate mentor earnings
  async calculateMentorEarnings(mentorId: string, startDate: Date, endDate: Date) {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('mentorId', '==', mentorId),
      where('paidAt', '>=', Timestamp.fromDate(startDate)),
      where('paidAt', '<=', Timestamp.fromDate(endDate)),
      where('status', '==', 'succeeded')
    );
    
    const paymentsSnap = await getDocs(paymentsQuery);
    const payments = paymentsSnap.docs.map(d => d.data());
    
    const totalEarnings = payments.reduce((sum, p) => sum + p.mentorAmount, 0);
    
    return {
      totalEarnings,
      paymentCount: payments.length,
      payments,
    };
  },
};
```

#### 3.3 Create services/payoutService.ts

```typescript
export const payoutService = {
  // Create payout for mentor
  async createPayout(
    mentorId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    const earnings = await paymentService.calculateMentorEarnings(
      mentorId,
      periodStart,
      periodEnd
    );
    
    if (earnings.totalEarnings === 0) {
      throw new Error('No earnings to payout');
    }
    
    const mentorDoc = await getDoc(doc(db, 'users', mentorId));
    const mentor = mentorDoc.data();
    
    if (!mentor.stripeConnectedAccountId) {
      throw new Error('Mentor has not connected Stripe account');
    }
    
    // Create payout in Stripe
    const payout = await stripe.payouts.create({
      amount: Math.round(earnings.totalEarnings * 100), // Convert to cents
      currency: 'usd',
    }, {
      stripeAccount: mentor.stripeConnectedAccountId,
    });
    
    // Record payout in Firestore
    const payoutRef = doc(collection(db, 'mentorPayouts'));
    const payoutDoc = {
      id: payoutRef.id,
      mentorId,
      mentorName: mentor.name,
      mentorEmail: mentor.email,
      totalAmount: earnings.totalEarnings,
      paymentIds: earnings.payments.map(p => p.id),
      subscriptionCount: new Set(earnings.payments.map(p => p.subscriptionId)).size,
      stripeConnectedAccountId: mentor.stripeConnectedAccountId,
      stripePayoutId: payout.id,
      status: 'processing',
      periodStart: Timestamp.fromDate(periodStart),
      periodEnd: Timestamp.fromDate(periodEnd),
      scheduledDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(payoutRef, payoutDoc);
    
    return payoutDoc;
  },
  
  // Process monthly payouts (scheduled function)
  async processMonthlyPayouts() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Get all active mentors
    const mentorsQuery = query(
      collection(db, 'users'),
      where('isMentor', '==', true),
      where('mentorStatus', '==', 'approved')
    );
    
    const mentorsSnap = await getDocs(mentorsQuery);
    
    for (const mentorDoc of mentorsSnap.docs) {
      try {
        await this.createPayout(
          mentorDoc.id,
          lastMonth,
          endOfLastMonth
        );
      } catch (error) {
        console.error(`Failed to create payout for mentor ${mentorDoc.id}:`, error);
      }
    }
  },
};
```

---

### Phase 4: Frontend Components (5 days)

#### 4.1 Enhanced Pricing Page (pages/Pricing.tsx)

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  
  const tiers = [
    {
      name: 'STARTER',
      subtitle: 'Career Clarity Session',
      price: 0,
      period: 'FREE',
      popular: false,
      features: [
        '1 Career Clarity Session',
        'Industry pathway discussion',
        'Skills gap identification',
        'Job-readiness assessment',
        'Mentor matching guidance',
      ],
      cta: 'Get Started',
      color: 'gray',
    },
    {
      name: 'JOB-READY',
      subtitle: 'Structured Employment Preparation',
      price: 45,
      period: 'month',
      popular: true,
      features: [
        'Biweekly 1-on-1 Mentorship (2/month)',
        'CV & LinkedIn Optimization',
        'Target Job Strategy Planning',
        'Interview Preparation',
        'Application Review & Feedback',
        'Industry Resources & Hiring Tips',
        'FREE Monthly Networking Events',
        'Job Application Accountability',
      ],
      cta: 'Start Now',
      color: 'blue',
    },
    {
      name: 'CAREER ACCELERATOR',
      subtitle: 'Fast-Track to Employment',
      price: 95,
      period: 'month',
      popular: false,
      features: [
        'Everything in Job-Ready PLUS:',
        'Weekly Mentorship Sessions (4/month)',
        'Personalized Career Strategy Plan',
        'Advanced CV & Portfolio Review',
        'Intensive Mock Interviews',
        'Priority Mentor Access',
        'Referral & Introduction Support',
        'VIP Networking Access',
      ],
      cta: 'Accelerate Now',
      color: 'purple',
    },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 py-20 px-4">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            💼 CHOOSE YOUR PATH
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
          From Classroom to Career
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
          Structured mentorship that prepares you to get hired.
        </p>
      </div>
      
      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border-2 transition-all hover:scale-105 ${
              tier.popular 
                ? 'border-blue-500 shadow-blue-500/30' 
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-sm shadow-lg">
                ⭐ MOST POPULAR
              </div>
            )}
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                {tier.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {tier.subtitle}
              </p>
              
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black text-gray-900 dark:text-white">
                  ${tier.price}
                </span>
                {tier.period !== 'FREE' && (
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    /{tier.period}
                  </span>
                )}
              </div>
              
              {tier.period === 'FREE' && (
                <span className="inline-block mt-2 px-4 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-bold">
                  No Credit Card Required
                </span>
              )}
            </div>
            
            <ul className="space-y-4 mb-8">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 text-xl flex-shrink-0">
                    check_circle
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => navigate('/signup')}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                tier.popular
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
      
      {/* Mentor CTA */}
      <div className="max-w-4xl mx-auto mt-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-white text-center">
        <h2 className="text-3xl font-black mb-4">
          Become a Mentor
        </h2>
        <p className="text-lg font-medium mb-8">
          Join FREE and earn 85% commission on every student subscription.
        </p>
        <button
          onClick={() => navigate('/become-mentor')}
          className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
        >
          Apply as Mentor
        </button>
      </div>
      
      {/* Trust Signals */}
      <div className="max-w-4xl mx-auto mt-20 text-center">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-2">
              500+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Students Placed
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-purple-600 dark:text-purple-400 mb-2">
              150+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Expert Mentors
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-green-600 dark:text-green-400 mb-2">
              92%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Job Success Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
```

#### 4.2 Subscription Dashboard (pages/SubscriptionDashboard.tsx)

Create a component where students can:
- View current subscription
- See sessions remaining
- Upgrade/downgrade
- Cancel subscription
- View billing history

#### 4.3 Mentor Earnings Dashboard (pages/MentorEarnings.tsx)

Create a component where mentors can:
- View total earnings
- See earnings by month
- Track active students
- View commission breakdown
- Request payout
- See payout history

---

### Phase 5: Firebase Functions & Webhooks (4 days)

#### 5.1 Stripe Webhook Handler (functions/stripeWebhook.js)

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = functions.config().stripe.webhook_secret;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle different event types
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    case 'payout.paid':
      await handlePayoutPaid(event.data.object);
      break;
      
    case 'payout.failed':
      await handlePayoutFailed(event.data.object);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
});

async function handlePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  const amountPaid = invoice.amount_paid / 100; // Convert from cents
  
  // Find subscription in Firestore
  const subsSnapshot = await admin.firestore()
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .get();
  
  if (subsSnapshot.empty) {
    console.error('Subscription not found for invoice:', invoice.id);
    return;
  }
  
  const subDoc = subsSnapshot.docs[0];
  const subscription = subDoc.data();
  
  // Calculate commission split
  const mentorAmount = amountPaid * 0.85;
  const platformFee = amountPaid * 0.15;
  
  // Record payment
  await admin.firestore().collection('payments').add({
    subscriptionId: subDoc.id,
    userId: subscription.userId,
    userName: subscription.userName,
    mentorId: subscription.mentorId,
    mentorName: subscription.mentorName,
    totalAmount: amountPaid,
    mentorAmount,
    platformFee,
    stripePaymentIntentId: invoice.payment_intent,
    stripeChargeId: invoice.charge,
    status: 'succeeded',
    billingPeriodStart: admin.firestore.Timestamp.fromDate(
      new Date(invoice.period_start * 1000)
    ),
    billingPeriodEnd: admin.firestore.Timestamp.fromDate(
      new Date(invoice.period_end * 1000)
    ),
    createdAt: admin.firestore.Timestamp.now(),
    paidAt: admin.firestore.Timestamp.now(),
  });
  
  // Renew subscription (reset session quota)
  await admin.firestore()
    .collection('subscriptions')
    .doc(subDoc.id)
    .update({
      sessionsRemaining: subscription.sessionsPerMonth,
      currentPeriodStart: admin.firestore.Timestamp.fromDate(
        new Date(invoice.period_start * 1000)
      ),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(
        new Date(invoice.period_end * 1000)
      ),
      lastPaymentDate: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  
  // Send notification
  await admin.firestore().collection('notifications').add({
    userId: subscription.userId,
    type: 'payment',
    title: 'Payment Successful',
    message: `Your ${subscription.tier} subscription has been renewed for $${amountPaid}`,
    read: false,
    createdAt: admin.firestore.Timestamp.now(),
    actionUrl: '/subscription',
  });
}

async function handlePaymentFailed(invoice) {
  // Handle failed payment
  // - Notify user
  // - Mark subscription as past_due
  // - Send recovery email
}
```

#### 5.2 Scheduled Payout Function (functions/scheduledPayouts.js)

```javascript
exports.processMonthlyPayouts = functions.pubsub
  .schedule('0 0 1 * *') // Run on 1st of every month at midnight
  .onRun(async (context) => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    
    const endOfLastMonth = new Date();
    endOfLastMonth.setDate(0);
    
    // Get all active mentors
    const mentorsSnapshot = await admin.firestore()
      .collection('users')
      .where('isMentor', '==', true)
      .where('mentorStatus', '==', 'approved')
      .get();
    
    for (const mentorDoc of mentorsSnapshot.docs) {
      try {
        await createMentorPayout(mentorDoc.id, lastMonth, endOfLastMonth);
      } catch (error) {
        console.error(`Payout failed for mentor ${mentorDoc.id}:`, error);
      }
    }
  });
```

---

### Phase 6: Testing & Deployment (3 days)

#### 6.1 Test Scenarios
- ✅ Free tier signup (no payment)
- ✅ Paid tier subscription
- ✅ Session booking with quota deduction
- ✅ Subscription renewal
- ✅ Failed payment handling
- ✅ Subscription cancellation
- ✅ Upgrade/downgrade between tiers
- ✅ Mentor payout calculation
- ✅ Payout processing

#### 6.2 Stripe Test Mode
Use test cards:
- `4242 4242 4242 4242` (success)
- `4000 0000 0000 9995` (decline)

#### 6.3 Deploy Functions
```bash
firebase deploy --only functions
```

---

## 📈 Success Metrics

### Key Performance Indicators (KPIs)
1. **Conversion Rate:** Free → Paid tier
2. **Churn Rate:** Monthly subscription cancellations
3. **Average Revenue Per User (ARPU)**
4. **Mentor Retention:** Active mentors month-over-month
5. **Session Completion Rate**

### Target Metrics (Year 1)
- 1000+ active subscriptions
- 30% conversion from free to paid
- <10% monthly churn
- 200+ active mentors
- $50K+ monthly recurring revenue

---

## 🚀 Go-Live Checklist

### Before Launch:
- [ ] Stripe account verified
- [ ] All products/prices created in Stripe
- [ ] Webhook endpoints configured
- [ ] Firebase Functions deployed
- [ ] Database indexes created
- [ ] Test all payment flows
- [ ] Legal pages (Terms, Privacy, Refund Policy)
- [ ] Customer support email setup
- [ ] Monitoring & alerting configured

### Post-Launch:
- [ ] Monitor Stripe Dashboard daily
- [ ] Track failed payments
- [ ] Review payout accuracy
- [ ] Collect user feedback
- [ ] Optimize conversion funnel
- [ ] A/B test pricing tiers

---

## 💡 Future Enhancements

1. **Annual Subscription Discount** (save 20%)
2. **Referral Program** (get 1 month free)
3. **Corporate Packages** (bulk licenses for universities)
4. **Gift Subscriptions**
5. **Scholarship Program** (free tier for eligible students)
6. **In-app wallet** (credits system)
7. **Mentor availability calendar**
8. **Automated session scheduling**
9. **Video integration** (Zoom/Meet API)
10. **Advanced analytics dashboard**

---

## 📞 Support & Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Connect Guide:** https://stripe.com/docs/connect
- **Firebase Functions:** https://firebase.google.com/docs/functions
- **Subscription Best Practices:** https://stripe.com/guides/subscriptions

---

**Total Estimated Development Time:** 3-4 weeks (1 senior developer)

**Tech Stack:**
- React + TypeScript
- Firebase (Firestore, Functions)
- Stripe (Payments, Subscriptions, Connect)
- TailwindCSS

**Status:** ✅ Implementation plan complete. Ready to build.
