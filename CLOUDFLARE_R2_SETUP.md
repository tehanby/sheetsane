# Cloudflare R2 Setup Guide

This guide walks you through setting up Cloudflare R2 storage to eliminate file loss on Vercel serverless functions.

**Why R2?**
- ✅ **Free tier**: 10GB storage, 1M requests/month
- ✅ **No credit card required**
- ✅ **Files persist across Vercel invocations**
- ✅ **Fixes the file loss issue completely**

---

## Step 1: Create Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Click **Sign Up** (free)
3. Enter your email and password
4. Verify your email address
5. Complete the onboarding

---

## Step 2: Enable R2

1. In Cloudflare Dashboard, go to **R2** (in left sidebar)
2. If you see "Enable R2", click it
3. If you see a notice about billing, click **Set up R2** or **Continue**
4. You may need to confirm you understand the pricing (free tier is generous)
5. R2 will be enabled for your account

---

## Step 3: Create an R2 Bucket

1. In the R2 dashboard, click **Create bucket**
2. **Bucket name**: `sheetsane-files` (or your preferred name)
3. **Location**: Choose closest to your users (e.g., `WNAM` for North America)
4. Click **Create bucket**

**Note:** Write down the bucket name - you'll need it later.

---

## Step 4: Create API Token

1. In Cloudflare Dashboard, go to **R2** → **Manage R2 API Tokens**
   - Or go to: https://dash.cloudflare.com/profile/api-tokens
   - Click **Create Token** → **Custom Token**

2. **Token name**: `SheetSane R2 Access`

3. **Permissions**: 
   - **Account**: `Cloudflare R2:Edit`
   - Select your account

4. **Account Resources**:
   - **Include**: Specific bucket
   - Select your `sheetsane-files` bucket

5. Click **Continue to summary** → **Create Token**

6. **IMPORTANT**: Copy the token immediately - you won't see it again!
   - You'll see: **Access Key ID** and **Secret Access Key**
   - Copy both and save them securely

---

## Step 5: Get Account ID

1. In Cloudflare Dashboard, select any zone (domain)
2. Look in the right sidebar for **Account ID**
3. Copy the Account ID (long alphanumeric string)

**Alternative method:**
- Go to any Cloudflare API request URL in their docs
- The Account ID is in the URL: `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/...`

---

## Step 6: Install Dependencies

The package has already been added to `package.json`, but make sure it's installed:

```bash
npm install
```

This installs `@aws-sdk/client-s3` (Cloudflare R2 uses S3-compatible API).

---

## Step 7: Configure Environment Variables

### Local Development (.env.local)

Add to your `.env.local` file:

```env
# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=your-access-key-id-here
R2_SECRET_ACCESS_KEY=your-secret-access-key-here
R2_BUCKET_NAME=sheetsane-files
```

**Replace:**
- `your-account-id-here` with your Cloudflare Account ID
- `your-access-key-id-here` with the Access Key ID from Step 4
- `your-secret-access-key-here` with the Secret Access Key from Step 4
- `sheetsane-files` with your bucket name (if different)

### Vercel Production

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:

   **Variable 1:**
   - **Name**: `R2_ACCOUNT_ID`
   - **Value**: Your Cloudflare Account ID
   - **Environment**: Production, Preview, Development (all)
   - Click **Save**

   **Variable 2:**
   - **Name**: `R2_ACCESS_KEY_ID`
   - **Value**: Your R2 Access Key ID
   - **Environment**: Production, Preview, Development (all)
   - Click **Save**

   **Variable 3:**
   - **Name**: `R2_SECRET_ACCESS_KEY`
   - **Value**: Your R2 Secret Access Key
   - **Environment**: Production, Preview, Development (all)
   - Click **Save**

   **Variable 4:**
   - **Name**: `R2_BUCKET_NAME`
   - **Value**: `sheetsane-files` (or your bucket name)
   - **Environment**: Production, Preview, Development (all)
   - Click **Save**

