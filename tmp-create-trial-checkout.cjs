const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

function loadEnv(path) {
  const text = fs.readFileSync(path, 'utf8');
  for (const line of text.split(/\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    let val = rest.join('=');
    val = val.replace(/^"|"$/g, '');
    process.env[key] ||= val;
  }
}

loadEnv('.env');

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const stamp = Date.now();
  const email = `realvsai.ls.test+${stamp}@example.com`;
  const user = await db.user.create({
    data: {
      clerkUserId: `ls_test_${stamp}`,
      email,
      firstName: 'LS',
      lastName: 'Test',
      earlyAccessEligible: true,
    },
  });

  const variantId = process.env.LS_VARIANT_PRO_TRIAL_EA;
  const storeId = process.env.LS_STORE_ID;
  const apiKey = process.env.LS_API_KEY;
  if (!variantId || !storeId || !apiKey) throw new Error('Missing LS env for checkout generation');

  const custom = {
    userId: String(user.id),
    clerkUserId: String(user.clerkUserId),
    type: 'trial_subscription',
    planId: 'pro',
    subscriptionPlan: 'pro',
    trialRoute: 'pro_trial_early_access',
    earlyAccessEligible: 'true',
    monthlyCredits: '1400',
    subscriptionPriceCents: '999',
    subscriptionPriceLocked: 'true',
  };

  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          test_mode: true,
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.realvs.ai'}/billing/success`,
            enabled_variants: [Number(variantId)],
          },
          checkout_data: {
            email,
            name: 'LS Test',
            custom,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: String(storeId) } },
          variant: { data: { type: 'variants', id: String(variantId) } },
        },
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    console.error(JSON.stringify(payload, null, 2));
    throw new Error(payload?.errors?.[0]?.detail || 'Failed to create LS checkout');
  }

  console.log(JSON.stringify({
    userId: user.id,
    email,
    route: 'pro_trial_early_access',
    variantId,
    checkoutUrl: payload?.data?.attributes?.url,
  }, null, 2));
}

main().finally(() => db.$disconnect());
