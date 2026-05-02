# Hybrid Pricing Strategy V2 + Locked Roadmap

Status: draft/working source of truth  
Project: RealvsAI webapp  
Last updated: 2026-04-30

## Current locked pages

- Credits page: locked for this phase.
- Subscription page: locked for this phase.
- Settings V2: locked for this phase except small title/card consistency polish listed below.

## Locked roadmap order

1. Settings/Profile title consistency
   - Align Settings V2 card titles with the rest of the app.
   - Review title color, icons, and divider/line treatment.
   - Add missing icons to Profile first/last cards if still needed.

2. Hybrid Pricing Strategy V2
   - Finalize all billing/pricing rules before wiring real payment flows.
   - This document is the planning home for trial, Early Access, subscription, wallet packs, billing portal, and cancellation rules.

3. LemonSqueezy payment gate
   - Wire and test real trial checkout.
   - Wire and test Early Access/subscription checkout.
   - Wire billing/customer portal behavior.
   - Confirm webhook state sync and subscription lifecycle behavior.

4. Hive API scan detector
   - Wire real scan execution.
   - Apply trial/subscription/wallet credit deduction logic.
   - Handle limits, errors, and scan states correctly.

5. `/result` full result review
   - Full result display/review experience.
   - Share options.
   - Download/export options.

6. Shared shell-code/top-page component
   - Add shared route-aware top shell/header component.
   - It should reflect App/Dashboard/path context and change with route changes.

7. Shared loading skeleton component
   - Build reusable loading skeletons.
   - Apply only to selected specific variables/sections.
   - Avoid full-page/full-card skeletons unless truly needed.

8. `/welcome` first-user logic
   - Make `/welcome` reliably the first page shown after signup.
   - Clean first-register redirect/onboarding flow.
   - Low urgency because there are no real users yet.

9. UX polish pass
   - Final visual consistency pass across pages.
   - Catch spacing, title, icon, card, and mobile issues after core flows are wired.

10. Full review/restack pass
    - Review architecture, duplicated code, messy components, API boundaries, and billing/scan flow clarity.
    - Refactor/restack only where needed after the product surface is mostly final.

11. Push to GitHub and deploy to Vercel via GitHub
    - Put the official webapp source in GitHub.
    - Connect Vercel to GitHub for permanent deployment.
    - Move away from relying on this local machine as the official host.
    - Configure production environment variables safely.
    - Verify domains and deployment pipeline.

12. End-to-end testing
    - Test the whole real-user path: signup → welcome → trial/payment → scan → Hive result → credit deduction → result share/download → billing/history/settings.

## Hybrid Pricing Strategy V2 scope

### Trial

- Free trial is based on the Pro experience.
- Trial allowance: 500 credits.
- Trial duration: 7 days.
- Trial CTA must clearly say the user can start the trial before choosing a paid plan.
- User must be able to cancel the free trial before being charged after the trial ends.
- Trial copy must explain what happens after the trial ends.

### Early Access

- Early Access is based on the Pro plan.
- Early Access duration/discount window: 3 months.
- After free trial ends, user must pay for Early Access if he wants to keep the discounted scan costs/prices.
- Early Access rules must define:
  - when discounted pricing starts
  - when it ends
  - what stays locked
  - what changes if the user upgrades, cancels, or changes plan

### Plans and pricing

- Final subscription plan prices must be decided here.
- Final credit pack prices must be decided here.
- Final scan costs must be decided here.
- Pricing constants should become the single source of truth for UI + backend logic.
- Avoid hardcoded pricing text scattered across components.

### Billing/customer portal

- Billing portal behavior belongs to this strategy.
- Define what users can manage from the portal:
  - cancel trial/subscription
  - update payment method
  - view invoices/receipts if available
  - manage renewal/cancellation state
- UI must communicate cancellation and renewal rules clearly.

### Upgrade/downgrade/cancel rules

Define before final implementation:

- Trial → Early Access
- Trial → cancel before charge
- Early Access → paid continuation
- Basic → Pro
- Pro → Basic, if allowed
- Active subscription → cancel at period end
- Cancelled subscription → wallet-only behavior
- Wallet packs with/without subscription

## Pending backlog outside Hybrid Pricing V2

These are intentionally not part of the billing strategy doc:

- Delete account real behavior
  - Needs LemonSqueezy cancellation handling and data deletion/cascade review before enabling.

- 2FA Clerk flow
  - Keep as `Soon` until Clerk TOTP/security UX is intentionally designed.

- Light mode
  - Deferred until full app theme review.

- Language/i18n
  - Deferred until full app i18n strategy.

- Resend transactional emails
  - Set up after Hive/scan flow is locked.
  - Clerk remains only for auth/account emails.

- Settings notification preferences sending emails
  - Preferences are stored now, but actual email sending waits for Resend + final event definitions.

- Final app-wide title/card/theme consistency
  - Handle during UX polish pass unless a specific page blocks work earlier.

## Notes

- Keep changes step by step.
- Preserve real LemonSqueezy/Hive/DB behavior; do not replace with mock/demo logic.
- Use theme variables, not hardcoded theme colors.
- Build/restart after implementation changes.
