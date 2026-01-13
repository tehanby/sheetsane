# SheetSane - Spreadsheet Sanity Checker

A production-ready MVP web application that analyzes Excel spreadsheets for errors, inconsistencies, and data quality issues. Users pay $19 via Stripe Checkout to receive a comprehensive sanity report.

## Features

- **Deterministic Analysis**: No AI/LLM - all checks are rule-based and reproducible
- **Comprehensive Checks**:
  - Workbook integrity (missing sheets, hidden sheets)
  - Header quality (empty headers, duplicates)
  - Formula errors (#REF!, #DIV/0!, #NAME?, etc.)
  - Data type anomalies (text dates, mixed types)
  - Duplicate key detection (user-selected column)
- **Professional PDF Reports**: Downloadable reports with score, findings, and recommendations
- **Session-Based**: No user accounts required
- **Secure**: HTTP-only cookies, signed JWT tokens, temporary file storage

## Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: TailwindCSS
- **File Parsing**: xlsx npm package
- **PDF Generation**: PDFKit
- **Payments**: Stripe Checkout
- **Hosting**: Vercel

## Project Structure

```
sheetsane/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts       # File upload endpoint
│   │   │   ├── analyze/route.ts      # Analysis endpoint
│   │   │   ├── checkout/route.ts     # Stripe checkout creation
│   │   │   ├── verify-payment/route.ts # Payment verification
│   │   │   ├── webhook/route.ts      # Stripe webhook handler
│   │   │   └── report/
│   │   │       └── download/route.ts # PDF download endpoint
│   │   ├── checkout/
│   │   │   ├── success/page.tsx      # Payment success page
│   │   │   └── cancel/page.tsx       # Payment cancelled page
│   │   ├── report/page.tsx           # Results page
│   │   ├── page.tsx                  # Homepage
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   └── lib/
│       ├── types.ts                  # TypeScript types
│       ├── analyzer.ts               # Spreadsheet analysis engine
│       ├── pdf-generator.ts          # PDF report generator
│       ├── session.ts                # JWT session management
│       ├── storage.ts                # Temporary file storage
│       └── stripe.ts                 # Stripe configuration
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Local Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Stripe account (for payments)

### 1. Clone and Install Dependencies

```bash
cd SheetSane
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Session Secret (generate a random 32+ character string)
# You can generate one with: openssl rand -base64 32
SESSION_SECRET=your-super-secret-key-at-least-32-characters-long

# App URL (for Stripe redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Stripe Setup

#### Create a Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete the onboarding process

#### Get API Keys
1. Go to **Developers** → **API keys** in the Stripe Dashboard
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add both to your `.env.local`

#### Set Up Webhook (for Local Development)
1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook/
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Test the Flow

1. Upload an Excel file (.xlsx)
2. Review the preview and select a key column (optional)
3. Click "Generate Report" to go to Stripe Checkout
4. Use test card: `4242 4242 4242 4242` (any future date, any CVC)
5. View your sanity report
6. Download the PDF

## Stripe Test Cards

| Card Number | Description |
|------------|-------------|
| 4242 4242 4242 4242 | Succeeds |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 3220 | 3D Secure required |

Use any future expiration date and any 3-digit CVC.

## Deployment

### Quick Start

For a detailed step-by-step guide to deploy on **free services** (Vercel free tier), see:

📖 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide

📋 **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Quick checklist

### Quick Summary

1. **Push to GitHub** - Create a public repository and push your code
2. **Deploy to Vercel** - Import from GitHub, add environment variables, deploy
3. **Configure Stripe** - Set up webhook endpoint with your Vercel URL
4. **Test** - Verify the full payment flow works

**All services are free:**
- ✅ Vercel hosting (free tier)
- ✅ Stripe account (free, only pay when you receive payments)
- ✅ GitHub (free for public repos)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/` | Upload Excel file |
| GET | `/api/analyze/` | Get existing analysis |
| POST | `/api/analyze/` | Run full analysis |
| POST | `/api/checkout/` | Create Stripe Checkout session |
| POST | `/api/verify-payment/` | Verify payment status |
| POST | `/api/webhook/` | Stripe webhook handler |
| GET | `/api/report/download/` | Download PDF report |

## Spreadsheet Checks

### Errors (−10 points each, max −70)
- No sheets in workbook
- Missing header row
- Formula errors (#REF!, #DIV/0!, #NAME?, etc.)
- Duplicate key values (if column selected)

### Warnings (−3 points each, max −30)
- Hidden sheets present
- Empty column headers
- Duplicate column headers
- Sheet with only headers (no data)
- Text-formatted dates (>20% of column)
- Mixed data types in numeric columns

## Security

- **Session Management**: JWT tokens with 30-minute expiry, stored in HTTP-only cookies
- **File Storage**: Files stored in memory, automatically deleted after 30 minutes
- **Payment Verification**: Server-side verification with Stripe API
- **Webhook Validation**: Signature verification for all webhook events

## Customization

### Pricing
Edit `src/lib/stripe.ts`:
```typescript
export const REPORT_PRICE_CENTS = 1900; // $19.00
```

### Session Duration
Edit `src/lib/session.ts`:
```typescript
const SESSION_EXPIRY_MINUTES = 30;
```

### File Size Limit
Edit `src/app/api/upload/route.ts`:
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

## Troubleshooting

### "Session expired" error
- The session token is valid for 30 minutes
- Upload the file again to get a new session

### Stripe webhook not working locally
- Make sure the Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhook/`
- Check that the webhook secret matches your `.env.local`

### PDF download fails
- Check that the session is still valid (30-minute limit)
- Ensure payment was completed successfully

### File upload fails
- Verify file is .xlsx or .xls format
- Ensure file size is under 10MB
- Check that the file is not password-protected

## License

MIT

---

Built with ❤️ using Next.js, Stripe, and a lot of spreadsheet expertise.
