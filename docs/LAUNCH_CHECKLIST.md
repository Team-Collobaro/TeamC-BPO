# Pre-Launch Checklist

Use this checklist before going live.

## Environment & Config

- [ ] `.env.local` has all `VITE_*` keys (Firebase, Stripe publishable)
- [ ] Firebase Functions config has: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] Optional: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `APP_URL` for emails
- [ ] Stripe webhook endpoint set to `stripeWebhook` URL with signing secret

## Firebase

- [ ] Firestore rules deployed: `firebase deploy --only firestore:rules`
- [ ] Firestore indexes deployed: `firebase deploy --only firestore:indexes`
- [ ] Cloud Functions deployed: `firebase deploy --only functions`
- [ ] Storage rules deployed if using Storage for CVs/certificates

## Security

- [ ] Admin users have `role: 'admin'` in Firestore `users/{uid}` and custom claims (run once via Admin SDK or onUserCreated after setting role in Firestore)
- [ ] No secrets in client bundle (only `VITE_*` and Stripe publishable key)
- [ ] Firestore rules tested: users cannot read other users’ payments/profiles except as allowed (employer with subscription, admin)

## Payments (Stripe)

- [ ] Test mode flows verified: course purchase, joining fee, CV unlock, reactivation, subscription
- [ ] Webhook `payment_intent.succeeded` and `checkout.session.completed` tested
- [ ] Switch to live keys and live webhook when ready for production

## Email

- [ ] SendGrid templates created and IDs set in Functions config (see `docs/EMAIL_TEMPLATES.md`)
- [ ] Welcome email tested after signup
- [ ] From address verified in SendGrid

## Flows (E2E)

- [ ] **Learner**: Sign up → Purchase course → Watch module → Pass MCQ → Final assessment → Certificate (stars) → Optional internship apply
- [ ] **Candidate**: Sign up → Pay joining fee → Assessment → Profile + CV upload → Visibility toggle
- [ ] **Employer**: Sign up → Subscribe → View candidates → Unlock CV (payment)
- [ ] **Admin**: Users list, suspend/activate; Pricing update; Payments list; Internships accept/reject; Audit logs

## Data & Seed

- [ ] Seed run if needed: `node scripts/seed.js` (courses, questionnaires, pricing_config, system_config)
- [ ] `pricing_config/default` and `system_config/default` exist

## Documentation

- [ ] README and setup guide reflect current stack (React + Vite, Firebase, Stripe)
- [ ] Team knows how to create first admin user (e.g. set role in Firestore + custom claims)
