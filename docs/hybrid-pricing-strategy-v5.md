# RealvsAI — Hybrid Pricing Strategy (Growth → Safety) v5

## Purpose
This document is the single source of truth for RealvsAI pricing strategy.
It covers every layer from cost assumptions to profit math, user acquisition,
protection rules, and monetization features.

Sections are ordered by dependency — read top to bottom during development.
Do not skip sections. Each one builds on the previous.

---

# 1. Core Credit System

Internal wallet rule:

```txt
$1 = 100 credits
```

Examples:

```txt
$0.05 = 5 credits
$0.40 = 40 credits
$2.99 = 299 credits
```

Credits are an internal usage currency only.

```txt
User payment amount ≠ exact wallet value
```

The user receives a predefined credit bundle.
The real cash received after LemonSqueezy fees and taxes is always lower.

---

# 2. HiveAPI Cost Assumptions

Backend cost reference. Never expose these numbers publicly.

| Media Type       | Estimated Hive Cost |
|------------------|--------------------:|
| Image scan       | ~$0.02              |
| Audio scan       | ~$0.25              |
| Short video scan | ~$0.80              |
| Deep video scan  | ~$1.50              |

All pricing logic in this document is built on top of these numbers.

---

# 3. LemonSqueezy Tax + Fee Logic

RealvsAI uses USD pricing in LemonSqueezy.

LemonSqueezy deducts:

- VAT / tax when applicable (varies by country)
- LemonSqueezy platform fee
- Fixed transaction fee
- Possible international / payment method fees

Conservative planning rule:

```txt
Net received ≈ 70% of displayed price
```

| User Pays | Approx Net After LS + Tax |
|----------:|--------------------------:|
| $7.99     | ~$5.50                    |
| $9.99     | ~$7.00                    |
| $12.99    | ~$9.10                    |
| $14.99    | ~$10.50                   |
| $30.00    | ~$21.00                   |
| $50.00    | ~$35.00                   |

> 70% is worst-case EU with VAT. US customers yield slightly more.
> Keep 70% as the planning rule — it protects you in all regions.

Do not manually handle tax in your app.
Let LemonSqueezy collect and remit all taxes automatically.

---

# 4. Pricing Calculation + Profit Summary

## How Pricing Was Built

```txt
Hive cost
→ add margin buffer
→ account for LS/tax net loss
→ round into simple user-friendly credit costs
→ create plans with controlled credit amounts
```

## Net Per Credit by Plan

| Plan            | Price   | Net (~70%) | Credits | Net per Credit |
|-----------------|--------:|-----------:|--------:|---------------:|
| EA Pro Growth   | $9.99   | ~$7.00     | 1400    | ~$0.005        |
| Loyalty Pro     | $12.99  | ~$9.10     | 1100    | ~$0.00827      |
| Basic Safety    | $7.99   | ~$5.50     | 400     | ~$0.01375      |
| Pro Safety      | $14.99  | ~$10.50    | 900     | ~$0.01167      |

> EA Pro Growth has the lowest net per credit.
> Monthly deep scan caps are mandatory to prevent losses on heavy users.

## Profit Summary — Typical User

Assumes a typical user doing **2 deep video + 5 image + 2 audio** scans per month.

```txt
Typical Hive cost per user:
  2 deep video × $1.50 = $3.00
  5 image      × $0.02 = $0.10
  2 audio      × $0.25 = $0.50
  Total                = $3.60
```

| Plan          | Price   | Net (~70%) | Hive Cost (typical) | Estimated Profit |
|---------------|--------:|-----------:|--------------------:|-----------------:|
| EA Pro Growth | $9.99   | ~$7.00     | ~$3.60              | **~$3.40**       |
| Loyalty Pro   | $12.99  | ~$9.10     | ~$3.60              | **~$5.50**       |
| Basic Safety  | $7.99   | ~$5.50     | ~$3.60              | **~$1.90**       |
| Pro Safety    | $14.99  | ~$10.50    | ~$3.60              | **~$6.90**       |

