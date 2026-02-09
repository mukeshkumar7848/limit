# 🔑 License Management System Documentation

## Overview

Your API now includes a complete license management system that:
- ✅ Auto-generates licenses on successful payments
- ✅ Sends license keys via email
- ✅ Validates and activates licenses
- ✅ Manages device bindings
- ✅ Tracks license status and expiry

---

## 📊 Database Structure

Your Supabase `licenses` table has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `license_key` | text | Unique license key (LIC-...) |
| `email` | text | Customer email |
| `phone` | text | Customer phone |
| `razorpay_payment_id` | text | Payment reference |
| `razorpay_order_id` | text | Order reference |
| `amount` | int4 | Purchase amount |
| `currency` | text | Currency code |
| `status` | text | active/revoked/expired |
| `device_id` | text | Bound device ID |
| `activations` | int4 | Activation count |
| `max_activations` | int4 | Max allowed activations |
| `created_at` | timestamp | Creation date |
| `activated_at` | timestamp | First activation date |
| `expires_at` | timestamp | Expiry date |

---

## 🔄 Payment Flow

### When a customer pays via Razorpay:

1. **Payment Captured** → Webhook triggered
2. **License Generated** → Unique key created
3. **Saved to Database** → License stored in Supabase
4. **Email Sent** → Customer receives license key via Resend
5. **Ready to Activate** → Customer can activate on their device

---

## 🎯 API Endpoints

### 1️⃣ Verify License (GET Info)

**Endpoint:** `POST /api/license/verify`

**Request:**
```json
{
  "license_key": "LIC-1234567890-ABC123XY"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "license": {
    "license_key": "LIC-1234567890-ABC123XY",
    "status": "active",
    "expires_at": "2027-02-10T00:00:00.000Z",
    "activations": 0,
    "max_activations": 1,
    "is_activated": false
  }
}
```

**Response (Invalid):**
```json
{
  "error": "Invalid license key"
}
```

---

### 2️⃣ Activate License (Bind to Device)

**Endpoint:** `POST /api/license/verify`

**Request:**
```json
{
  "license_key": "LIC-1234567890-ABC123XY",
  "device_id": "device-abc-123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "License activated successfully",
  "license": {
    "license_key": "LIC-1234567890-ABC123XY",
    "status": "active",
    "expires_at": "2027-02-10T00:00:00.000Z",
    "activated_at": "2026-02-10T12:00:00.000Z",
    "activations": 1,
    "max_activations": 1
  }
}
```

**Response (Already Activated):**
```json
{
  "error": "License already activated on another device",
  "device_id": "different-device-id"
}
```

---

### 3️⃣ Deactivate License (Remove Device Binding)

**Endpoint:** `POST /api/license/manage`

**Request:**
```json
{
  "license_key": "LIC-1234567890-ABC123XY",
  "action": "deactivate"
}
```

**Response:**
```json
{
  "success": true,
  "message": "License deactivated successfully",
  "license": {
    "license_key": "LIC-1234567890-ABC123XY",
    "status": "active",
    "device_id": null
  }
}
```

**Use Case:** Customer wants to move license to a new device

---

### 4️⃣ Revoke License (Permanently Disable)

**Endpoint:** `POST /api/license/manage`

**Request:**
```json
{
  "license_key": "LIC-1234567890-ABC123XY",
  "action": "revoke"
}
```

**Response:**
```json
{
  "success": true,
  "message": "License revoked successfully",
  "license": {
    "license_key": "LIC-1234567890-ABC123XY",
    "status": "revoked",
    "device_id": null
  }
}
```

**Use Case:** Refund issued, piracy detected, or customer requested cancellation

---

## 📧 Email Template

When payment is successful, customer receives:

```
Subject: Payment Successful! 🎉 Your License Key

Your License Key:
LIC-1234567890-ABC123XY

Payment Details:
- Payment ID: pay_xxxxx
- Amount: INR 999.00
- Status: captured
- Expires: Feb 10, 2027
- Max Activations: 1 device

How to Activate:
1. Open the application
2. Enter your license key
3. Click "Activate"
4. Start using your product!
```

---

## 🔒 Security Features

### ✅ Validation Checks

1. **License Existence** - Key must exist in database
2. **Expiry Check** - Must not be past expiration date
3. **Status Check** - Must be "active" status
4. **Device Binding** - Can only activate on one device
5. **Activation Limit** - Respects max_activations setting

### ✅ Protection Against

- ❌ License key sharing (device binding)
- ❌ Unlimited activations (activation limits)
- ❌ Expired license usage (expiry validation)
- ❌ Revoked license reuse (status checking)

---

## 💻 Integration Examples

### JavaScript/TypeScript (Frontend)

