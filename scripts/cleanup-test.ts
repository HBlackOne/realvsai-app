import "dotenv/config";
import { db } from "../src/lib/db";

async function cleanup() {
  try {
    const result = await db.$executeRaw`
      DELETE FROM "User" WHERE email LIKE 'test-validation-%@realvsai.test'
    `;
    console.log(`Deleted ${result} test user(s)`);
  } finally {
    await db.$disconnect();
  }
}

cleanup();
