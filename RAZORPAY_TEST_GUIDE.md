# 🧪 Razorpay Test Payment Guide

## 📋 Quick Setup (5 minutes)

### Step 1: Get Your Razorpay Test Keys

1. Go to: **https://dashboard.razorpay.com/**
2. Login to your account
3. Switch to **Test Mode** (toggle in top left)
4. Go to: **Settings** → **API Keys**
5. Click **Generate Test Keys** (if not already generated)
6. Copy your **Key ID** (starts with `rzp_test_`)

---

### Step 2: Update Test Payment Page

1. Open: `public/test-payment.html`
2. Find line with: `const RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_HERE';`
3. Replace `'rzp_test_YOUR_KEY_HERE'` with your actual key
4. Example: `const RAZORPAY_KEY_ID = 'rzp_test_9x7K1PqsXYZ123';`
5. Save the file

---

### Step 3: Start Your Dev Server

```bash
npm run dev
```

---

### Step 4: Open Test Payment Page

Navigate to: **http://localhost:3000/test-payment.html**

---

### Step 5: Make a Test Payment

1. Fill in the form:
   - **Name:** Any name (e.g., Test User)
   - **Email:** Your real email (to receive license key)
   - **Phone:** Any 10-digit number (e.g., 9876543210)

2. Click **"Pay ₹999 & Get License"**

3. Use **Test Card Details:**
   ```
   Card Number: 4111 1111 1111 1111
   CVV: 123
   Expiry: Any future date (e.g., 12/25)
   Name: Any name
   ```

4. Click **Pay**

---

## ✅ What Should Happen

### Immediate:
1. ✅ Payment successful message
2. ✅ Razorpay returns payment ID

### Within Seconds (Webhook):
3. ✅ Webhook receives payment notification
4. ✅ License key generated: `LIC-1234567890-ABC123XY`
5. ✅ Saved to Supabase `licenses` table
6. ✅ Email sent to your address with license key

---

## 🔍 Verify Everything Worked

### Check 1: Supabase Database
1. Go to Supabase Dashboard
2. Open `licenses` table
3. You should see a new row with:
   - ✅ license_key
   - ✅ Your email
   - ✅ razorpay_payment_id
   - ✅ status: "active"
   - ✅ expires_at: 1 year from now

### Check 2: Email Inbox
1. Check your email (use the email you entered)
2. Subject: "Payment Successful! 🎉 Your License Key"
3. Email contains your license key

### Check 3: Razorpay Dashboard
1. Go to: https://dashboard.razorpay.com/app/payments
2. You should see the test payment
3. Status should be "captured"

### Check 4: Webhook Logs (if configured)
1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click on your webhook
3. Check delivery logs
4. Should show successful delivery (200 OK)

---

## 🧪 Test Card Details

### Success Cards:
```
Card: 4111 1111 1111 1111 (Visa)
Card: 5555 5555 5555 4444 (Mastercard)
CVV: Any 3 digits
Expiry: Any future date
```

### Failed Payment (to test failure handling):
```
Card: 4000 0000 0000 0002
This will simulate a failed payment
```

---

## 🎯 Test License Activation

After receiving your license key:

### Via Test Page:
1. Go to: http://localhost:3000/test.html
2. Scroll to "License Management" section
3. Enter your license key
4. Enter device ID: `my-device-123`
5. Click "Activate License"
6. Should return success!

### Via API:
```bash
curl -X POST http://localhost:3000/api/license/verify \
  -H "Content-Type: application/json" \
  -d '{"license_key":"YOUR-LICENSE-KEY","device_id":"my-device-123"}'
```

---

## 🔧 Troubleshooting

### "Razorpay SDK not loaded"
- Check internet connection
- Razorpay script loads from CDN

### "Payment ID is undefined"
- Check if RAZORPAY_KEY_ID is correct
- Make sure you're using TEST key (not live key)

### "No email received"
- Check spam folder
- Verify RESEND_API_KEY in .env.local
- Check FROM_EMAIL is verified in Resend
- Check Vercel logs for errors

### "License not in database"
- Check webhook is configured
- Verify SUPABASE_URL and SUPABASE_KEY
- Check server logs for errors
- Webhook might not be set up yet (local testing)

---

## 📝 For Local Testing (Without Webhook)

If you want to test locally without webhook:

### Option 1: Use ngrok
```bash
# Install ngrok
brew install ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL in Razorpay webhook settings
```

### Option 2: Manually Insert License
After payment, manually add license to Supabase:

```sql
INSERT INTO licenses (
  license_key,
  email,
  razorpay_payment_id,
  amount,
  currency,
  status,
  max_activations,
  expires_at
) VALUES (
  'LIC-MANUAL-TEST-12345',
  'your@email.com',
  'pay_test_12345',
  999,
  'INR',
  'active',
  1,
  NOW() + INTERVAL '1 year'
);
```

---

## 🚀 Production Setup

Once testing works:

### 1. Get Live Keys
- Switch to Live Mode in Razorpay
- Generate Live API Keys
- Add to Vercel environment variables

### 2. Update Webhook URL
- URL: `https://your-domain.vercel.app/api/razorpay/webhook`
- Use LIVE webhook secret

### 3. Deploy
```bash
git add .
git commit -m "Add test payment page"
git push origin main
```

---

## 💡 Tips

1. **Always test in Test Mode first**
2. **Use real email to receive license key**
3. **Check all 3 places:** Database, Email, Razorpay Dashboard
4. **Test activation after receiving license**
5. **Test with different cards (success/failure)**

---

## 📊 Payment Flow Diagram

```
Customer enters details
         ↓
Clicks "Pay"
         ↓
Razorpay Checkout opens
         ↓
Enters card details (test)
         ↓
Payment processed
         ↓
Razorpay sends webhook
         ↓
Your API receives webhook
         ↓
Verifies signature
         ↓
Generates license key
         ↓
Saves to Supabase
         ↓
Sends email via Resend
         ↓
Customer receives license
         ↓
Customer activates in app
         ↓
Done! 🎉
```

---

## 🎬 Ready to Test!

1. Update RAZORPAY_KEY_ID in test-payment.html
2. Start server: `npm run dev`
3. Open: http://localhost:3000/test-payment.html
4. Make test payment
5. Check email for license key
6. Activate on test page
7. Celebrate! 🎉

---

Need help? Check:
- Razorpay Docs: https://razorpay.com/docs/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-details/
