# RealvsAI — V6 Implementation Fixes
## Code Review Findings — Apply Before Deploy

All fixes must be applied in order.
Run `npx tsc --noEmit` after each fix.
Do not move to the next fix until current one passes.

---

# FIX 1 — hive.ts (CRITICAL)

File: `src/lib/services/hive.ts`

Three things wrong. Fix all three in one pass.

## 1. Endpoint

```ts
// WRONG (current)
const HIVE_SYNC_ENDPOINT = "https://api.thehive.ai/api/v2/task/sync"

// CORRECT
const HIVE_SYNC_ENDPOINT = "https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection"
```

## 2. Auth Header

```ts
// WRONG (current)
Authorization: `Token ${apiKey}`

// CORRECT
Authorization: `Bearer ${apiKey}`
```

## 3. Request Body

```ts
// WRONG (current)
body: JSON.stringify({ url: blobUrl, mediaType })

// CORRECT
body: JSON.stringify({
  media_metadata: true,
  input: [{ media_url: blobUrl }]
})
```

No other changes to this file.
Share tsc result before Fix 2.

---

# FIX 2 — hive-parser.ts (CRITICAL)

File: `src/lib/services/hive-parser.ts`

The parser was written for V2 response shape.
V3 returns a different structure. Fix the parsing logic.

## V3 Real Response Shape

```json
{
  "output": [
    {
      "extra": [
        { "name": "frame_index", "value": 0 },
        { "name": "timestamp",   "value": 0.0 }
      ],
      "classes": [
        { "class": "ai_generated",          "value": 0.95 },
        { "class": "not_ai_generated",       "value": 0.05 },
        { "class": "deepfake",               "value": 0.01 },
        { "class": "midjourney",             "value": 0.88 },
        { "class": "none",                   "value": 0.12 },
        { "class": "ai_generated_audio",     "value": 0.0  },
        { "class": "not_ai_generated_audio", "value": 1.0  }
      ]
    }
  ]
}
```

For video, `output[]` has one item per frame.
For image, `output[]` has one item only.
For audio, `output[]` has one item per 10-second chunk,
classes contain `ai_generated_audio` and `not_ai_generated_audio`.

## Fix collectTopLevelClasses

```ts
// Must extract output[0].classes for image
// Must find frame with highest ai_generated for video
// Return that frame's classes array

function collectTopLevelClasses(raw: HiveRawResponse): HiveClass[] {
  if (!raw || typeof raw !== "object") return [];
  const root = raw as Record<string, unknown>;

  // V3 response: { output: [{ classes: [...] }] }
  if (Array.isArray(root.output) && root.output.length > 0) {
    const frames = root.output as Array<{ classes?: HiveClass[] }>;

    // Find frame with highest ai_generated score
    let bestFrame = frames[0];
    let bestScore = 0;

    for (const frame of frames) {
      const classes = frame.classes ?? [];
      const aiScore = classes.reduce((max, item) => {
        if (getClassName(item) !== "ai_generated") return max;
        return Math.max(max, getClassScore(item));
      }, 0);

      if (aiScore > bestScore) {
        bestScore = aiScore;
        bestFrame = frame;
      }
    }

    return bestFrame?.classes ?? [];
  }

  // Fallback for other shapes
  const candidates = [root.classes, root.response, root.result, root.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as HiveClass[];
  }

  return [];
}
```

## Fix collectAudioChunks

```ts
// V3 audio: same output[] structure
// Each output[i].classes has ai_generated_audio + not_ai_generated_audio

function collectAudioChunks(raw: HiveRawResponse): HiveAudioChunk[] {
  if (!raw || typeof raw !== "object") return [];
  const root = raw as Record<string, unknown>;

  // V3 response: { output: [{ classes: [...] }] }
  if (Array.isArray(root.output) && root.output.length > 0) {
    return (root.output as Array<{ classes?: HiveClass[] }>).map(frame => ({
      classes: frame.classes ?? [],
    }));
  }

  // Fallback
  const candidates = [root.chunks, root.response, root.result, root.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as HiveAudioChunk[];
  }

  return [];
}
```

## Fix Class Field Names

V3 uses `class` and `value` as primary field names.
Keep existing fallbacks but ensure `class`/`value` are read first.

```ts
function getClassName(item: HiveClass) {
  return normalizeClassName(item.class ?? item.label ?? item.name);
}

function getClassScore(item: HiveClass) {
  return toScore(item.value ?? item.score ?? item.confidence);
}
```

