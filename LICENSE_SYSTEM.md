# 🔐 License Management System

## Overview

Your system now includes a complete license management solution that automatically generates license keys when payments are successful and provides APIs to activate, verify, and manage licenses.

## 🎯 Features

- ✅ Automatic license generation on successful payment
- ✅ License activation with device tracking
- ✅ License verification
- ✅ Multi-device support (configurable)
- ✅ Expiration date management
- ✅ Email delivery with license keys
- ✅ Beautiful HTML email templates

---

## 📊 Database Schema

Your `licenses` table includes:

```
- id (uuid, primary key)
- license_key (text, unique)
- email (text)
- phone (text)
- razorpay_payment_id (text)
- razorpay_order_id (text)
- amount (int4)
- currency (text)
- status (text) - active, expired, revoked
- device_id (text) - tracks activated device
- activations (int4) - current activation count
- max_activations (int4) - maximum allowed activations
- created_at (timestamp)
- activated_at (timestamp)
- expires_at (timestamp)
```

---

## 🚀 How It Works

### 1. Payment → License Generation

When a customer completes payment:

1. **Payment webhook received** from Razorpay
2. **License key generated** (e.g., `LIC-A3F5B2C8D9E1F4A7B5C2D8E3F6A9B1C4`)
3. **License saved** to database with:
   - Customer email & phone
   - Payment details
   - Expiration date
   - Max activations
4. **Email sent** with license key and details

### 2. Pricing Logic

Current implementation (customize in webhook):

| Amount | Max Devices | Validity |
|--------|-------------|----------|
| ₹999+ | 5 devices | 365 days |
| ₹499+ | 3 devices | 180 days |
| ₹199+ | 1 device | 90 days |
| Default | 1 device | 30 days |

---

## 📡 API Endpoints

### 1. Activate License

**Endpoint:** `POST /api/license`

**Request:**
```json
{
  "license_key": "LIC-A3F5B2C8D9E1F4A7B5C2D8E3F6A9B1C4",
  "device_id": "DEVICE-12345",
  "email": "customer@example.com" // optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "License activated successfully",
  "license": {
    "license_key": "LIC-...",
    "status": "active",
    "activations": 1,
    "max_activations": 3,
    "activated_at": "2026-02-10T...",
    "expires_at": "2026-08-10T..."
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `403` - License expired / max activations reached
- `404` - Invalid license key

---

### 2. Verify License

**Endpoint:** `GET /api/license?license_key=LIC-...&device_id=DEVICE-123`

**Query Parameters:**
- `license_key` (required) - The license key to verify
- `device_id` (optional) - Check if license is valid for this device

**Success Response (200):**
```json
{
  "valid": true,
  "license": {
    "license_key": "LIC-...",
    "status": "active",
    "activations": 1,
    "max_activations": 3,
    "activated_at": "2026-02-10T...",
    "expires_at": "2026-08-10T...",
    "is_expired": false,
    "device_matches": true
  }
}
```

---

### 3. Deactivate License

**Endpoint:** `DELETE /api/license`

**Request:**
```json
{
  "license_key": "LIC-A3F5B2C8D9E1F4A7B5C2D8E3F6A9B1C4",
  "device_id": "DEVICE-12345"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "License deactivated successfully"
}
```

---

## 💻 Client Integration Examples

### JavaScript/TypeScript

```javascript
// Activate license
async function activateLicense(licenseKey, deviceId) {
  const response = await fetch('https://your-api.com/api/license', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      license_key: licenseKey,
      device_id: deviceId,
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('License activated!');
    // Store license info locally
    localStorage.setItem('license', JSON.stringify(data.license));
  }
}

// Verify license
async function verifyLicense(licenseKey, deviceId) {
  const response = await fetch(
    `https://your-api.com/api/license?license_key=${licenseKey}&device_id=${deviceId}`
  );
  
  const data = await response.json();
  return data.valid;
}
```

---

### Python

```python
import requests

