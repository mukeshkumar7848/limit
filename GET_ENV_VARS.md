# 🔧 How to Get Your Environment Variables

## You already have these on Vercel! ✅

From your screenshot, you have:
- ✅ SUPABASE_URL
- ✅ SUPABASE_KEY  
- ✅ RESEND_API_KEY
- ✅ FROM_EMAIL
- ✅ RAZORPAY_WEBHOOK_SECRET

## 📋 Get Them from Vercel Dashboard

### Option 1: Copy from Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Click your project: "limit"
3. Go to: Settings → Environment Variables
4. Click the "👁" (eye icon) to reveal each value
5. Copy each value

### Option 2: Use Vercel CLI
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local
```
This will automatically download all your environment variables! ✨

---

## 🔍 Or Get From Original Sources

### Supabase
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "Settings" (gear icon) → "API"
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_KEY`

### Resend
1. Go to: https://resend.com/dashboard
2. Click "API Keys"
3. Copy your API key → `RESEND_API_KEY`
4. Go to "Domains" and use your verified email → `FROM_EMAIL`

### Razorpay
1. Go to: https://dashboard.razorpay.com
2. Settings → Webhooks
3. View your webhook
4. Copy the secret → `RAZORPAY_WEBHOOK_SECRET`

---

## ✏️ Update Your .env.local

Replace the placeholder values in `.env.local`:

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com

# Razorpay
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## 🚀 After Updating

1. **Save** `.env.local`
2. **Restart** dev server:
   ```bash
   # Kill the current server
   pkill -f "next dev"
   
   # Start again
   npm run dev
   ```
3. **Test** at: http://localhost:3000/test.html

---

## ⚡ Quick Fix (Easiest Way)

Run this in your terminal:
```bash
vercel env pull .env.local
```

This downloads all your Vercel environment variables automatically! 🎉