## Worst-Case — Heavy User

```txt
EA Pro Growth — 12 deep scans/month (monthly cap hit):
  12 × $1.50 = $18.00 Hive cost
  Net received = ~$7.00
  Theoretical loss = -$11.00

Pro Safety — 20 deep scans/month (monthly cap hit):
  20 × $1.50 = $30.00 Hive cost
  Net received = ~$10.50
  Theoretical loss = -$19.50
```

> These losses are theoretical only.
> The internal cost alert hard stop (Section 12) throttles the user
> before Hive costs reach 120% of net plan revenue.
> The worst case above is never reached in practice if Section 12 is active.

---

# 5. Scan Credit Pricing Logic

## Growth Mode

Used during Phase 1. Priority is user acquisition.

| Scan Type   | Credits | Public Value |
|-------------|--------:|-------------:|
| Image       | 5 cr    | $0.05        |
| Audio       | 40 cr   | $0.40        |
| Short video | 100 cr  | $1.00        |
| Deep video  | 240 cr  | $2.40        |

> ⚠️ Short video earns ~$0.50 net vs $0.80 Hive cost in Growth mode.
> Deep video earns ~$1.20 net vs $1.50 Hive cost.
> Daily + monthly caps are the only protection here.

## Safety Mode

Used during Phase 3. Priority is profitability.

| Scan Type   | Credits | Public Value |
|-------------|--------:|-------------:|
| Image       | 6 cr    | $0.06        |
| Audio       | 45 cr   | $0.45        |
| Short video | 110 cr  | $1.10        |
| Deep video  | 320 cr  | $3.20        |

> ✅ Pro Safety: deep video earns ~$3.73 net vs $1.50 Hive cost = +$2.23 margin.

---

# 6. Why Deep Video Must Stay Expensive

Deep video is the highest HiveAPI cost item.

```txt
Deep video Hive cost ≈ $1.50
```

Safe public value target at all times:

```txt
Deep video public value = $2.40 minimum (Growth) → $3.20 (Safety)
```

This range covers:

- Hive API cost
- LemonSqueezy fees and VAT
- Failed scans and retries
- Profit margin

Never price deep video below $2.40 public value under any circumstance.

---

# 7. Free Trial Logic

## Plan Availability

```txt
Free trial → Pro plan ONLY
Basic plan → no trial, direct paid signup
```

> Basic has no trial. The trial is a Pro acquisition tool only.
> Users who want to try must enter via Pro.
> This protects HiveAPI budget and raises perceived value of Pro.

## Setup

```txt
Plan:             Pro only
Duration:         7 days
Credits granted:  500
Credit card:      required to activate
Charge:           none during trial period
Cancel warning:   yes, 2-step sequence before charge
Converts to:      Normal Pro $14.99/mo after trial ends
```

> EA-eligible users: see Section 8 for conversion rate after trial.
> Trial conversion logic lives in Section 8, not here.

## Payment Method Fingerprint Lock

To prevent the same payment method being used to claim multiple free trials
across different accounts.

### Rule

```txt
One payment method = one free trial. Permanently. No exceptions.
```

The fingerprint is locked forever after first trial use:

```txt
Account deleted         → fingerprint stays locked ✅
User changes email      → fingerprint stays locked ✅
User contacts support   → fingerprint stays locked ✅
Years pass              → fingerprint stays locked ✅
```

### What gets fingerprinted

LemonSqueezy provides a hashed payment method fingerprint in the webhook.
This covers all payment methods LS supports:

```txt
✅ Credit / debit cards
✅ PayPal
✅ Any other method LemonSqueezy supports
```

One check covers all. No per-type logic needed.

### DB Table

```txt
payment_fingerprints
--------------------
fingerprint      VARCHAR unique   ← hashed, from LS webhook, never raw card data
user_id          FK → users       ← first account that activated trial with it
locked_at        TIMESTAMP
```

This table is write-once, never updated, never deleted.

### Flow — New Payment Method

