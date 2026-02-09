#!/bin/bash

echo "🚀 Razorpay Test Payment Setup"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your environment variables"
    exit 1
fi

# Check if Razorpay key is in test-payment.html
if grep -q "rzp_test_YOUR_KEY_HERE" public/test-payment.html; then
    echo "⚠️  WARNING: Razorpay Key ID not configured!"
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to: https://dashboard.razorpay.com/app/keys"
    echo "2. Switch to TEST MODE"
    echo "3. Copy your Key ID (starts with rzp_test_)"
    echo "4. Edit public/test-payment.html"
    echo "5. Replace 'rzp_test_YOUR_KEY_HERE' with your actual key"
    echo ""
    read -p "Press Enter after you've updated the key..."
fi

echo "✅ Starting development server..."
echo ""
npm run dev &
SERVER_PID=$!

sleep 3

echo ""
echo "🎉 Server is running!"
echo ""
echo "📋 Test Payment Options:"
echo "================================"
echo ""
echo "1️⃣  Test Payment Page:"
echo "   👉 http://localhost:3000/test-payment.html"
echo ""
echo "2️⃣  API Test Page:"
echo "   👉 http://localhost:3000/test.html"
echo ""
echo "3️⃣  Test Card Details:"
echo "   Card: 4111 1111 1111 1111"
echo "   CVV:  123"
echo "   Expiry: Any future date"
echo ""
echo "================================"
echo ""
echo "📚 Full Guide: RAZORPAY_TEST_GUIDE.md"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Keep script running
wait $SERVER_PID