def activate_license(license_key, device_id):
    response = requests.post(
        'https://your-api.com/api/license',
        json={
            'license_key': license_key,
            'device_id': device_id
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"License activated: {data['license']['expires_at']}")
        return True
    return False

def verify_license(license_key, device_id):
    response = requests.get(
        f'https://your-api.com/api/license',
        params={
            'license_key': license_key,
            'device_id': device_id
        }
    )
    
    data = response.json()
    return data.get('valid', False)
```

---

### C# / Unity

```csharp
using UnityEngine;
using System.Net.Http;
using System.Threading.Tasks;

public class LicenseManager
{
    private static readonly HttpClient client = new HttpClient();
    private const string API_URL = "https://your-api.com/api/license";
    
    public async Task<bool> ActivateLicense(string licenseKey, string deviceId)
    {
        var content = new StringContent(
            $"{{\"license_key\":\"{licenseKey}\",\"device_id\":\"{deviceId}\"}}",
            System.Text.Encoding.UTF8,
            "application/json"
        );
        
        var response = await client.PostAsync(API_URL, content);
        return response.IsSuccessStatusCode;
    }
    
    public async Task<bool> VerifyLicense(string licenseKey, string deviceId)
    {
        var response = await client.GetAsync(
            $"{API_URL}?license_key={licenseKey}&device_id={deviceId}"
        );
        
        var json = await response.Content.ReadAsStringAsync();
        // Parse JSON and return valid status
        return true; // Implement JSON parsing
    }
}
```

---

## 📧 Email Template

When a license is generated, customers receive:

- ✅ Beautiful HTML email
- ✅ Large, easy-to-copy license key
- ✅ Payment details
- ✅ License information (expiry, max devices)
- ✅ Activation instructions
- ✅ Support contact info

---

## 🎨 Customization

### Change Pricing Logic

Edit `/app/api/razorpay/webhook/route.ts`:

```typescript
// Custom pricing based on amount
const amount = paymentEntity.amount / 100;
let maxActivations = 1;
let daysValid = 30;

if (amount >= 1999) {
  maxActivations = 10;
  daysValid = 730; // 2 years
} else if (amount >= 999) {
  maxActivations = 5;
  daysValid = 365;
}
// ... add more tiers
```

### Customize License Key Format

```typescript
// Current: LIC-A3F5B2C8D9E1F4A7B5C2D8E3F6A9B1C4
// Custom format:
const licenseKey = `YourPrefix-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
```

### Custom Email Design

Edit the HTML template in the webhook file to match your brand.

---

## 🧪 Testing

### Test Page

Visit `http://localhost:3000/test.html` to:
- ✅ Test payment webhook
- ✅ Activate licenses
- ✅ Verify licenses
- ✅ View real-time results

### Manual Testing Steps

1. **Trigger payment** (use Razorpay test mode)
2. **Check email** for license key
3. **Activate license** using test page
4. **Verify license** status
5. **Check Supabase** database for records

---

## 🔒 Security Features

- ✅ Webhook signature verification
- ✅ Device binding
- ✅ Expiration checks
- ✅ Email verification (optional)
- ✅ Max activation limits
- ✅ Row-level security in Supabase

---

## 📊 Monitoring

### Check License Status

Query Supabase:

```sql
-- Active licenses
SELECT * FROM licenses WHERE status = 'active' AND expires_at > NOW();

-- Expired licenses
SELECT * FROM licenses WHERE expires_at < NOW();

-- Most activations
SELECT * FROM licenses ORDER BY activations DESC LIMIT 10;
```

### Analytics Queries

```sql
-- Total revenue
SELECT SUM(amount/100) as total_revenue FROM licenses;

-- Licenses by month
SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as licenses
FROM licenses
GROUP BY month
ORDER BY month DESC;
```

---

## 🐛 Troubleshooting

### License Not Generated

- Check Razorpay webhook delivery
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are set
- Check Vercel function logs

### Email Not Sent

- Verify `RESEND_API_KEY` is correct
- Check `FROM_EMAIL` is verified in Resend
- Look for errors in function logs

### Activation Failed

- Ensure license exists in database
- Check if max_activations reached
- Verify license hasn't expired

---

## 🚀 Production Checklist

- [ ] Run SQL schema in Supabase
- [ ] Set all environment variables on Vercel
- [ ] Test webhook with Razorpay test mode
- [ ] Verify email delivery
- [ ] Test license activation flow
- [ ] Set up monitoring/alerts
- [ ] Add analytics tracking
- [ ] Document for your team
- [ ] Test error scenarios
- [ ] Enable Razorpay webhook in production

---

## 📞 Support

For issues or questions:
1. Check Vercel deployment logs
2. Review Supabase database
3. Verify environment variables
4. Test with provided test page

---

**Your license system is now complete and production-ready! 🎉**