```txt
User enters trial checkout
→ links card or PayPal
→ LS saves payment method (no charge)
→ LS fires webhook
→ backend extracts fingerprint
→ check payment_fingerprints table → not found
→ insert fingerprint + lock permanently
→ activate trial
→ redirect → /trial/result?success=true
```

### Flow — Already Used Payment Method

```txt
User enters trial checkout
→ links card or PayPal
→ LS saves payment method (no charge)
→ LS fires webhook
→ backend extracts fingerprint
→ check payment_fingerprints table → match found
→ do NOT activate trial
→ flag account in admin panel
→ redirect → /trial/result?success=false
```

### Result Page

Single page, two states based on query param:

```txt
/trial/result?success=true
→ "Your free trial is active. Start scanning."

/trial/result?success=false
→ "This payment method was already used for a free trial."
→ [Explore Pro]      [Buy Credits]
   /subscribe         /credits
```

> No mention of trying again with another card.
> The blocked state is a soft sales page, not an error page.
> Tone stays clean and neutral — turns blocked users into potential buyers.

### Important: Fingerprint Lock = Trial Only

```txt
Fingerprint already used + order = trial       → block ✅
Fingerprint already used + order = paid plan   → allow ✅
Fingerprint already used + order = top-up      → allow ✅
```

The lock applies to free trial activation only.
Paid purchases always go through regardless of fingerprint history.

## Cancel Warning Email Sequence

```txt
Day 5 → soft reminder
  Subject: "2 days left on your trial"
  Body: show exactly how many credits the user consumed
        + what they will lose if they cancel
        + reinforce value before decision moment

Day 7 → hard warning
  Subject: "Last chance — cancel by tonight to avoid being charged"
  Body: clear cancel link + what they lose
```

> Day 5 email must show real usage data pulled from the user's account.
> Generic emails without usage stats have lower retention impact.

---

# 8. Early Access Logic

All EA logic lives here. Section 7 handles trial mechanics only.

## What Early Access Is

```txt
Early Access = discounted Pro rate for first users
Plan:    Pro only
Price:   $9.99/mo (vs normal $14.99/mo)
```

## Trial → Conversion for EA Users

```txt
if user.isEarlyAccess === true:
    trial converts to EA Pro at $9.99/mo

if user.isEarlyAccess === false:
    trial converts to Normal Pro at $14.99/mo
```

## EA Pricing Progression

EA users do not jump directly from $9.99 to $14.99.
A loyalty step absorbs the price increase across two months.

| Phase     | Plan             | Price     | Credits |
|-----------|------------------|----------:|--------:|
| Month 1–3 | Early Access Pro | $9.99/mo  | 1400    |
| Month 4–5 | Loyalty Pro      | $12.99/mo | 1100    |
| Month 6+  | Normal Pro       | $14.99/mo | 900     |

> Without the loyalty step users face +50% price and -36% credits at the same time.
> That combination is a major churn trigger.
> The loyalty step spreads the adjustment across 2 months.

## Backend Logic

```txt
if user.earlyAccess === true:
    show early_access_pro_checkout

else if user.loyaltyPhase === true:
    show loyalty_pro_checkout

else:
    show normal_pro_checkout
```

## LemonSqueezy Variants

```txt
basic_monthly_normal       = $7.99
pro_monthly_normal         = $14.99
pro_monthly_loyalty        = $12.99
pro_monthly_early_access   = $9.99
```

---

# 9. Phase 1 — Growth Mode

## Duration
First 1–3 months.

## Goal
Maximize conversions. Make the product feel generous.

## Plans

### Early Access Pro

| Plan             | Price    | Credits | Deep Scans/day | Deep Scans/month |
|------------------|---------:|--------:|---------------:|-----------------:|
| Early Access Pro | $9.99/mo | 1400    | 5 max          | 12 max           |

> Without monthly cap: 5/day × 30 days = 150 deep scans possible
> 150 × $1.50 = $225 Hive cost on a ~$7.00 net plan. Cap is non-negotiable.

