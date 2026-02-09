#!/bin/bash

echo "Testing License API Endpoints..."
echo ""

echo "1. Testing License Verification:"
curl -X POST http://localhost:3000/api/license/verify \
  -H "Content-Type: application/json" \
  -d '{"license_key":"ACPRO-63FFB-VQ8RV-USUC6-LQ2ZT"}' \
  2>/dev/null

echo ""
echo ""
echo "2. Testing Advertisement API:"
curl -X GET http://localhost:3000/api/advertisement 2>/dev/null

echo ""
echo ""
echo "3. Testing Config API:"
curl -X GET http://localhost:3000/api/config 2>/dev/null

echo ""