4. **Redeploy** your application:
   - Go to **Deployments**
   - Click **⋯** on latest deployment
   - Click **Redeploy**

---

## Step 8: Test the Setup

### Test Locally

1. Make sure `.env.local` has all R2 variables
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Upload a test file
4. Check Cloudflare R2 dashboard → Your bucket
5. You should see the file listed

### Test on Vercel

1. After redeploy, upload a file on production
2. Check R2 dashboard → Your bucket
3. File should appear
4. Complete payment flow
5. Report should generate without file loss error ✅

---

## Step 9: Verify It's Working

1. **Upload a file** → Check R2 dashboard (file should appear)
2. **Go through checkout** → File should still be in R2
3. **Complete payment** → File still accessible
4. **View report** → No "file expired" error! 🎉

---

## Troubleshooting

### Error: "R2 configuration missing"

**Solution:**
- Check all 4 environment variables are set
- Verify variable names match exactly (case-sensitive)
- Restart dev server after adding variables

### Error: "Access Denied" or "403"

**Solution:**
- Verify Access Key ID and Secret Access Key are correct
- Check token has `Cloudflare R2:Edit` permission
- Verify bucket name matches exactly

### Error: "NoSuchBucket"

**Solution:**
- Verify `R2_BUCKET_NAME` matches your bucket name exactly
- Check bucket exists in Cloudflare R2 dashboard
- Ensure bucket name has no typos

### Files not appearing in R2

**Check:**
1. Environment variables are set correctly
2. Bucket name is correct
3. Check browser console/network tab for errors
4. Check Vercel function logs for R2 errors

---

## Cost Monitoring

### Free Tier Limits:
- **Storage**: 10GB free/month
- **Class A Operations** (writes): 1M free/month
- **Class B Operations** (reads): 10M free/month

### For SheetSane:
- Each file: ~1-10MB (most are <1MB)
- Free tier allows: ~1,000-10,000 files
- Should be plenty for MVP!

### Monitor Usage:
1. Cloudflare Dashboard → **R2** → **Usage**
2. Check storage and request counts
3. Set up alerts if needed (optional)

---

## Security Best Practices

1. **Never commit API keys to git**
   - Already in `.gitignore` ✅

2. **Use environment variables only**
   - Never hardcode keys in code ✅

3. **Rotate keys periodically**
   - Create new token in Cloudflare
   - Update environment variables
   - Delete old token

4. **Limit token permissions**
   - Only grant access to specific bucket ✅
   - Use `Edit` permission (not `Admin`)

---

## Optional: Cleanup Old Files

R2 doesn't automatically delete files. You can:

1. **Set up lifecycle rules** (optional):
   - Cloudflare Dashboard → R2 → Your bucket → **Settings**
   - **Lifecycle rules** → Add rule
   - Delete objects older than 30 days

2. **Or implement cleanup in code** (future enhancement):
   - Add scheduled function to delete old files
   - Run daily via Vercel Cron or similar

---

## What Changed in the Code

The app now:
1. **Tries R2 storage first** when uploading files
2. **Falls back to in-memory/tmp** if R2 not configured
3. **Downloads from R2** when file is needed
4. **Works seamlessly** - no user-visible changes (except no file loss!)

---

## Success Checklist

- [ ] Cloudflare account created
- [ ] R2 enabled
- [ ] Bucket created (`sheetsane-files`)
- [ ] API token created with correct permissions
- [ ] Account ID copied
- [ ] All 4 environment variables added to `.env.local`
- [ ] All 4 environment variables added to Vercel
- [ ] Vercel deployment redeployed
- [ ] Test file uploaded and appears in R2
- [ ] Payment flow works without file loss error

---

## Support

- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **S3 SDK Docs**: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
- **Vercel Env Vars**: https://vercel.com/docs/concepts/projects/environment-variables

---

**You're all set!** 🚀 

Files will now persist across Vercel invocations, eliminating the file loss issue completely.
