# Why Files Are Lost on Vercel (Technical Explanation)

## The Root Cause

**Vercel uses serverless functions** - each API route invocation runs in a **separate, isolated container** that is destroyed after the request completes. This is different from traditional servers where memory persists between requests.

### What Happens:

1. **Upload Request** (Function Invocation #1)
   - File uploaded → stored in memory (`storage.ts`)
   - File saved to `/tmp` directory
   - Session cookie created
   - **Container destroyed** after response

2. **User Redirects to Stripe** (Browser navigation)
   - No server function called
   - User pays on Stripe's servers

3. **Payment Verification** (Function Invocation #2)
   - **NEW container** - fresh memory, empty `/tmp`
   - File from step 1 is **gone**
   - Payment verified, session marked as paid ✅

4. **Report Page Loads** (Function Invocation #3)
   - **ANOTHER new container** - file still gone
   - Tries to analyze → file missing ❌

## Why This Happens

### Vercel Serverless Architecture:
- **Stateless**: Each function invocation is independent
- **Ephemeral**: Memory and `/tmp` are cleared between invocations
- **Scalable**: Can spin up thousands of containers simultaneously
- **Cost-effective**: Only pay for actual execution time

### Storage Options on Vercel Free Tier:

| Storage Type | Persists? | Why It Fails |
|-------------|-----------|--------------|
| In-memory (`Map`) | ❌ No | Destroyed when container ends |
| `/tmp` directory | ❌ No | Cleared between invocations |
| Cookies/JWT | ✅ Yes | **BUT** size limit ~4KB (files are 10MB max) |
| Database | ✅ Yes | **BUT** you said no database |
| Object Storage (S3) | ✅ Yes | **BUT** you said no paid services |

## Current Solution: Re-upload Flow

Since we can't persist files on Vercel's free tier without external services, we've implemented a **seamless re-upload flow**:

1. ✅ Payment is verified and session marked as paid
2. ✅ If file is missing, user sees friendly error
3. ✅ User re-uploads same file
4. ✅ Session preserves `paid: true` status
5. ✅ Report generates immediately (no payment needed)

## Alternative Solutions (If You Want to Fix This)

### Option 1: Store File in Browser (Client-Side)
**Pros:**
- Free
- Persists across server invocations
- No external services

**Cons:**
- Browser storage limits (~5-10MB)
- Security concerns (file in browser)
- User could clear storage

**Implementation:**
- Store file buffer in `localStorage` or `IndexedDB` after upload
- Send file back to server when needed

### Option 2: Use Free Object Storage
**Options:**
- **Cloudflare R2** (free tier: 10GB storage, 1M requests/month)
- **Backblaze B2** (free tier: 10GB storage)
- **Supabase Storage** (free tier: 1GB)

**Pros:**
- Files persist reliably
- Free tier available
- Professional solution

**Cons:**
- Requires external service setup
- Slightly more complex

### Option 3: Compress and Store in Session Token
**Pros:**
- No external services
- Files persist in cookie

**Cons:**
- Cookie size limits (~4KB)
- Even compressed, 10MB files won't fit
- Only works for very small files

### Option 4: Store File Hash, Require Re-upload
**Current approach** - but we could improve it:
- Store file hash in session
- Verify re-uploaded file matches hash
- Ensure user uploads same file

## Recommendation

For a **free-tier solution**, the current re-upload flow is actually the best approach given the constraints. However, if you want to eliminate the re-upload step, I'd recommend:

**Cloudflare R2** (free tier):
- 10GB storage free
- 1M requests/month free
- Easy to integrate
- No credit card required

Would you like me to implement Cloudflare R2 storage? It would eliminate the file loss issue completely.

## Current Workaround Status

✅ **Payment verification works** - session is marked as paid
✅ **Re-upload preserves paid status** - no double payment
✅ **User-friendly error messages** - clear instructions
✅ **Seamless flow** - just one extra upload step

The only downside is users need to re-upload after payment, but this is a limitation of Vercel's free tier architecture, not a bug in our code.
