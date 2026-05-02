import "dotenv/config";
import { db } from "../src/lib/db";

async function checkAndCleanup() {
  try {
    // Show all test-validation users
    const users = await db.$queryRaw`
      SELECT email, "trialScanBalance", "isPaidUser", "clerkUserId" FROM "User" 
      WHERE email LIKE 'test-validation-%@realvsai.test'
      ORDER BY createdAt DESC
    `;
    console.log("Before cleanup:", JSON.stringify(users, null, 2));

    // Delete all test-validation users
    const deleted = await db.$executeRaw`
      DELETE FROM "User" WHERE email LIKE 'test-validation-%@realvsai.test'
    `;
    console.log(`\nDeleted ${deleted} user(s)`);

    // Confirm they're gone
    const remaining = await db.$queryRaw`
      SELECT email FROM "User" WHERE email LIKE 'test-validation-%@realvsai.test'
    `;
    console.log("Remaining after cleanup:", JSON.stringify(remaining, null, 2));

    await db.$disconnect();
  } catch (e) {
    console.error("Error:", e);
    await db.$disconnect();
  }
}

checkAndCleanup();
