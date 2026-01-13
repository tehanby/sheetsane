# Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

- [ ] Code builds successfully locally (`npm run build`)
- [ ] All tests pass (if any)
- [ ] `.gitignore` includes `.env*` files
- [ ] Code committed to Git

## GitHub Setup

- [ ] GitHub account created
- [ ] Repository created on GitHub
- [ ] Code pushed to GitHub
- [ ] Repository is public (required for free Vercel)

## Stripe Setup

- [ ] Stripe account created
- [ ] Test API keys obtained:
  - [ ] Publishable key (`pk_test_...`)
  - [ ] Secret key (`sk_test_...`)
- [ ] Product created in Stripe ($19.00 one-time)
- [ ] Webhook endpoint created (after Vercel deployment)

## Vercel Deployment

- [ ] Vercel account created (via GitHub)
- [ ] Project imported from GitHub
- [ ] Environment variables added:
  - [ ] `SESSION_SECRET` (32+ characters)
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET` (after webhook setup)
  - [ ] `NEXT_PUBLIC_APP_URL` (after first deploy)
- [ ] Initial deployment successful
- [ ] Vercel URL obtained

## Post-Deployment Configuration

- [ ] `NEXT_PUBLIC_APP_URL` updated with Vercel URL
- [ ] Stripe webhook endpoint created with Vercel URL
- [ ] `STRIPE_WEBHOOK_SECRET` updated in Vercel
- [ ] Application redeployed with all variables

## Testing

- [ ] Homepage loads correctly
- [ ] Marketing page loads (`/marketing`)
- [ ] File upload works
- [ ] File preview displays
- [ ] Stripe Checkout redirects correctly
- [ ] Test payment completes successfully
- [ ] Success page displays
- [ ] Report page displays results
- [ ] PDF download works
- [ ] Webhook events appear in Stripe dashboard

## Production Readiness (When Ready)

- [ ] Stripe account activated (live mode)
- [ ] Live API keys obtained
- [ ] Environment variables updated to live keys
- [ ] Live webhook endpoint created
- [ ] Application redeployed with live keys
- [ ] Test payment with real card (small amount)
- [ ] Verify real payment works end-to-end

## Optional Enhancements

- [ ] Custom domain configured
- [ ] Analytics added (Vercel Analytics is free)
- [ ] Error monitoring set up
- [ ] Email notifications configured in Vercel

---

**Deployment Complete!** ✅

Your app is live at: `https://your-project.vercel.app`
