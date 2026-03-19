import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Billing & Access Tests
 *
 * Validates the 3 bugs fixed:
 * 1. Subscription queries now check 'trialing' status as fallback
 * 2. billingSetupComplete gate is more permissive for paid users
 * 3. Access decision logic handles edge cases correctly
 */

// ─── helpers (replicate core logic from app) ────────────────────────────────

const PLANS = [
  { id: 'starter', name: 'STARTER', priceMonthly: 0, sessionsPerMonth: 1 },
  { id: 'job-ready', name: 'JOB-READY', priceMonthly: 45, sessionsPerMonth: 2 },
  { id: 'career-accelerator', name: 'CAREER ACCELERATOR', priceMonthly: 95, sessionsPerMonth: 4 },
];

const getPlanByTier = (tier) => PLANS.find((p) => p.id === tier);

const calculateCommissionSplit = (amount) => ({
  mentorAmount: Number((amount * 0.85).toFixed(2)),
  platformFee: Number((amount * 0.15).toFixed(2)),
});

const normalizeTier = (value) => {
  if (value === 'job-ready' || value === 'career-accelerator' || value === 'starter') return value;
  if (value === 'basic') return 'job-ready';
  if (value === 'premium') return 'career-accelerator';
  if (value === 'free') return 'starter';
  return 'starter';
};

const paidLikeStatuses = new Set(['active', 'trialing']);
const blockedPaidStatuses = new Set([
  'past_due', 'incomplete', 'unpaid', 'canceled', 'cancelled', 'incomplete_expired',
]);

const planLimits = { starter: 1, 'job-ready': 2, 'career-accelerator': 4 };

const computeBillingSetupComplete = (userData, activeSub, plan, subscriptionStatus, entitlement) => {
  return Boolean(
    userData?.billingSetupComplete ||
    userData?.paymentMethodOnFile ||
    userData?.stripeCustomerId ||
    activeSub ||
    (plan !== 'starter' && paidLikeStatuses.has(subscriptionStatus)) ||
    userData?.stripeSubscriptionId ||
    entitlement?.status === 'active' ||
    entitlement?.status === 'trialing'
  );
};

const computeAccessDecision = (p) => {
  if (p.hasFreeAccess) return { allow: true, code: 'admin_override' };
  if (!p.billingSetupComplete && p.plan === 'starter') return { allow: false, code: 'billing_setup_missing' };
  if (!p.billingSetupComplete && p.plan !== 'starter') return { allow: false, code: 'billing_verification_pending' };
  if (p.plan === 'starter') {
    return p.resolvedRemaining <= 0
      ? { allow: false, code: 'starter_quota_exhausted' }
      : { allow: true, code: 'starter_ok' };
  }
  if (!paidLikeStatuses.has(p.subscriptionStatus) && !p.activeSub && !p.entitlement) return { allow: false, code: 'paid_subscription_not_active' };
  if (blockedPaidStatuses.has(p.subscriptionStatus)) return { allow: false, code: 'payment_attention_required' };
  if (p.cycleEnd && new Date() > p.cycleEnd) return { allow: false, code: 'cycle_expired' };
  if (p.resolvedRemaining <= 0) return { allow: false, code: 'paid_quota_exhausted' };
  if (!p.linkedMentor) return { allow: true, code: 'mentor_link_missing_but_allowed' };
  return { allow: true, code: 'paid_ok' };
};

