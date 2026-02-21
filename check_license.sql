-- Check the license that's showing as expired
SELECT 
  license_key,
  email,
  status,
  expires_at,
  created_at,
  CASE 
    WHEN expires_at IS NULL THEN 'LIFETIME (NULL)'
    WHEN expires_at > NOW() THEN 'VALID'
    ELSE 'EXPIRED'
  END as expiry_status
FROM licenses 
WHERE license_key LIKE 'ACPRO-%'
ORDER BY created_at DESC
LIMIT 10;