```javascript
// Verify license
async function verifyLicense(licenseKey) {
  const response = await fetch('https://yourapi.com/api/license/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ license_key: licenseKey })
  });
  return await response.json();
}

// Activate license
async function activateLicense(licenseKey, deviceId) {
  const response = await fetch('https://yourapi.com/api/license/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      license_key: licenseKey,
      device_id: deviceId 
    })
  });
  return await response.json();
}
```

### Python

```python
import requests

def verify_license(license_key):
    response = requests.post(
        'https://yourapi.com/api/license/verify',
        json={'license_key': license_key}
    )
    return response.json()

def activate_license(license_key, device_id):
    response = requests.post(
        'https://yourapi.com/api/license/verify',
        json={
            'license_key': license_key,
            'device_id': device_id
        }
    )
    return response.json()
```

### cURL

```bash
# Verify
curl -X POST https://yourapi.com/api/license/verify \
  -H "Content-Type: application/json" \
  -d '{"license_key":"LIC-1234567890-ABC123XY"}'

# Activate
curl -X POST https://yourapi.com/api/license/verify \
  -H "Content-Type: application/json" \
  -d '{"license_key":"LIC-1234567890-ABC123XY","device_id":"device-123"}'
```

---

## 🎮 Testing

### Test Page
Visit: `http://localhost:3000/test.html`

The test page includes:
- ✅ License verification form
- ✅ License activation with device ID
- ✅ Deactivation testing
- ✅ Revocation testing

### Manual Testing Steps

1. **Create a test payment** in Razorpay (test mode)
2. **Check email** for license key
3. **Copy license key** from email
4. **Verify** license on test page
5. **Activate** with a test device ID
6. **Try activating again** with different device (should fail)
7. **Deactivate** the license
8. **Activate** with new device ID (should work)

---

## 📝 Customization Options

### Change License Duration

In `webhook/route.ts`, modify expiry calculation:

```typescript
// 1 year (current)
expiresAt.setFullYear(expiresAt.getFullYear() + 1);

// 1 month
expiresAt.setMonth(expiresAt.getMonth() + 1);

// Lifetime (100 years)
expiresAt.setFullYear(expiresAt.getFullYear() + 100);
```

### Change Max Activations

```typescript
max_activations: 1,  // Single device
max_activations: 3,  // Up to 3 devices
max_activations: 999, // Unlimited
```

### Custom License Key Format

```typescript
// Current format: LIC-1707654321-ABC123XY
const licenseKey = `LIC-${Date.now()}-${Math.random()...}`;

// Custom format: MYAPP-2026-XXXXXXXXXX
const licenseKey = `MYAPP-${new Date().getFullYear()}-${...}`;
```

---

## 🚨 Error Codes

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | License key is required | Missing license_key in request |
| 403 | License has expired | Past expiration date |
| 403 | License is revoked | Status is not "active" |
| 403 | Already activated on another device | Different device_id bound |
| 403 | Maximum activation limit reached | Hit max_activations |
| 404 | Invalid license key | Key not found in database |
| 500 | Internal server error | Database or server issue |

---

## 🔄 Maintenance Tasks

### Check Expired Licenses

Run this SQL in Supabase to find expired licenses:

```sql
SELECT * FROM licenses 
WHERE expires_at < NOW() 
AND status = 'active';
```

### Update Expired Licenses Status

```sql
UPDATE licenses 
SET status = 'expired' 
WHERE expires_at < NOW() 
AND status = 'active';
```

### View Active Licenses

```sql
SELECT 
  license_key, 
  email, 
  status, 
  device_id,
  expires_at 
FROM licenses 
WHERE status = 'active' 
ORDER BY created_at DESC;
```

---

## 📊 Analytics Queries

### Total Revenue
```sql
SELECT 
  SUM(amount) as total_revenue,
  currency
FROM licenses 
WHERE status != 'revoked'
GROUP BY currency;
```

### Active Users
```sql
SELECT COUNT(*) as active_users 
FROM licenses 
WHERE status = 'active' 
AND device_id IS NOT NULL;
```

### Activation Rate
```sql
SELECT 
  COUNT(CASE WHEN device_id IS NOT NULL THEN 1 END) as activated,
  COUNT(*) as total,
  ROUND(COUNT(CASE WHEN device_id IS NOT NULL THEN 1 END)::numeric / COUNT(*) * 100, 2) as activation_rate_percent
FROM licenses 
WHERE status = 'active';
```

---

## 🎯 Production Checklist

- [ ] Run SQL schema in production Supabase
- [ ] Update environment variables on Vercel
- [ ] Test payment flow end-to-end
- [ ] Verify email delivery
- [ ] Test license activation
- [ ] Set up monitoring/alerts
- [ ] Document customer support process
- [ ] Create refund/revocation policy

---

## 📞 Support

For customer support, you can:
1. Check license status in Supabase dashboard
2. Deactivate license to allow device change
3. Extend expiry date if needed
4. Revoke license for refunds

All operations can be done directly in Supabase UI or via API.
