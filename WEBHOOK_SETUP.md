# Razorpay Webhook Setup Guide

## 🚀 What's Been Added

Your webhook now includes:
- ✅ **Supabase Database Integration** - Stores all payment events
- ✅ **Resend Email Integration** - Sends confirmation emails
- ✅ **Complete Event Handling** - Payments, refunds, subscriptions

## 📋 Setup Instructions

### 1. Set Up Supabase Database

1. Go to your Supabase project: [https://supabase.com](https://supabase.com)
2. Navigate to **SQL Editor**
3. Create a new query and paste the contents of `supabase-schema.sql`
4. Run the query to create all tables
5. Your database is ready! ✅

### 2. Configure Resend Email

1. Go to [https://resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add your domain (optional, for custom sender email)
4. Update the `FROM_EMAIL` variable with your verified email

### 3. Environment Variables (Already on Vercel)

You've already added these on Vercel (from your screenshot):
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_KEY`
- ✅ `RESEND_API_KEY`
- ✅ `FROM_EMAIL`
- ✅ `RAZORPAY_WEBHOOK_SECRET`

### 4. Local Development

Update your `.env.local` with real values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 5. Restart Your Server

```bash
npm run dev
```

## 📊 Database Tables Created

### `payments`
Stores all payment transactions (successful and failed)

### `orders`
Stores order information

### `refunds`
Tracks refund requests

### `subscriptions`
Manages subscription events

## 📧 Email Templates

The webhook sends emails for:
- ✅ **Payment Success** - Confirmation with payment details
- ✅ **Payment Failed** - Notification with error details

## 🔍 How It Works

1. **Razorpay** sends webhook event → Your API
2. **Signature verification** ensures security
3. **Supabase** stores the transaction data
4. **Resend** sends confirmation email to customer
5. **Success response** sent back to Razorpay

## 🧪 Testing

### Test the webhook locally:
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Use ngrok to expose local server
npx ngrok http 3000

# Use the ngrok URL in Razorpay webhook settings
```

### View test page:
```
http://localhost:3000/test.html
```

## 📈 Next Steps

1. ✅ Run the SQL schema in Supabase
2. ✅ Update local `.env.local` with real keys
3. ✅ Test webhook locally
4. ✅ Deploy to Vercel (auto-deploys on push)
5. ✅ Update Razorpay webhook URL to production

## 🔐 Security Notes

- Webhook signature is verified before processing
- Environment variables are never exposed
- Database uses Row Level Security (RLS)
- All sensitive data encrypted at rest

## 📝 Customization

### Custom Email Templates
Edit the HTML in the webhook file to customize email design.

### Additional Fields
Add more fields to database tables as needed in `supabase-schema.sql`.

### Event Handling
Add more webhook events in the switch statement.

## 🐛 Debugging

Check logs in:
- **Vercel Dashboard** → Your Project → Logs
- **Supabase Dashboard** → Logs
- **Razorpay Dashboard** → Webhooks → View Deliveries

## 📞 Support

If you encounter issues:
1. Check environment variables are set correctly
2. Verify Supabase tables exist
3. Confirm Razorpay webhook is active
4. Check Vercel deployment logs
