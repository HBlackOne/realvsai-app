# RealvsAI — Scan Access & Pricing Tiers
## Source of Truth for All Scan Costs, Access Rules, and Credit Packs

---

# 1. Credit Packs (Top-Ups)

One-time purchases. Credits work across all scan types.
Bigger pack = better value per credit.

| Pack | Price | Credits | Value/Credit |
|---|---:|---:|---:|
| Nano | $5 | 200 cr | $0.025 |
| Starter | $10 | 500 cr | $0.020 |
| Basic | $15 | 800 cr | $0.01875 |
| Standard | $20 | 1100 cr | $0.01818 |
| Pro | $30 | 1700 cr | $0.01765 |
| Elite | $50 | 3000 cr | $0.01667 |

---

# 2. Scan Credit Costs — Two Rate Tiers

Credits are flat. Costs depend on user type, not pack.

## Free User Rates
Applies to: wallet only, no active subscription, trial ended.
Higher rates to encourage subscribing.

| Scan Type | Credits | USD Value |
|---|---:|---:|
| Image | 5 cr | $0.05 |
| Audio | 80 cr | $0.80 |
| Short video | 60 cr | $0.60 |
| Deep video | blocked | — |

## Subscriber Rates
Applies to: active trial, Basic subscriber, Pro subscriber.

| Scan Type | Credits | USD Value |
|---|---:|---:|
| Image | 2 cr | $0.02 |
| Audio | 40 cr | $0.40 |
| Short video | 30 cr | $0.30 |
| Deep video | 80 cr | $0.80 (Pro only) |

---

# 3. Scan Access by User Type

| User Type | Rate Tier | Deep Video | Daily Limit | Credits Source |
|---|---|---|---:|---|
| EA Free Trial | Subscriber | Allowed | 5/day | 500 trial credits |
| Pro Free Trial | Subscriber | Allowed | 5/day | 500 trial credits |
| Pro subscriber | Subscriber | Allowed | 20/day | 700 cr/month + wallet |
| Basic subscriber | Subscriber | Blocked | 10/day | 300 cr/month + wallet |
| Wallet only | Free rates | Blocked | 5/day | Wallet balance only |
| No sub no credits | No access | Blocked | 0 | None |

### Notes

```txt
No sub no credits:
  Cannot scan at all
  Prompt to start free trial or buy credits

Wallet only:
  Has credits but no active subscription
  Uses free user rates (more expensive per scan)
  This encourages them to subscribe for better rates

Trial users:
  Get Pro-level access during trial
  5 scans/day limit to protect Hive budget
  500 trial credits only, no wallet or sub credits
  Deep video allowed during trial

Basic subscriber:
  Subscriber rates but deep video blocked
  10 scans/day
  300 cr/month + can top up with wallet credits

Pro subscriber:
  Full access, best rates
  20 scans/day
  700 cr/month + can top up with wallet credits
  Deep video allowed up to 15/month (EA) or 25/month (Normal)
```

---

# 4. Subscription Plans

## Basic — $7.99/month

| Item | Value |
|---|---|
| Credits/month | 300 cr |
| Scan rates | Subscriber rates |
| Deep video | Blocked |
| Daily scan limit | 10/day |
| Scan history | Last 30 days |
| Batch scanning | 1 file at a time |
| Result detail | Verdict + confidence only |
| Priority processing | No |
| Result sharing | No |
| Credit rollover | No |
| API access | Coming soon |

## Pro Early Access — $9.99/month

| Item | Value |
|---|---|
| Credits/month | 700 cr |
| Scan rates | Subscriber rates |
| Deep video | Allowed — 15/month |
| Daily scan limit | 20/day |
| Scan history | Unlimited + PDF export |
| Batch scanning | Up to 5 files queued |
| Result detail | Full breakdown — generators, deepfake, C2PA, source |
| Priority processing | Yes |
| Result sharing | Yes — shareable public link |
| Credit rollover | Yes — up to 50% |
| API access | Coming soon |

## Pro Loyalty — $12.99/month

Everything in Pro EA plus:
```txt
Early access to new scan types
600 cr/month
15 deep scans/month
```

## Normal Pro — $14.99/month

```txt
500 cr/month
25 deep scans/month
20 scans/day
All Pro features
```

---

# 5. Daily Scan Limits

Global combined cap across ALL scan types.
Separate from deep video monthly cap.
Resets at UTC midnight.

| User Type | Daily Limit |
|---|---:|
| EA Free Trial | 5/day |
| Pro Free Trial | 5/day |
| Wallet only | 5/day |
| No sub no credits | 0 |
| Basic subscriber | 10/day |
| Pro subscriber (any phase) | 20/day |

Message when daily limit reached:
```txt
Trial:  "You've reached your trial scan limit for today.
         Upgrade to continue scanning."

All others: "Daily scan limit reached. Resets at midnight."
```

---

# 6. Monthly Deep Video Caps

Applies to Pro subscribers only.
Basic and below cannot access deep video at all.

| Plan Phase | Monthly Deep Cap |
|---|---:|
| EA Pro (GROWTH) | 15/month |
| Loyalty (TRANSITION) | 15/month |
| Normal Pro (SAFETY) | 25/month |
| Basic | 0 (blocked) |
| Trial | 15/month (Pro trial) |
| Wallet only | 0 (blocked) |

---

# 7. Hive Estimated Costs (Real Confirmed)

Source: official Hive pricing page.
All values in cents.

| Scan Type | Hive Cost (cents) | Hive Cost ($) |
|---|---:|---:|
| Image | 0.6 | $0.006 |
| Audio | 33.4 | $0.334 |
| Short video | 9.0 | $0.090 |
| Deep video | 36.0 | $0.360 |

---

# 8. Protection Rules Summary

```txt
Max deep scans/day:                    5
Max short video scans/day:             10
Max total scans/day trial/wallet:      5
Max total scans/day Basic:             10
Max total scans/day Pro:               20
Max deep scans/month EA Pro:           15
Max deep scans/month Normal Pro:       25
Max deep scans/month Basic:            0
Daily reset timezone:                  UTC midnight
Cost soft alert:                       80% of net plan revenue
Cost hard stop:                        120% of net plan revenue
Hard stop throttle:                    1 deep scan/day
Rollover cap:                          50% of monthly credits
Credit expiry:                         12 months inactivity
```

---

# 9. Free User Conversion Strategy

Free users (wallet only, no subscription) see:
- More expensive scan rates (free tier)
- Deep video blocked
- Limited daily scans (5/day)
- Limited scan history (last 5 scans only)
- No result sharing
- No credit rollover

This creates clear incentive to subscribe.
The pricing page should show both rate tiers side by side
so users can see exactly what they save by subscribing.