### Basic

| Plan  | Price    | Credits |
|-------|---------:|--------:|
| Basic | $7.99/mo | 600     |

## Top-Ups — Growth Mode

| User Pays | Credits Given |
|----------:|--------------:|
| $10       | 1100          |
| $15       | 1700          |
| $20       | 2400          |
| $30       | 3600          |
| $50       | 6500          |

## Why This Works

```txt
- Fast conversion from generous perceived value
- Most users never max their credits
- Monthly + daily caps protect HiveAPI budget
- Unused credits = pure margin
```

---

# 10. Phase 2 — Transition Mode

## Timing
Month 3–6.

## Goal
Reduce credit generosity gradually. No user shock.

## Pricing Progression

| Phase     | Plan             | Price     | Credits |
|-----------|------------------|----------:|--------:|
| Month 1–3 | Early Access Pro | $9.99/mo  | 1400    |
| Month 4–5 | Loyalty Pro      | $12.99/mo | 1100    |
| Month 6+  | Normal Pro       | $14.99/mo | 900     |

## Top-Ups — Transition Mode

| User Pays | Credits Given |
|----------:|--------------:|
| $10       | 950           |
| $15       | 1450          |
| $20       | 2000          |
| $30       | 3000          |
| $50       | 5200          |

---

# 11. Phase 3 — Safety Mode

## Goal
Long-term profitability.

## Plans

### Basic

| Plan  | Price    | Credits | Deep Scans included |
|-------|---------:|--------:|--------------------:|
| Basic | $7.99/mo | 400     | 1 included          |

### Pro

| Plan | Price     | Credits | Deep Scans included |
|------|----------:|--------:|--------------------:|
| Pro  | $14.99/mo | 900     | 3 included          |

## Top-Ups — Safety Mode

| User Pays | Credits Given |
|----------:|--------------:|
| $10       | 800           |
| $15       | 1200          |
| $20       | 1700          |
| $30       | 2600          |
| $50       | 4500          |

## Why Safety Mode Works

```txt
Pro $14.99 → net ~$10.50
3 deep scans × $1.50 = $4.50 Hive cost
Remaining margin = ~$6.00
Covers: infrastructure + retries + profit ✅
```

---

# 12. Protection Rules

Apply from day one. All phases.

## Scan Caps

```txt
Max deep scans/day               = 5
Max deep scans/month (EA Pro)    = 12
Max deep scans/month (Normal Pro)= 20
Max short video scans/day        = 10
Max failed retries/day           = 5
```

## Internal Cost Alert per User

```txt
Soft alert:  user Hive cost > 80% of net plan revenue
             → flag account in admin panel

Hard stop:   user Hive cost > 120% of net plan revenue
             → throttle to 1 deep scan/day automatically
```

> The hard stop prevents the theoretical worst-case losses shown in Section 4
> from ever being reached in production.

## Rollover Credit Cap

Unused monthly credits roll over at 50% max.

```txt
Basic (400 cr)   → max 200 cr rollover
Pro (900 cr)     → max 450 cr rollover
EA Pro (1400 cr) → max 700 cr rollover
```

Prevents users stockpiling credits and triggering unpredictable Hive spikes.

## Credit Expiry

Unused credits expire after 12 months of account inactivity.

```txt
30 days before expiry → re-engagement email
On expiry             → credits zeroed, user notified
```

## Scan Result Caching

Same file submitted by multiple users = one Hive call, not many.

```txt
hash(file) → check cache → hit:  return stored result ($0.00 cost)
                         → miss: call Hive + store result
```

Especially valuable for viral AI-generated content.

---

# 13. Additional Growth Layers

## Annual Plans

```txt
Basic Annual:  $63.99/yr  (~$5.33/mo vs $7.99/mo)
Pro Annual:    $119.99/yr (~$10.00/mo vs $14.99/mo)
```

Improves cash flow. Reduces monthly churn significantly.

## Credit Low-Balance Nudge

