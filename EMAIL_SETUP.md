# Email Configuration Guide

## Current Issue: Resend Test Mode Limitation

Your Resend API key (`re_2aHMAW4U_GCwq9wuye6Tss8QPoxEgkENL`) is in **test mode**, which means:

### ⚠️ Test Mode Restrictions:
- ✅ Can send emails to: **choudharm187@gmail.com** (account owner email)
- ❌ Cannot send to: Other email addresses (like workwithmukeshkumar@gmail.com)
- Error: "You can only send testing emails to your own email address"

## Solutions:

### Option 1: Verify a Domain (Recommended for Production)
1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Add your domain (e.g., `mukeshfx.com`)
4. Follow DNS verification steps
5. Update `.env.local`:
   ```
   FROM_EMAIL=notifications@mukeshfx.com
   ```
6. Now you can send to ANY email address!

### Option 2: Use Test Mode (Current Setup)
- Emails will only work for: `choudharm187@gmail.com`
- Use this for testing
- Change webhook to always send to owner email

### Option 3: Upgrade Resend Plan
- Free plan: 100 emails/day, test mode only
- Paid plan: Unlimited recipients, no domain verification needed

## Current Configuration

`.env.local`:
```bash
RESEND_API_KEY=re_2aHMAW4U_GCwq9wuye6Tss8QPoxEgkENL
FROM_EMAIL=onboarding@resend.dev
```

## Testing

Send a test email:
```bash
node send-license-email.js
```

## Webhook Email Logic

The webhook (` app/api/razorpay/webhook/route.ts`) will:
1. Create license in Supabase ✅
2. Try to send email to `paymentEntity.email`
3. If email fails (wrong recipient), it logs the error but continues
4. Payment and license creation still work!

## For Production:

1. **Verify your domain** in Resend
2. Update `FROM_EMAIL` to use your domain
3. Remove the restriction - emails will work for all customers

## Workaround for Testing:

Use `choudharm187@gmail.com` when making test payments, then emails will work!

## Sent Successfully:
✅ License email sent to: choudharm187@gmail.com
📧 License Key: LIC-1770673217282-T1BDVMI0
📬 Email ID: 5f0025b8-b973-49eb-81d9-1b698d528bea
