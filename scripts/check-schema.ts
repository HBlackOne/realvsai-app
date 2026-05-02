import "dotenv/config";
import { db } from "../src/lib/db";

async function checkColumns() {
  try {
    const cols = await db.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'User'
      AND column_name IN ('trialScanBalance', 'trialVideoScans', 'trialAudioScans', 'isPaidUser')
    `;
    console.log("User columns found:", cols);
    console.log("\nChecking Subscription columns...");
    const subCols = await db.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Subscription'
      AND column_name = 'trialVariantId'
    `;
    console.log("Subscription trialVariantId:", subCols);
  } finally {
    await db.$disconnect();
  }
}

checkColumns().catch((e) => { console.error(e.message); process.exit(1); });