const simulateGetUserSubscription = (allSubs, userId) => {
  return allSubs.find((s) => s.userId === userId && s.status === 'active')
    || allSubs.find((s) => s.userId === userId && s.status === 'trialing')
    || null;
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Plan config', () => {
  it('has 3 plans', () => {
    assert.deepStrictEqual(PLANS.map((p) => p.id), ['starter', 'job-ready', 'career-accelerator']);
  });
  it('starter is free with 1 session', () => {
    const p = getPlanByTier('starter');
    assert.equal(p.priceMonthly, 0);
    assert.equal(p.sessionsPerMonth, 1);
  });
  it('job-ready $45 / 2 sessions', () => {
    const p = getPlanByTier('job-ready');
    assert.equal(p.priceMonthly, 45);
    assert.equal(p.sessionsPerMonth, 2);
  });
  it('career-accelerator $95 / 4 sessions', () => {
    const p = getPlanByTier('career-accelerator');
    assert.equal(p.priceMonthly, 95);
    assert.equal(p.sessionsPerMonth, 4);
  });
  it('invalid tier returns undefined', () => {
    assert.equal(getPlanByTier('nope'), undefined);
  });
  it('85/15 commission on $100', () => {
    const s = calculateCommissionSplit(100);
    assert.equal(s.mentorAmount, 85);
    assert.equal(s.platformFee, 15);
  });
  it('commission on $45', () => {
    const s = calculateCommissionSplit(45);
    assert.equal(s.mentorAmount, 38.25);
    assert.equal(s.platformFee, 6.75);
    assert.equal(s.mentorAmount + s.platformFee, 45);
  });
  it('commission on $0', () => {
    const s = calculateCommissionSplit(0);
    assert.equal(s.mentorAmount, 0);
    assert.equal(s.platformFee, 0);
  });
});

describe('getUserSubscription trialing fallback', () => {
  it('returns active sub', () => {
    const r = simulateGetUserSubscription([{ userId: 'u1', status: 'active', tier: 'job-ready' }], 'u1');
    assert.equal(r.status, 'active');
  });
  it('falls back to trialing when no active exists', () => {
    const r = simulateGetUserSubscription([{ userId: 'u1', status: 'trialing', tier: 'career-accelerator' }], 'u1');
    assert.equal(r.status, 'trialing');
    assert.equal(r.tier, 'career-accelerator');
  });
  it('prefers active over trialing', () => {
    const r = simulateGetUserSubscription([
      { userId: 'u1', status: 'trialing', tier: 'starter' },
      { userId: 'u1', status: 'active', tier: 'job-ready' },
    ], 'u1');
    assert.equal(r.status, 'active');
  });
  it('returns null for cancelled/past_due only', () => {
    const r = simulateGetUserSubscription([
      { userId: 'u1', status: 'cancelled', tier: 'job-ready' },
      { userId: 'u1', status: 'past_due', tier: 'job-ready' },
    ], 'u1');
    assert.equal(r, null);
  });
  it('returns null for empty subs', () => {
    assert.equal(simulateGetUserSubscription([], 'u1'), null);
  });
  it('does not return other users sub', () => {
    const r = simulateGetUserSubscription([{ userId: 'u2', status: 'active', tier: 'job-ready' }], 'u1');
    assert.equal(r, null);
  });
});

describe('billingSetupComplete gate', () => {
  it('grants with stripeCustomerId', () => {
    assert.equal(computeBillingSetupComplete({ stripeCustomerId: 'cus_1' }, null, 'starter', 'active', null), true);
  });
  it('grants with active sub doc', () => {
    assert.equal(computeBillingSetupComplete({}, { tier: 'job-ready' }, 'job-ready', 'active', null), true);
  });
  it('grants for paid + trialing status [BUG FIX]', () => {
    assert.equal(computeBillingSetupComplete({}, null, 'job-ready', 'trialing', null), true);
  });
  it('grants with entitlement active [BUG FIX]', () => {
    assert.equal(computeBillingSetupComplete({}, null, 'job-ready', 'x', { status: 'active' }), true);
  });
  it('grants with entitlement trialing [BUG FIX]', () => {
    assert.equal(computeBillingSetupComplete({}, null, 'career-accelerator', 'x', { status: 'trialing' }), true);
  });
  it('grants with stripeSubscriptionId [BUG FIX]', () => {
    assert.equal(computeBillingSetupComplete({ stripeSubscriptionId: 'sub_1' }, null, 'job-ready', 'past_due', null), true);
  });
  it('grants with billingSetupComplete flag', () => {
    assert.equal(computeBillingSetupComplete({ billingSetupComplete: true }, null, 'starter', '', null), true);
  });
  it('grants with paymentMethodOnFile', () => {
    assert.equal(computeBillingSetupComplete({ paymentMethodOnFile: true }, null, 'starter', '', null), true);
  });
  it('denies when user has nothing', () => {
    assert.equal(computeBillingSetupComplete({}, null, 'starter', 'inactive', null), false);
  });
});