This is the correct priority order for V3.

Share tsc result before Fix 3.

---

# FIX 3 — Security + Cleanup (CRITICAL)

## Delete smoke endpoint — exposes user data with no auth

Delete file:
```txt
src/app/api/smoke/route.ts
```

Delete folder:
```txt
src/app/api/smoke/
```

## Delete all tmp files from repo root

```txt
tmp-create-trial-checkout.cjs
tmp-smoke.cjs
tmp-smoke.ts
tmp-smoke.tsx
tmp-step5-smoke.ts
```

These must not exist in production.

Share confirmation after deletion.

---

# FIX 4 — pricing.constants.ts (CRITICAL + IMPORTANT)

File: `src/lib/billing/pricing.constants.ts`

Multiple values are V5 — update all to V6.

## 4a. HIVE_ESTIMATED_COSTS (real confirmed values in cents)

```ts
export const HIVE_ESTIMATED_COSTS = {
  image:   0.6,   // was 2   — $0.006 per image
  audio:   33.4,  // was 25  — $0.334 per avg 2min scan
  video15: 9.0,   // was 80  — $0.09  at 15 frames @ 1FPS
  video30: 9.0,   // was 80  — $0.09  at 15 frames
  video60: 36.0,  // was 150 — $0.36  at 60 frames @ 1FPS
} as const;
```

## 4b. PRICING_MODES growth scanPrices (V6)

```ts
growth: {
  scanPrices: {
    image:      2,   // was 5
    audio:      40,  // unchanged
    videoShort: 30,  // was 100
    deepVideo:  80,  // was 240
  }
}
```

## 4c. PRICING_MODES transition scanPrices (V6)

```ts
transition: {
  scanPrices: {
    image:      2,   // was 5
    audio:      40,  // unchanged
    videoShort: 30,  // was 100
    deepVideo:  80,  // was 240
  }
}
```

## 4d. PRICING_MODES safety scanPrices (V6)

```ts
safety: {
  scanPrices: {
    image:      3,   // was 6
    audio:      50,  // was 45
    videoShort: 40,  // was 110
    deepVideo:  100, // was 320
  }
}
```

## 4e. SUBSCRIPTION_PHASES monthly credits (V6)

```ts
export const SUBSCRIPTION_PHASES = {
  basicNormal: {
    monthlyCredits: 300,  // was 600
  },
  proEarlyAccess: {
    monthlyCredits: 700,  // was 1400
  },
  proLoyalty: {
    monthlyCredits: 600,  // was 1100
  },
  proNormal: {
    monthlyCredits: 500,  // was 900
  },
}
```

## 4f. PROTECTION_LIMITS monthly deep scan caps (V6)

```ts
export const PROTECTION_LIMITS = {
  maxDeepScansPerMonthEarlyAccessPro: 15,  // was 12
  maxDeepScansPerMonthNormalPro:      25,  // was 20
  // all other values stay the same
}
```

## 4g. PRICING_MODES growth walletTopups (V6)

```ts
growth: {
  walletTopups: {
    starter:  { priceCents: 1000, walletValueCents: 500  },  // was 1100
    basic:    { priceCents: 1500, walletValueCents: 800  },  // was 1700
    standard: { priceCents: 2000, walletValueCents: 1100 },  // was 2400
    pro:      { priceCents: 3000, walletValueCents: 1700 },  // was 3600
    elite:    { priceCents: 5000, walletValueCents: 3000 },  // was 6500
  }
}
```

## 4h. PRICING_MODES transition walletTopups (V6)

```ts
transition: {
  walletTopups: {
    starter:  { priceCents: 1000, walletValueCents: 400  },  // was 950
    basic:    { priceCents: 1500, walletValueCents: 650  },  // was 1450
    standard: { priceCents: 2000, walletValueCents: 900  },  // was 2000
    pro:      { priceCents: 3000, walletValueCents: 1400 },  // was 3000
    elite:    { priceCents: 5000, walletValueCents: 2500 },  // was 5200
  }
}
```

## 4i. PRICING_MODES safety walletTopups (V6)