```txt
Threshold: credits < 20% of plan allocation
Action:    in-app banner + email with top-up CTA
```

Drives top-up revenue before users run out and churn.

## Referral Bonus Credits

```txt
Referrer: +100 credits when referred user makes first payment
Referred: +50 credits on signup (Growth phase only)
Cap:      max 5 successful referrals per user per month
```

---

# 14. Coupon Codes, Gift Cards & Admin Promo Codes

Three separate systems. Similar on the surface, different in logic.

---

## A. Coupon Codes (Discount at Checkout)

Reduces price at LemonSqueezy checkout. No credit logic needed unless
bonus credits are attached.

### Types

| Type | Example | Use Case |
|---|---|---|
| % off first month | 30% off | Influencer / launch promo |
| Fixed $ off | $5 off | Re-engagement |
| Bonus credits on purchase | +200 cr | Top-up incentive |

### Safety Rules

```txt
Max uses per code    → always set a cap (e.g. 100 uses)
One use per user     → block same user using twice
Expiry date          → always required, never open-ended
Stackable            → NO, never allow 2 coupons at once
Valid on which plan  → specify per code
```

### How to Wire

```txt
1. Create discount in LemonSqueezy dashboard
2. Set: code, amount, expiry, max redemptions, product restriction
3. Share code freely — LS validates at checkout automatically
4. For bonus credit coupons only:
   → listen for order_created webhook
   → check if order has bonus-credit coupon attached
   → yes → add bonus credits to user wallet
   → no  → normal flow
```

> Pure price discount coupons need zero backend work.

---

## B. Gift Cards (Prepaid Credit Bundles — Purchased)

Bought by one user, redeemed by another. Credits delivered on redemption only.

### Gift Card Tiers

Always use Safety Mode credit rates. Redemption timing is unpredictable.

| Gift Card | Credits Added |
|----------:|--------------:|
| $10       | 800 cr        |
| $20       | 1700 cr       |
| $50       | 4500 cr       |

### Safety Rules

```txt
One-time use only           → invalidate code immediately after redemption
No cash refund              → credits only, non-reversible
Expiry                      → 12 months from purchase date
No redeem during trial      → see Section 7 trial rules
Track purchaser             → store buyer user ID for fraud tracing
Fraud delay                 → first-time gift card buyer: delay credit delivery 24h
Flag large purchases        → gift cards over $30 → flag for manual review
Chargeback protection       → if chargeback received → invalidate all unredeemed
                               codes from that purchase immediately
```

### DB Table

```txt
gift_cards
----------
id             UUID primary key
code           VARCHAR unique
credits        INTEGER
status         ENUM(unused, redeemed, expired, cancelled)
buyer_user_id  FK → users
redeemed_by    FK → users (null until redeemed)
purchased_at   TIMESTAMP
expires_at     TIMESTAMP (purchased_at + 12 months)
redeemed_at    TIMESTAMP (null until redeemed)
```

### How to Wire

```txt
PURCHASE FLOW:
1. User clicks Buy Gift Card
2. Redirect to LS gift card product checkout
3. LS fires webhook: order_created
4. Backend generates UUID code
5. Store in DB with status: unused
6. Send code to buyer via email or show on-screen

REDEMPTION FLOW:
1. Recipient enters code in app
2. Backend checks:
   → code exists?          → no  → "invalid code"
   → status = unused?      → no  → "already redeemed"
   → expired?              → yes → "code expired"
3. All pass → add credits to wallet
4. Update DB: status = redeemed, redeemed_by, redeemed_at
5. Show success message
```

> 🔧 Needs: gift_cards table + generate endpoint (via LS webhook) +
> redeem endpoint. Slightly complex but straightforward to build.

---

## C. Admin Promo Codes (Free Credits — No Purchase)

You generate codes from your admin panel. User redeems. Credits added.
No money involved. Fully lives in your backend only.

### When to Use