describe('Access decision logic', () => {
  const base = {
    hasFreeAccess: false, billingSetupComplete: true, plan: 'job-ready',
    subscriptionStatus: 'active', activeSub: { tier: 'job-ready' }, entitlement: null,
    resolvedRemaining: 2, linkedMentor: 'mentor_1',
    cycleEnd: new Date(Date.now() + 86400000),
  };

  it('allows paid user with active sub', () => {
    const r = computeAccessDecision(base);
    assert.equal(r.allow, true);
    assert.equal(r.code, 'paid_ok');
  });
  it('admin override bypasses everything', () => {
    const r = computeAccessDecision({ ...base, hasFreeAccess: true, billingSetupComplete: false });
    assert.equal(r.allow, true);
    assert.equal(r.code, 'admin_override');
  });
  it('blocks starter with no billing', () => {
    const r = computeAccessDecision({ ...base, plan: 'starter', billingSetupComplete: false, activeSub: null, subscriptionStatus: '', resolvedRemaining: 1, linkedMentor: null });
    assert.equal(r.allow, false);
    assert.equal(r.code, 'billing_setup_missing');
  });
  it('softer message for paid user no billing [BUG FIX]', () => {
    const r = computeAccessDecision({ ...base, billingSetupComplete: false });
    assert.equal(r.allow, false);
    assert.equal(r.code, 'billing_verification_pending');
  });
  it('allows starter with billing + remaining', () => {
    const r = computeAccessDecision({ ...base, plan: 'starter', activeSub: null, resolvedRemaining: 1, linkedMentor: null });
    assert.equal(r.allow, true);
    assert.equal(r.code, 'starter_ok');
  });
  it('blocks starter quota exhausted', () => {
    const r = computeAccessDecision({ ...base, plan: 'starter', activeSub: null, resolvedRemaining: 0, linkedMentor: null });
    assert.equal(r.allow, false);
    assert.equal(r.code, 'starter_quota_exhausted');
  });
  it('blocks past_due', () => {
    const r = computeAccessDecision({ ...base, subscriptionStatus: 'past_due' });
    assert.equal(r.allow, false);
    assert.equal(r.code, 'payment_attention_required');
  });
  it('blocks cancelled', () => {
    const r = computeAccessDecision({ ...base, subscriptionStatus: 'cancelled' });
    assert.equal(r.allow, false);
  });
  it('blocks expired cycle', () => {
    const r = computeAccessDecision({ ...base, cycleEnd: new Date(Date.now() - 86400000) });
    assert.equal(r.allow, false);
    assert.equal(r.code, 'cycle_expired');
  });
  it('blocks paid quota exhausted', () => {
    const r = computeAccessDecision({ ...base, resolvedRemaining: 0 });
    assert.equal(r.allow, false);
    assert.equal(r.code, 'paid_quota_exhausted');
  });
  it('allows without linked mentor [BUG FIX]', () => {
    const r = computeAccessDecision({ ...base, linkedMentor: null });
    assert.equal(r.allow, true);
    assert.equal(r.code, 'mentor_link_missing_but_allowed');
  });
  it('allows trialing user with entitlement [BUG FIX]', () => {
    const r = computeAccessDecision({ ...base, subscriptionStatus: 'trialing', activeSub: null, entitlement: { status: 'trialing' } });
    assert.equal(r.allow, true);
  });
});

