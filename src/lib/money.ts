/**
 * Money helpers. All monetary values in the DB are USD cents stored as Int.
 * Convert at the edges only — never do arithmetic on float dollars.
 */

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdFormatter2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatUSD(cents: number, decimals: 0 | 2 = 0): string {
  const formatter = decimals === 2 ? usdFormatter2 : usdFormatter;
  return formatter.format(centsToDollars(cents));
}

export function formatUSDCompact(cents: number): string {
  const dollars = centsToDollars(cents);
  const abs = Math.abs(dollars);
  if (abs >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `$${(dollars / 1_000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}