```ts
safety: {
  walletTopups: {
    starter:  { priceCents: 1000, walletValueCents: 400  },  // unchanged
    basic:    { priceCents: 1500, walletValueCents: 650  },  // was 1200
    standard: { priceCents: 2000, walletValueCents: 900  },  // was 1700
    pro:      { priceCents: 3000, walletValueCents: 1400 },  // was 2600
    elite:    { priceCents: 5000, walletValueCents: 2500 },  // was 4500
  }
}
```

Share tsc result before Fix 5.

---

# FIX 5 — scans.ts monthly caps (IMPORTANT)

File: `src/lib/services/scans.ts`

Fix `resolveDeepVideoMonthlyLimit` function.

```ts
// WRONG (current)
if (pricingPhase === PricingPhase.SAFETY)     return 20;
if (pricingPhase === PricingPhase.TRANSITION) return 12;
if (pricingPhase === PricingPhase.GROWTH)     return 12;

// CORRECT (V6)
if (pricingPhase === PricingPhase.SAFETY)     return 25;
if (pricingPhase === PricingPhase.TRANSITION) return 15;
if (pricingPhase === PricingPhase.GROWTH)     return 15;
```

Share tsc result before Fix 6.

---

# FIX 6 — realvsai-site pricing-data.ts (IMPORTANT)

File: `src/components/pricing/pricing-data.ts` in `realvsai-site` repo.

## 6a. CREDIT_PACKS (V6 Growth top-ups)

```ts
export const CREDIT_PACKS = [
  { title: "Starter",  price: "$10", credits: "500 credits",  popular: false, bestValue: false },
  { title: "Basic",    price: "$15", credits: "800 credits",  popular: false, bestValue: false },
  { title: "Standard", price: "$20", credits: "1100 credits", popular: true,  bestValue: false },
  { title: "Pro",      price: "$30", credits: "1700 credits", popular: false, bestValue: false },
  { title: "Elite",    price: "$50", credits: "3000 credits", popular: false, bestValue: true  },
] as const;
```

## 6b. SCAN_COSTS (V6 Growth mode)

```ts
export const SCAN_COSTS = [
  { label: "Image",       cost: "2 cr  ($0.02)" },
  { label: "Audio",       cost: "40 cr ($0.40)" },
  { label: "Short Video", cost: "30 cr ($0.30)" },
  { label: "Deep Video",  cost: "80 cr ($0.80)" },
] as const;
```

## 6c. EARLY_ACCESS_PLANS (V6)

```ts
export const EARLY_ACCESS_PLANS = [
  {
    title:   "Basic",
    price:   "$7.99 / month",
    credits: "300 credits / month",
    features: [
      "Image scans: 2 credits",
      "Audio scans: 40 credits",
      "Short video: 30 credits",
      "No deep video",
      "30 days scan history",
    ],
    highlight: false,
  },
  {
    title:   "Pro — Early Access",
    price:   "$9.99 / month",
    credits: "700 credits / month",
    features: [
      "Image scans: 2 credits",
      "Audio scans: 40 credits",
      "Short video: 30 credits",
      "Deep video: 80 credits",
      "15 deep scans / month",
      "Full result breakdown",
      "Priority processing",
      "Shareable result links",
      "Credit rollover up to 50%",
    ],
    highlight: true,
  },
] as const;
```

Share tsc result before Fix 7.

---

# FIX 7 — Docs Folder Cleanup (MINOR)

In `realvsai-app` repo:

```txt
Delete:  docs/hybrid-pricing-strategy-v2.md
Keep:    docs/hybrid-pricing-strategy-v5.md
Add:     docs/hybrid-pricing-strategy-v6.md
```

For the V6 file content — Soufyane has the V6 MD file.
Copy it into docs/hybrid-pricing-strategy-v6.md.

---

# Post-Fix Checklist

After all 7 fixes:

```txt
□ tsc --noEmit passes on realvsai-app
□ tsc --noEmit passes on realvsai-site
□ Full build passes: NODE_OPTIONS=--max-old-space-size=4096 npx next build
□ /api/smoke endpoint no longer exists
□ All tmp files deleted from root
□ Hive V3 endpoint confirmed in hive.ts
□ HIVE_ESTIMATED_COSTS updated to real values
□ SUBSCRIPTION_PHASES credits match V6
□ PROTECTION_LIMITS caps match V6
□ resolveDeepVideoMonthlyLimit returns 15/15/25
□ Site pricing-data.ts matches V6
□ docs/hybrid-pricing-strategy-v6.md added
```

When all pass — share results.
Full workflow review starts after. 🚀
