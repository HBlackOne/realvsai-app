import "dotenv/config";
import { db } from "../src/lib/db";

async function check() {
  try {
    const users = await db.$queryRaw`
      SELECT email, "trialScanBalance", "isPaidUser" FROM "User" LIMIT 10
    `;
    console.log("Users in DB:", JSON.stringify(users, null, 2));
  } finally {
    await db.$disconnect();
  }
}

check();
