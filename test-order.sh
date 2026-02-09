#!/bin/bash

echo "🧪 Testing Razorpay Order Creation..."
echo ""

# Test order creation
response=$(curl -s -X POST http://localhost:3000/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 99900, "currency": "INR"}')

echo "Response:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

echo ""
echo "✅ If you see 'success: true' and a real Razorpay order_id, it's working!"
echo "🔴 If you see an error, check the console output above."
