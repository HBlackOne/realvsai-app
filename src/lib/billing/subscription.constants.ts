// Monthly credit allocation per subscription plan variant.
// Map: LS variant ID → monthly credit amount.
// TODO: replace with real variant IDs from LS dashboard.
export const SUBSCRIPTION_VARIANT_CREDITS: Record<string, number> = {
  // Basic plan — placeholder, replace with real LS variant ID
  "1522070": 500,
  // Pro plan — placeholder, replace with real LS variant ID
  "1522071": 1200,
};

export const SUBSCRIPTION_DEFAULT_CREDITS = 500;