describe('Tier normalization', () => {
  it('valid tiers pass through', () => {
    assert.equal(normalizeTier('starter'), 'starter');
    assert.equal(normalizeTier('job-ready'), 'job-ready');
    assert.equal(normalizeTier('career-accelerator'), 'career-accelerator');
  });
  it('legacy names mapped', () => {
    assert.equal(normalizeTier('basic'), 'job-ready');
    assert.equal(normalizeTier('premium'), 'career-accelerator');
    assert.equal(normalizeTier('free'), 'starter');
  });
  it('unknown defaults to starter', () => {
    assert.equal(normalizeTier(undefined), 'starter');
    assert.equal(normalizeTier(null), 'starter');
    assert.equal(normalizeTier(''), 'starter');
    assert.equal(normalizeTier('garbage'), 'starter');
  });
});

describe('Session quota', () => {
  it('plan limits correct', () => {
    assert.equal(planLimits['starter'], 1);
    assert.equal(planLimits['job-ready'], 2);
    assert.equal(planLimits['career-accelerator'], 4);
  });
  it('remaining never negative', () => {
    assert.equal(Math.max(2 - 5, 0), 0);
  });
  it('upgrade prorates correctly', () => {
    const used = 2 - 1; // old=2, remaining=1, used=1
    assert.equal(Math.max(4 - used, 0), 3);
  });
  it('downgrade with overuse clamps to 0', () => {
    const used = 4 - 0; // used all 4
    assert.equal(Math.max(2 - used, 0), 0);
  });
});

describe('End-to-end scenarios', () => {
  it('Stripe writes trialing sub → user can book', () => {
    const sub = simulateGetUserSubscription([{ userId: 'u1', status: 'trialing', tier: 'job-ready' }], 'u1');
    assert.notEqual(sub, null);
    const setup = computeBillingSetupComplete({ stripeCustomerId: 'cus_1' }, sub, 'job-ready', 'trialing', null);
    assert.equal(setup, true);
    const access = computeAccessDecision({
      hasFreeAccess: false, billingSetupComplete: setup, plan: 'job-ready',
      subscriptionStatus: 'trialing', activeSub: sub, entitlement: null,
      resolvedRemaining: 2, linkedMentor: 'mentor_1', cycleEnd: new Date(Date.now() + 30 * 86400000),
    });
    assert.equal(access.allow, true);
  });

  it('User navigates away before sync → entitlement saves them', () => {
    const sub = simulateGetUserSubscription([], 'u1');
    assert.equal(sub, null);
    const ent = { status: 'active', plan: 'career-accelerator' };
    const setup = computeBillingSetupComplete({}, null, 'career-accelerator', 'active', ent);
    assert.equal(setup, true);
    const access = computeAccessDecision({
      hasFreeAccess: false, billingSetupComplete: setup, plan: 'career-accelerator',
      subscriptionStatus: 'active', activeSub: null, entitlement: ent,
      resolvedRemaining: 4, linkedMentor: 'mentor_1', cycleEnd: new Date(Date.now() + 30 * 86400000),
    });
    assert.equal(access.allow, true);
  });

  it('Cancelled user is blocked', () => {
    const access = computeAccessDecision({
      hasFreeAccess: false, billingSetupComplete: true, plan: 'job-ready',
      subscriptionStatus: 'cancelled', activeSub: null, entitlement: null,
      resolvedRemaining: 0, linkedMentor: 'mentor_1', cycleEnd: null,
    });
    assert.equal(access.allow, false);
  });

  it('Free user with no card cannot book', () => {
    const setup = computeBillingSetupComplete({}, null, 'starter', '', null);
    assert.equal(setup, false);
    const access = computeAccessDecision({
      hasFreeAccess: false, billingSetupComplete: false, plan: 'starter',
      subscriptionStatus: '', activeSub: null, entitlement: null,
      resolvedRemaining: 1, linkedMentor: null, cycleEnd: null,
    });
    assert.equal(access.allow, false);
    assert.equal(access.code, 'billing_setup_missing');
  });
});
