# Step-by-Step Deployment Plan for Free Services

This guide walks you through deploying SheetSane to **Vercel's free tier** (100% free, no credit card required).

## Prerequisites Checklist

- [ ] GitHub account (free)
- [ ] Stripe account (free to create, only pay when you receive payments)
- [ ] Node.js 18+ installed locally (for testing)
- [ ] Git installed

---

## Step 1: Prepare Your Code

### 1.1 Verify Build Works Locally

```bash
# Install dependencies
npm install

# Test the build
npm run build

# If build succeeds, you're ready!
```

### 1.2 Create `.gitignore` (if not exists)

Ensure `.gitignore` includes:
```
.env.local
.env
node_modules
.next
.vercel
*.log
.DS_Store
```

### 1.3 Commit Your Code

```bash
git init
git add .
git commit -m "Ready for deployment"
```

---

## Step 2: Push to GitHub

### 2.1 Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click **New repository** (green button)
3. Repository name: `sheetsane` (or your choice)
4. Description: "Spreadsheet Sanity Checker"
5. Set to **Public** (required for free Vercel)
6. **DO NOT** initialize with README, .gitignore, or license
7. Click **Create repository**

### 2.2 Push Your Code

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sheetsane.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Set Up Stripe Account

### 3.1 Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Click **Sign up** (free, no credit card required for test mode)
3. Complete registration
4. Verify your email

### 3.2 Get Test API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Make sure you're in **Test mode** (toggle in top right)
3. Copy **Publishable key** (starts with `pk_test_`)
4. Click **Reveal test key** and copy **Secret key** (starts with `sk_test_`)
5. Save both - you'll need them in Step 5

### 3.3 Create Product in Stripe

1. Go to **Products** → **Add product**
2. Name: "SheetSane Report"
3. Description: "One-time spreadsheet analysis report"
4. Pricing: **One-time payment**, $19.00 USD
5. Click **Save product**
6. Note the Product ID (you may need it later)

---

## Step 4: Deploy to Vercel

### 4.1 Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** → **Continue with GitHub**
3. Authorize Vercel to access your GitHub

### 4.2 Import Your Project

1. In Vercel Dashboard, click **Add New** → **Project**
2. Find your `sheetsane` repository
3. Click **Import**

### 4.3 Configure Project Settings

**Framework Preset:** Next.js (should auto-detect)

**Root Directory:** `./` (leave as default)

**Build Command:** `npm run build` (default)

**Output Directory:** `.next` (default)

**Install Command:** `npm install` (default)

**DO NOT click Deploy yet** - we need to add environment variables first!

---

## Step 5: Configure Environment Variables

### 5.1 Add Environment Variables in Vercel

In the Vercel project setup page, scroll to **Environment Variables** section:

#### Add Each Variable:

1. **SESSION_SECRET**
   - **Name:** `SESSION_SECRET`
   - **Value:** Generate a secure random string:
     ```bash
     # Option 1: Use the helper script
     npm run generate-secret
     
     # Option 2: Use openssl
     openssl rand -base64 32
     
     # Option 3: Online generator
     # https://generate-secret.vercel.app/32
     ```
   - **Environment:** Production, Preview, Development (select all)
   - Click **Add**

2. **STRIPE_SECRET_KEY**
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** Your Stripe test secret key (`sk_test_...`)
   - **Environment:** Production, Preview, Development
   - Click **Add**

3. **STRIPE_PUBLISHABLE_KEY**
   - **Name:** `STRIPE_PUBLISHABLE_KEY`
   - **Value:** Your Stripe test publishable key (`pk_test_...`)
   - **Environment:** Production, Preview, Development
   - Click **Add**