```txt
- Reward a loyal user
- Compensate for a bug or bad experience
- Community giveaway on social media
- Influencer or partner campaign
- Beta tester reward
- Holiday gift to all users
- Support resolution credit
```

### Safety Rules

```txt
Max uses per code       → 1 for personal, up to 500 for public giveaways
One use per user        → same user cannot redeem same code twice
Expiry date             → always required
Credit cap per user     → max 1000 free promo credits redeemable per month
                          prevents abuse if a code leaks publicly
No stacking             → cannot redeem 2 promo codes within same 24h window
```

### DB Tables

```txt
promo_codes
-----------
id           UUID primary key
code         VARCHAR unique
credits      INTEGER
max_uses     INTEGER
used_count   INTEGER default 0
created_by   FK → admin_users
expires_at   TIMESTAMP
created_at   TIMESTAMP

promo_code_redemptions
----------------------
id           UUID primary key
code_id      FK → promo_codes
user_id      FK → users
redeemed_at  TIMESTAMP
```

### How to Wire

```txt
GENERATION (Admin Panel):
1. Admin fills form: code, credit amount, max uses, expiry
2. Backend generates code → stores in promo_codes table
3. Code appears in admin list, ready to share

REDEMPTION (User Side):
1. User enters code in app (wallet → redeem)
2. Backend checks:
   → code exists?              → no  → "invalid code"
   → expired?                  → yes → "code expired"
   → used_count >= max_uses?   → yes → "code fully redeemed"
   → user already redeemed?    → yes → "already redeemed by you"
3. All pass → add credits to wallet
4. Increment used_count
5. Insert into promo_code_redemptions
6. Show success with credit amount
```

> ✅ Simplest of the three. No LemonSqueezy involved at all.

---

## Summary: Which System to Use When

| Goal | System | Lives In |
|---|---|---|
| Discount price at checkout | Coupon Code | LemonSqueezy |
| Someone buys credits for another person | Gift Card | Your backend + LS |
| You give free credits with no purchase | Admin Promo Code | Your backend only |

---

# 15. Phase Transition Triggers

Do not switch phases on time alone. Use real data.

| Transition          | Trigger Condition                                  |
|---------------------|----------------------------------------------------|
| Growth → Transition | 200+ paying users OR avg Hive cost/user > $3/mo   |
| Transition → Safety | MRR covers infra + Hive costs with 30%+ margin    |
| Rollback to Growth  | Churn rate spikes > 15% in a single month         |

---

# 16. Final Strategy + Recommendation

## Phase Summary

```txt
Phase 1 → Growth    → aggressive pricing → conversion
Phase 2 → Transition → loyalty step     → stabilization
Phase 3 → Safety    → full margin       → profit
```

## Launch Checklist

```txt
✅ Start with Growth Mode + Early Access
✅ Enforce daily AND monthly deep scan caps from day one
✅ Activate internal cost alert hard stop before launch
✅ Enable payment fingerprint lock for trial
✅ Set up 2-step trial cancel email sequence
✅ Use /trial/result?success=true/false for redirect
✅ Keep Basic plan without trial — Pro only
✅ EA users convert to $9.99 after trial, normal users to $14.99
```

## After Launch

```txt
→ Monitor avg Hive cost per user weekly
→ Move to Loyalty Pro ($12.99) before jumping to Normal Pro
→ Lock Safety Mode as default public pricing once MRR is stable
```

## Full Strategy Benefits

- Strong launch conversion via generous Growth Mode
- 7-day card-gated trial on Pro only with payment fingerprint lock
- No churn spike at EA expiry via loyalty buffer
- HiveAPI budget protected via daily + monthly scan caps
- Cost alert hard stop prevents theoretical worst-case losses
- Scan result caching reduces duplicate Hive costs
- Credit expiry + rollover cap controls long-term liability
- Annual plans improve cash flow and reduce churn
- Referral loop for organic growth
- Three-tier code system: coupons + gift cards + admin promo codes
- No tax handling in your app — LemonSqueezy manages everything
- Long-term profitability via Safety Mode
