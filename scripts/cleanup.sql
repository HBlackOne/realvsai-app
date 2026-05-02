-- Direct SQL cleanup
DELETE FROM "Transaction" WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE 'test-validation-%@realvsai.test'
);
DELETE FROM "Scan" WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE 'test-validation-%@realvsai.test'
);
DELETE FROM "Subscription" WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE 'test-validation-%@realvsai.test'
);
DELETE FROM "Wallet" WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE 'test-validation-%@realvsai.test'
);
DELETE FROM "User" WHERE email LIKE 'test-validation-%@realvsai.test';
