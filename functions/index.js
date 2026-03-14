const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');

admin.initializeApp();

const getStripeClient = () => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Missing STRIPE_SECRET_KEY in function environment variables'
        );
    }

    return new Stripe(stripeSecretKey);
};

const getTierConfig = (tier) => {
    const tiers = {
        starter: { sessionsPerMonth: 1, priceMonthly: 0 },
        'job-ready': { sessionsPerMonth: 2, priceMonthly: 45 },
        'career-accelerator': { sessionsPerMonth: 4, priceMonthly: 95 },
    };

    return tiers[tier] || null;
};

const calculateCommissionSplit = (totalAmount) => {
    const mentorAmount = Number((totalAmount * 0.85).toFixed(2));
    const platformFee = Number((totalAmount - mentorAmount).toFixed(2));

    return { mentorAmount, platformFee };
};

exports.adminResetPassword = functions.https.onCall(async(data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid, newPassword } = data;

    // Verify admin role
    const adminDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const adminRole = adminDoc.data() ? .role;

    if (!['admin', 'super_admin'].includes(adminRole)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can reset passwords');
    }

    // Validate password
    if (!newPassword || newPassword.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters');
    }

    try {
        // Update user password
        await admin.auth().updateUser(uid, {
            password: newPassword
        });

        // Log admin action
        await admin.firestore().collection('adminActions').add({
            adminId: context.auth.uid,
            adminEmail: context.auth.token.email,
            action: 'reset_password',
            targetUserId: uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: 'Password reset successfully' };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.adminChangeEmail = functions.https.onCall(async(data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid, newEmail } = data;

    // Verify admin role
    const adminDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const adminRole = adminDoc.data() ? .role;

    if (!['admin', 'super_admin'].includes(adminRole)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can change user emails');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid email address');
    }

    try {
        // Get old email for logging
        const userRecord = await admin.auth().getUser(uid);
        const oldEmail = userRecord.email;

        // Update user email in Firebase Auth
        await admin.auth().updateUser(uid, {
            email: newEmail,
            emailVerified: false // Require re-verification
        });

        // Update email in Firestore
        await admin.firestore().collection('users').doc(uid).update({
            email: newEmail,
            emailChangedBy: context.auth.uid,
            emailChangedAt: admin.firestore.FieldValue.serverTimestamp(),
            oldEmail: oldEmail
        });

        // Log admin action
        await admin.firestore().collection('adminActions').add({
            adminId: context.auth.uid,
            adminEmail: context.auth.token.email,
            action: 'change_email',
            targetUserId: uid,
            details: JSON.stringify({ oldEmail, newEmail }),
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send notification to user
        await admin.firestore().collection('notifications').add({
            userId: uid,
            title: 'Email Address Changed',
            message: `Your email has been changed from ${oldEmail} to ${newEmail} by an administrator. Please verify your new email.`,
            type: 'warning',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: 'Email changed successfully', oldEmail, newEmail };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.createStripeCheckoutSession = functions.https.onCall(async(data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { tier, mentorId, priceId, successUrl, cancelUrl } = data || {};

    if (!tier || !mentorId || !priceId || !successUrl || !cancelUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing checkout session parameters');
    }

    const tierConfig = getTierConfig(tier);
    if (!tierConfig || tierConfig.priceMonthly <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid paid subscription tier');
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(context.auth.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found');
    }

    const mentorDoc = await db.collection('users').doc(mentorId).get();
    if (!mentorDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Mentor profile not found');
    }

    const mentorData = mentorDoc.data();
    if (!mentorData ? .isMentor || mentorData ? .mentorStatus !== 'approved' || mentorData ? .mentorApplicationVersion !== 2) {
        throw new functions.https.HttpsError('failed-precondition', 'Selected mentor is not approved');
    }

    const userData = userDoc.data();
    const stripe = getStripeClient();

    let stripeCustomerId = userData ? .stripeCustomerId;
    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: userData ? .email,
            name: userData ? .name || userData ? .displayName || undefined,
            metadata: {
                userId: context.auth.uid,
            },
        });

        stripeCustomerId = customer.id;
        await userRef.update({
            stripeCustomerId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{
            price: priceId,
            quantity: 1,
        }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        metadata: {
            userId: context.auth.uid,
            mentorId,
            tier,
            priceId,
        },
        subscription_data: {
            metadata: {
                userId: context.auth.uid,
                mentorId,
                tier,
                priceId,
            },
        },
    });

    return {
        sessionId: session.id,
        checkoutUrl: session.url,
    };
});

exports.createStripeBillingPortalSession = functions.https.onCall(async(data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { returnUrl } = data || {};
    if (!returnUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing returnUrl');
    }

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();

    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found');
    }

    const stripeCustomerId = userDoc.data() ? .stripeCustomerId;
    if (!stripeCustomerId) {
        throw new functions.https.HttpsError('failed-precondition', 'No Stripe customer found for user');
    }

    const stripe = getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
    });

    return { url: portalSession.url };
});

exports.createStripeConnectOnboardingLink = functions.https.onCall(async(data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { returnUrl, refreshUrl } = data || {};
    if (!returnUrl || !refreshUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing returnUrl or refreshUrl');
    }

    const db = admin.firestore();
    const mentorRef = db.collection('users').doc(context.auth.uid);
    const mentorDoc = await mentorRef.get();

    if (!mentorDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Mentor profile not found');
    }

    const mentorData = mentorDoc.data();
    if (!mentorData ? .isMentor || mentorData ? .mentorStatus !== 'approved' || mentorData ? .mentorApplicationVersion !== 2) {
        throw new functions.https.HttpsError('permission-denied', 'Only approved mentors can connect payouts');
    }

    const stripe = getStripeClient();
    let connectedAccountId = mentorData ? .stripeConnectedAccountId;

    if (!connectedAccountId) {
        const account = await stripe.accounts.create({
            type: 'express',
            email: mentorData ? .email,
            metadata: {
                mentorId: context.auth.uid,
            },
        });

        connectedAccountId = account.id;
        await mentorRef.update({
            stripeConnectedAccountId: connectedAccountId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    const link = await stripe.accountLinks.create({
        account: connectedAccountId,
        type: 'account_onboarding',
        return_url: returnUrl,
        refresh_url: refreshUrl,
    });

    return { url: link.url };
});

exports.stripeWebhook = functions.https.onRequest(async(req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeWebhookSecret) {
        res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');
        return;
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
        res.status(400).send('Missing stripe-signature header');
        return;
    }

    const stripe = getStripeClient();
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, signature, stripeWebhookSecret);
    } catch (error) {
        res.status(400).send(`Webhook signature verification failed: ${error.message}`);
        return;
    }

    const db = admin.firestore();

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const metadata = session.metadata || {};
            const tierConfig = getTierConfig(metadata.tier);

            if (!tierConfig) {
                throw new Error('Unknown subscription tier in checkout metadata');
            }

            const subscriptionId = typeof session.subscription === 'string' ?
                session.subscription :
                session.subscription ? .id;

            let currentPeriodEnd = null;
            if (subscriptionId) {
                const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
                currentPeriodEnd = stripeSubscription.current_period_end ?
                    admin.firestore.Timestamp.fromMillis(stripeSubscription.current_period_end * 1000) :
                    null;
            }

            const subRef = db.collection('subscriptions').doc();
            await subRef.set({
                id: subRef.id,
                userId: metadata.userId,
                mentorId: metadata.mentorId,
                tier: metadata.tier,
                status: 'active',
                priceMonthly: tierConfig.priceMonthly,
                sessionsPerMonth: tierConfig.sessionsPerMonth,
                sessionsRemaining: tierConfig.sessionsPerMonth,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: subscriptionId || null,
                stripePriceId: session.metadata ? .priceId || null,
                currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
                currentPeriodEnd,
                billingCycleAnchor: admin.firestore.FieldValue.serverTimestamp(),
                cancelAtPeriodEnd: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            await db.collection('users').doc(metadata.userId).update({
                stripeCustomerId: session.customer,
                subscriptionTier: metadata.tier,
                subscriptionStatus: 'active',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;
            const subscriptionId = typeof invoice.subscription === 'string' ?
                invoice.subscription :
                invoice.subscription ? .id;

            if (subscriptionId) {
                const subscriptionSnapshot = await db
                    .collection('subscriptions')
                    .where('stripeSubscriptionId', '==', subscriptionId)
                    .limit(1)
                    .get();

                if (!subscriptionSnapshot.empty) {
                    const subDoc = subscriptionSnapshot.docs[0];
                    const subData = subDoc.data();
                    const totalAmount = Number((invoice.amount_paid || 0) / 100);
                    const { mentorAmount, platformFee } = calculateCommissionSplit(totalAmount);

                    const paymentRef = db.collection('payments').doc();
                    await paymentRef.set({
                        id: paymentRef.id,
                        subscriptionId: subDoc.id,
                        userId: subData.userId,
                        userName: subData.userName || 'Unknown User',
                        userEmail: subData.userEmail || '',
                        mentorId: subData.mentorId,
                        mentorName: subData.mentorName || 'Unknown Mentor',
                        totalAmount,
                        mentorAmount,
                        platformFee,
                        stripePaymentIntentId: invoice.payment_intent || null,
                        stripeInvoiceId: invoice.id,
                        status: 'succeeded',
                        billingPeriodStart: invoice.period_start ?
                            admin.firestore.Timestamp.fromMillis(invoice.period_start * 1000) : null,
                        billingPeriodEnd: invoice.period_end ?
                            admin.firestore.Timestamp.fromMillis(invoice.period_end * 1000) : null,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        paidAt: admin.firestore.FieldValue.serverTimestamp(),
                    });

                    await subDoc.ref.update({
                        status: 'active',
                        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
                        sessionsRemaining: subData.sessionsPerMonth,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            }
        }

        if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object;
            const subscriptionId = typeof invoice.subscription === 'string' ?
                invoice.subscription :
                invoice.subscription ? .id;

            if (subscriptionId) {
                const subscriptionSnapshot = await db
                    .collection('subscriptions')
                    .where('stripeSubscriptionId', '==', subscriptionId)
                    .limit(1)
                    .get();

                if (!subscriptionSnapshot.empty) {
                    const subDoc = subscriptionSnapshot.docs[0];
                    await subDoc.ref.update({
                        status: 'past_due',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            }
        }

        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const subscriptionSnapshot = await db
                .collection('subscriptions')
                .where('stripeSubscriptionId', '==', subscription.id)
                .limit(1)
                .get();

            if (!subscriptionSnapshot.empty) {
                const subDoc = subscriptionSnapshot.docs[0];
                await subDoc.ref.update({
                    status: 'cancelled',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }

        if (event.type === 'payout.paid' || event.type === 'payout.failed') {
            const payout = event.data.object;
            const payoutSnapshot = await db
                .collection('mentorPayouts')
                .where('stripePayoutId', '==', payout.id)
                .limit(1)
                .get();

            if (!payoutSnapshot.empty) {
                const payoutDoc = payoutSnapshot.docs[0];
                await payoutDoc.ref.update({
                    status: event.type === 'payout.paid' ? 'paid' : 'failed',
                    failureReason: payout.failure_message || null,
                    paidDate: event.type === 'payout.paid' ?
                        admin.firestore.FieldValue.serverTimestamp() : null,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }

        res.status(200).send({ received: true });
    } catch (error) {
        functions.logger.error('Stripe webhook handler failed', error);
        res.status(500).send('Webhook processing error');
    }
});

// ─── Email Notification System ────────────────────────────────────────────────

const getEmailTransporter = () => {
    const nodemailer = require('nodemailer');
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    if (!emailUser || !emailPassword) return null;
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPassword },
    });
};

const EMAIL_TEMPLATES = {
    account_suspended: (name, reason) => ({
        subject: 'Your Unity Account Has Been Suspended',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#ef4444,#dc2626);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center">
            <h1>Account Suspended</h1>
          </div>
          <div style="background:#f9fafb;padding:30px;border-radius:0 0 10px 10px">
            <p>Hi ${name},</p>
            <p>Your Unity Mentorship Hub account has been suspended.</p>
            <p><strong>Reason:</strong> ${reason || 'Policy violation'}</p>
            <p>If you believe this was a mistake, please contact our support team.</p>
            <p>— The Unity Team</p>
          </div>
        </div>`,
    }),
    account_reactivated: (name) => ({
        subject: 'Your Unity Account Has Been Reactivated',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#22c55e,#16a34a);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center">
            <h1>Account Reactivated</h1>
          </div>
          <div style="background:#f9fafb;padding:30px;border-radius:0 0 10px 10px">
            <p>Hi ${name},</p>
            <p>Great news! Your Unity Mentorship Hub account has been reactivated. You can now sign in and access all features.</p>
            <p>— The Unity Team</p>
          </div>
        </div>`,
    }),
    mentor_approved: (name) => ({
        subject: 'Congratulations — You Are Now a Unity Mentor!',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#1392ec,#6366f1);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center">
            <h1>Mentor Application Approved!</h1>
          </div>
          <div style="background:#f9fafb;padding:30px;border-radius:0 0 10px 10px">
            <p>Hi ${name},</p>
            <p>Congratulations! Your mentor application has been approved. Students can now find and book sessions with you.</p>
            <p>Log in to your dashboard to complete your mentor profile and start accepting bookings.</p>
            <p>— The Unity Team</p>
          </div>
        </div>`,
    }),
    mentor_rejected: (name) => ({
        subject: 'Unity Mentor Application Update',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center">
            <h1>Mentor Application Update</h1>
          </div>
          <div style="background:#f9fafb;padding:30px;border-radius:0 0 10px 10px">
            <p>Hi ${name},</p>
            <p>After reviewing your mentor application, we are unable to approve it at this time.</p>
            <p>You are welcome to reapply after updating your profile with more detail about your expertise and experience.</p>
            <p>— The Unity Team</p>
          </div>
        </div>`,
    }),
    welcome: (name) => ({
        subject: 'Welcome to Unity Mentorship Hub!',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#1392ec,#6366f1);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center">
            <h1>Welcome to Unity!</h1>
          </div>
          <div style="background:#f9fafb;padding:30px;border-radius:0 0 10px 10px">
            <p>Hi ${name},</p>
            <p>Welcome to Unity Mentorship Hub! We are excited to have you on board.</p>
            <p>Complete your profile to get matched with mentors or discover mentorship opportunities.</p>
            <p>— The Unity Team</p>
          </div>
        </div>`,
    }),
};

/**
 * Callable function to send notification emails.
 * Only callable by authenticated admins or internal service triggers.
 */
exports.sendNotificationEmail = functions.https.onCall(async(data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    // Allow admins and internal system calls
    const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const callerRole = callerDoc.data() ? .role;
    if (!['admin', 'super_admin'].includes(callerRole)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can send notification emails');
    }

    const { userId, templateName } = data;
    if (!userId || !templateName || !EMAIL_TEMPLATES[templateName]) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid userId or templateName');
    }

    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const userEmail = userData.email;
    const userName = userData.displayName || userData.firstName || 'there';

    const transporter = getEmailTransporter();
    if (!transporter) {
        functions.logger.warn('Email transporter not configured — EMAIL_USER/EMAIL_PASSWORD not set');
        return { success: false, reason: 'Email not configured' };
    }

    const template = EMAIL_TEMPLATES[templateName](userName, data.reason);

    await transporter.sendMail({
        from: '"Unity Mentorship Hub" <noreply@unitymentorhub.com>',
        to: userEmail,
        subject: template.subject,
        html: template.html,
    });

    // Log the email
    await admin.firestore().collection('emailLogs').add({
        to: userEmail,
        userId,
        templateName,
        sentBy: context.auth.uid,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        success: true,
    });

    return { success: true };
});

/**
 * Firestore trigger: auto-send welcome email when a new user doc is created.
 */
exports.onUserCreated = functions.firestore
    .document('users/{userId}')
    .onCreate(async(snap, context) => {
        const userData = snap.data();
        const userEmail = userData.email;
        const userName = userData.displayName || userData.firstName || 'there';

        const transporter = getEmailTransporter();
        if (!transporter || !userEmail) return null;

        const template = EMAIL_TEMPLATES.welcome(userName);
        try {
            await transporter.sendMail({
                from: '"Unity Mentorship Hub" <noreply@unitymentorhub.com>',
                to: userEmail,
                subject: template.subject,
                html: template.html,
            });
            await admin.firestore().collection('emailLogs').add({
                to: userEmail,
                userId: context.params.userId,
                templateName: 'welcome',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                success: true,
            });
        } catch (err) {
            functions.logger.error('Failed to send welcome email', { error: err.message, userId: context.params.userId });
        }
        return null;
    });

// ─── Platform Stats Maintenance ───────────────────────────────────────────────

/**
 * Recompute and persist publicStats/platform whenever a user doc is created or deleted.
 * This keeps the landing-page counters accurate without requiring auth from visitors.
 */
async function recomputePlatformStats() {
    const db = admin.firestore();
    const usersRef = db.collection('users');

    const [allSnap, mentorSnap, bookingsSnap] = await Promise.all([
        usersRef.get(),
        usersRef.where('isMentor', '==', true).where('mentorStatus', '==', 'approved').get(),
        db.collection('bookings').get(),
    ]);

    // Count active (non-deleted) students
    const activeStudents = allSnap.docs.filter(d => {
        const data = d.data();
        return !data.isDeleted && (data.role === 'student' || data.role === 'Student' || !data.isMentor);
    }).length;

    await db.collection('publicStats').doc('platform').set({
        activeStudents,
        mentors: mentorSnap.size,
        totalSessions: bookingsSnap.size,
        partners: 15,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}

exports.onUserDocCreated = functions.firestore
    .document('users/{userId}')
    .onCreate(async() => {
        try { await recomputePlatformStats(); } catch (e) { functions.logger.error('Stats update failed', e); }
        return null;
    });

exports.onUserDocDeleted = functions.firestore
    .document('users/{userId}')
    .onDelete(async() => {
        try { await recomputePlatformStats(); } catch (e) { functions.logger.error('Stats update failed', e); }
        return null;
    });

exports.onBookingCreated = functions.firestore
    .document('bookings/{bookingId}')
    .onCreate(async() => {
        try { await recomputePlatformStats(); } catch (e) { functions.logger.error('Stats update failed', e); }
        return null;
    });