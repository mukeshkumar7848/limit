# 🔧 Razorpay Payment Failed - Troubleshooting Guide

## Error: "Oops! Something went wrong. Payment Failed"

This error can occur for several reasons. Let's fix it step by step.

---

## ✅ Quick Fixes (Try These First)

### 1. **Verify Your Razorpay Test Key**

1. Go to: https://dashboard.razorpay.com/app/keys
2. Make sure you're in **TEST MODE** (toggle top-left should be blue/test)
3. Check your Key ID starts with `rzp_test_`
4. Copy the FULL key ID
5. Update in `public/test-payment.html`:
   ```javascript
   const RAZORPAY_KEY_ID = 'rzp_test_YOUR_ACTUAL_KEY';
   ```

### 2. **Restart Your Dev Server**

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 3. **Clear Browser Cache**

- Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Or open in Incognito/Private mode

---

## 🔍 Common Issues & Solutions

### Issue 1: Invalid API Key

**Symptoms:**
- "Payment Failed" immediately
- Error mentions "invalid key"

**Solution:**
```bash
# 1. Check your key in Razorpay Dashboard
# 2. Make sure it's a TEST key (rzp_test_...)
# 3. Update .env.local:
RAZORPAY_KEY_ID=rzp_test_your_actual_key_here

# 4. Also update in public/test-payment.html
# 5. Restart server
```

### Issue 2: Razorpay Account Not Activated

**Symptoms:**
- Payment opens but fails
- "Account not activated" error

**Solution:**
1. Go to: https://dashboard.razorpay.com/
2. Check if account needs verification
3. Complete KYC if required
4. For TEST mode, this should work immediately

### Issue 3: Test Mode Not Enabled

**Symptoms:**
- Using live key in test environment

**Solution:**
1. Switch to TEST MODE in Razorpay Dashboard
2. Generate TEST keys (if not already done)
3. Use TEST keys only for development

### Issue 4: Network/CORS Issues

**Symptoms:**
- Console shows network errors
- CORS errors

**Solution:**
```bash
# Make sure server is running
npm run dev

# Check console for errors
# Open browser DevTools (F12)
# Look for red errors
```

---

## 🧪 Alternative Testing Method

If Razorpay checkout still doesn't work, test webhook directly:

### Method 1: Manual Webhook Test

```bash
# Simulate a payment webhook
curl -X POST http://localhost:3000/api/razorpay/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test_signature" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test_12345",
          "order_id": "order_test_12345",
          "amount": 99900,
          "currency": "INR",
          "status": "captured",
          "method": "card",
          "email": "your@email.com",
          "contact": "9876543210",
          "created_at": 1707654321
        }
      }
    }
  }'
```

**Note:** This will fail signature verification but tests the flow

### Method 2: Manual License Creation

Bypass payment and manually create license in Supabase:

```sql
INSERT INTO licenses (
  license_key,
  email,
  razorpay_payment_id,
  razorpay_order_id,
  amount,
  currency,
  status,
  device_id,
  activations,
  max_activations,
  created_at,
  activated_at,
  expires_at
) VALUES (
  'LIC-MANUAL-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-TEST',
  'your@email.com',
  'pay_manual_test',
  'order_manual_test',
  999,
  'INR',
  'active',
  NULL,
  0,
  1,
  NOW(),
  NULL,
  NOW() + INTERVAL '1 year'
);
```

Then test activation with this license key!

---

## 🔐 Verify Razorpay Setup

### Check 1: Account Status
```
✓ Logged into Razorpay Dashboard
✓ Switched to TEST MODE
✓ API Keys generated
✓ Key ID starts with rzp_test_
```

### Check 2: Environment Variables
```bash
# Check .env.local has:
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_WEBHOOK_SECRET=whsec_...
```

### Check 3: Server Running
```bash
# Terminal should show:
✓ Ready in XXXms
# No errors
```

### Check 4: Browser Console
```
# Open DevTools (F12)
# Console tab
# Should NOT show:
  ❌ Razorpay is not defined
  ❌ Invalid key
  ❌ Network errors
```

---

## 📝 Step-by-Step Debug Process

### Step 1: Check Browser Console

```javascript
// Open DevTools (F12) → Console
// Run this:
console.log('Razorpay loaded:', typeof Razorpay !== 'undefined');
console.log('Key ID:', 'rzp_test_SEBjSuk1o3XfRS');

// Should show:
// Razorpay loaded: true
// Key ID: rzp_test_...
```

### Step 2: Test Order Creation API

```bash
curl -X POST http://localhost:3000/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 99900, "currency": "INR"}'

# Should return:
# {"success":true,"order_id":"order_...","amount":99900,...}
```

### Step 3: Simplify Test

Try with minimal data:
- Name: Test
- Email: test@test.com
- Phone: 9999999999

---

## 🎯 Working Alternative

If Razorpay continues to fail, here's a **working alternative** for testing:

### Use Razorpay Test Dashboard

1. Go to: https://dashboard.razorpay.com/app/test/payments
2. Click "Create Test Payment"
3. Fill details
4. Mark as "Captured"
5. This will trigger webhook → your API
6. License will be created automatically!

---

## 📞 Still Not Working?

### Get Detailed Error Information

Add this to browser console:
```javascript
// Enable verbose logging
localStorage.setItem('razorpayDebug', 'true');

// Then try payment again
// Check console for detailed errors
```

### Check These Files

1. **`public/test-payment.html`** - Line 233 has correct key?
2. **`.env.local`** - Has RAZORPAY_KEY_ID?
3. **Server logs** - Any errors when starting?

### Common Console Errors & Solutions

| Error | Solution |
|-------|----------|
| "Razorpay is not defined" | Check internet connection |
| "Invalid key" | Use correct TEST key |
| "Network error" | Server not running |
| "CORS error" | Running on localhost:3000? |

---

## ✅ Expected Working Flow

When everything works correctly:

1. Fill form → Click "Pay"
2. Razorpay modal opens
3. Enter test card: 4111 1111 1111 1111
4. Click "Pay"
5. Success message appears
6. Check Supabase → License created
7. Check email → License key received

---

## 🚀 Production Checklist

Once testing works:

- [ ] Switch to LIVE mode in Razorpay
- [ ] Use LIVE keys (rzp_live_...)
- [ ] Update Vercel environment variables
- [ ] Test with real card (small amount)
- [ ] Verify webhook delivery
- [ ] Check license creation
- [ ] Verify email sending

---

## 💡 Quick Test Without Payment

Want to test license system without payment hassles?

```bash
# Just create a test license in Supabase:
# Go to Supabase → licenses table → Insert row

# Or use this SQL:
INSERT INTO licenses (license_key, email, status, max_activations, expires_at)
VALUES ('TEST-KEY-123', 'you@email.com', 'active', 1, NOW() + INTERVAL '1 year');

# Then test activation at:
http://localhost:3000/test.html
```

---

**Need more help? Check:**
- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Support: https://razorpay.com/support/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-details/