4. **STRIPE_WEBHOOK_SECRET**
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** Leave empty for now (we'll add this in Step 6)
   - **Environment:** Production only
   - Click **Add** (we'll update it later)

5. **NEXT_PUBLIC_APP_URL**
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** Leave empty for now (Vercel will assign URL)
   - **Environment:** Production, Preview, Development
   - Click **Add** (we'll update after first deploy)

### 5.2 Deploy

Click **Deploy** button at the bottom.

**Wait 2-3 minutes** for the build to complete.

---

## Step 6: Configure Stripe Webhook

### 6.1 Get Your Vercel URL

1. After deployment completes, Vercel will show your live URL
2. It will be something like: `https://sheetsane-abc123.vercel.app`
3. Copy this URL

### 6.2 Update NEXT_PUBLIC_APP_URL

1. In Vercel Dashboard, go to your project
2. Click **Settings** → **Environment Variables**
3. Find `NEXT_PUBLIC_APP_URL`
4. Click **Edit**
5. Set value to your Vercel URL: `https://your-project.vercel.app`
6. Click **Save**

### 6.3 Create Stripe Webhook Endpoint

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL:** `https://your-vercel-url.vercel.app/api/webhook/`
   - Replace `your-vercel-url` with your actual Vercel URL
4. **Description:** "SheetSane Production Webhook"
5. **Events to send:** Click **Select events**
   - Check: `checkout.session.completed`
   - Click **Add events**
6. Click **Add endpoint**

### 6.4 Get Webhook Signing Secret

1. After creating the webhook, click on it
2. Find **Signing secret** section
3. Click **Reveal** and copy the secret (starts with `whsec_`)

### 6.5 Update Webhook Secret in Vercel

1. Go back to Vercel Dashboard → **Settings** → **Environment Variables**
2. Find `STRIPE_WEBHOOK_SECRET`
3. Click **Edit**
4. Paste the webhook signing secret
5. Click **Save**

### 6.6 Redeploy to Apply Changes

1. In Vercel Dashboard, go to **Deployments**
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

## Step 7: Test Your Deployment

### 7.1 Test the Homepage

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. You should see the SheetSane homepage
3. Try visiting `/marketing` to see the marketing page

### 7.2 Test File Upload

1. Create a test Excel file (or use `test-spreadsheet.xlsx` if you have one)
2. Upload it on the homepage
3. Verify preview appears

### 7.3 Test Payment Flow

1. Click "Generate Report"
2. You should be redirected to Stripe Checkout
3. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
4. Complete payment
5. You should be redirected to success page
6. Verify you can view the report
7. Test PDF download

### 7.4 Verify Webhook Works

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Check **Recent events** - you should see `checkout.session.completed` events
4. If events show ✅ (green checkmark), webhook is working!

---

## Step 8: Switch to Production Stripe (When Ready)

### 8.1 Activate Stripe Account

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode**
2. Complete Stripe's activation process (business details, bank account, etc.)

### 8.2 Get Live API Keys

1. In **Live mode**, go to **Developers** → **API keys**
2. Copy **Publishable key** (`pk_live_...`)
3. Copy **Secret key** (`sk_live_...`)

### 8.3 Update Vercel Environment Variables

1. In Vercel Dashboard → **Settings** → **Environment Variables**
2. Update `STRIPE_SECRET_KEY` with live secret key
3. Update `STRIPE_PUBLISHABLE_KEY` with live publishable key
4. **Important:** Create a new webhook endpoint in **Live mode** and update `STRIPE_WEBHOOK_SECRET`

### 8.4 Redeploy

Redeploy your application to apply the new keys.

---

## Step 9: Custom Domain (Optional - Free)

### 9.1 Add Custom Domain in Vercel

1. In Vercel Dashboard → **Settings** → **Domains**
2. Enter your domain (e.g., `sheetsane.com`)
3. Follow Vercel's DNS configuration instructions
4. Wait for DNS propagation (can take up to 24 hours)

### 9.2 Update Environment Variables

1. Update `NEXT_PUBLIC_APP_URL` to your custom domain
2. Update Stripe webhook URL to use custom domain
3. Redeploy

---

## Step 10: Monitoring & Maintenance

### 10.1 Monitor Vercel Usage

- Vercel Dashboard → **Usage** tab
- Free tier includes:
  - 100GB bandwidth/month
  - 100 serverless function executions/day
  - Unlimited deployments

### 10.2 Monitor Stripe Dashboard

- Check **Payments** tab for successful transactions
- Monitor **Webhooks** for any failures
- Review **Logs** for errors

### 10.3 Set Up Error Alerts (Optional)

1. In Vercel Dashboard → **Settings** → **Notifications**
2. Enable email notifications for:
   - Deployment failures
   - Function errors
   - Bandwidth limits

---

## Troubleshooting

### Build Fails

**Error:** "Module not found"
- **Fix:** Ensure all dependencies are in `package.json`
- Run `npm install` locally and commit `package-lock.json`

**Error:** "TypeScript errors"
- **Fix:** Run `npm run build` locally to see errors
- Fix all TypeScript errors before deploying

### Payment Not Working

**Issue:** Stripe Checkout redirects but payment doesn't complete
- **Check:** Webhook secret is correct in Vercel
- **Check:** Webhook endpoint URL in Stripe matches your Vercel URL
- **Check:** Webhook events include `checkout.session.completed`

**Issue:** "Session expired" after payment
- **Check:** `SESSION_SECRET` is set in Vercel
- **Check:** Webhook is successfully updating session

### File Upload Fails

**Error:** "File too large"
- **Check:** File is under 10MB
- **Check:** Vercel function timeout (free tier: 10 seconds max)

**Error:** "Rate limit exceeded"
- **Check:** You're hitting the 10 requests/hour limit
- **Wait:** 1 hour or test from different IP

### PDF Generation Fails

**Error:** "Failed to generate report"
- **Check:** Analysis completed successfully first
- **Check:** File still exists in temp storage (30-minute limit)
- **Check:** Vercel function memory limits (free tier: 1024MB)

---

## Free Tier Limits Summary

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ 100 serverless function executions/day
- ✅ 10-second function timeout
- ✅ 1024MB function memory
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN

### Your App's Limits (Cost Control)
- ✅ 10MB max file size
- ✅ 20 sheets max per workbook
- ✅ 10,000 rows max per sheet
- ✅ 200 columns max per sheet
- ✅ 10 requests/hour (heavy endpoints)
- ✅ 30 requests/hour (light endpoints)
- ✅ 30-minute file retention

---

## Next Steps After Deployment

1. **Share your app:** Share the Vercel URL with users
2. **Monitor usage:** Check Vercel and Stripe dashboards regularly
3. **Collect feedback:** Add analytics (optional, free: Vercel Analytics)
4. **Optimize:** Monitor function execution times and optimize if needed
5. **Scale:** If you hit limits, consider Vercel Pro ($20/month) or optimize further

---

## Quick Reference: Environment Variables

```env
# Required for deployment
SESSION_SECRET=<32+ character random string>
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Support:** Available in dashboard (free tier gets community support)

---

**You're all set!** Your app is now live on free services. 🚀
