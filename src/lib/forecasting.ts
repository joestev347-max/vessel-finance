/**
 * Forecasting engine — pure functions over a monthly amount series.
 *
 * Three classic methods (no ML):
 *  - "historical-average": trailing N-month mean.
 *  - "linear-trend":       OLS regression of amount vs. month index, then extrapolate.
 *  - "seasonal":           same month previous year, scaled by overall annual trend.
 *
 * All methods return a confidence band (lower/upper) derived from the residual stdev.
 */

export interface MonthlyPoint {
  year: number;
  month: number;     // 1-12
  amountCents: number;
}

export interface ForecastPoint {
  year: number;
  month: number;
  projectedCents: number;
  lowerCents: number;
  upperCents: number;
}

export type ForecastMethod = "historical-average" | "linear-trend" | "seasonal";

export interface ForecastInput {
  history: MonthlyPoint[];   // any order; will be sorted
  horizonMonths: number;
  method: ForecastMethod;
  trailingWindow?: number;   // for "historical-average"; default 12
  confidenceZ?: number;      // 1.0 = ~68%, 1.645 = ~90%, 1.96 = ~95%; default 1.645
}

export interface ForecastResult {
  method: ForecastMethod;
  horizonMonths: number;
  baseline: { meanCents: number; stdDevCents: number; pointsUsed: number };
  forecast: ForecastPoint[];
}

// ---------- helpers ----------
function sortHistory(history: MonthlyPoint[]): MonthlyPoint[] {
  return [...history].sort((a, b) => (a.year - b.year) || (a.month - b.month));
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function stdev(xs: number[], sampleMean?: number): number {
  if (xs.length < 2) return 0;
  const m = sampleMean ?? mean(xs);
  const variance = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

function nextMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

function lastMonth(history: MonthlyPoint[]): { year: number; month: number } | null {
  if (history.length === 0) return null;
  const sorted = sortHistory(history);
  const last = sorted[sorted.length - 1];
  return { year: last.year, month: last.month };
}

function band(point: number, residualSd: number, z: number): { lower: number; upper: number } {
  return { lower: point - z * residualSd, upper: point + z * residualSd };
}

// ---------- methods ----------

function forecastHistoricalAverage(input: ForecastInput): ForecastResult {
  const sorted = sortHistory(input.history);
  const window = input.trailingWindow ?? 12;
  const tail = sorted.slice(-window);
  const amounts = tail.map((p) => p.amountCents);
  const m = mean(amounts);
  const sd = stdev(amounts, m);
  const z = input.confidenceZ ?? 1.645;

  const forecast: ForecastPoint[] = [];
  let next = lastMonth(sorted);
  if (!next) return { method: "historical-average", horizonMonths: input.horizonMonths, baseline: { meanCents: 0, stdDevCents: 0, pointsUsed: 0 }, forecast: [] };
  for (let i = 0; i < input.horizonMonths; i++) {
    next = nextMonth(next.year, next.month);
    const { lower, upper } = band(m, sd, z);
    forecast.push({
      year: next.year,
      month: next.month,
      projectedCents: Math.round(m),
      lowerCents: Math.round(lower),
      upperCents: Math.round(upper),
    });
  }
  return {
    method: "historical-average",
    horizonMonths: input.horizonMonths,
    baseline: { meanCents: Math.round(m), stdDevCents: Math.round(sd), pointsUsed: tail.length },
    forecast,
  };
}

function forecastLinearTrend(input: ForecastInput): ForecastResult {
  const sorted = sortHistory(input.history);
  const n = sorted.length;
  if (n < 2) return forecastHistoricalAverage({ ...input, method: "historical-average" });

  // x = month index 0..n-1; y = amountCents
  const xs = sorted.map((_, i) => i);
  const ys = sorted.map((p) => p.amountCents);
  const xMean = mean(xs);
  const yMean = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  // residual stdev around the fitted line
  const residuals = sorted.map((p, i) => p.amountCents - (intercept + slope * i));
  const resSd = stdev(residuals, 0);
  const z = input.confidenceZ ?? 1.645;

  const forecast: ForecastPoint[] = [];
  let next = lastMonth(sorted)!;
  for (let i = 0; i < input.horizonMonths; i++) {
    next = nextMonth(next.year, next.month);
    const xIdx = n + i; // continue the index
    const point = intercept + slope * xIdx;
    const { lower, upper } = band(point, resSd, z);
    forecast.push({
      year: next.year,
      month: next.month,
      projectedCents: Math.round(point),
      lowerCents: Math.round(lower),
      upperCents: Math.round(upper),
    });
  }
  return {
    method: "linear-trend",
    horizonMonths: input.horizonMonths,
    baseline: { meanCents: Math.round(yMean), stdDevCents: Math.round(resSd), pointsUsed: n },
    forecast,
  };
}

function forecastSeasonal(input: ForecastInput): ForecastResult {
  const sorted = sortHistory(input.history);
  if (sorted.length < 13) {
    // Not enough history for a seasonal model — fall back to trend.
    return forecastLinearTrend({ ...input, method: "linear-trend" });
  }

  // Annual mean for the most recent full 12 months and the prior 12.
  const last12 = sorted.slice(-12);
  const prev12 = sorted.slice(-24, -12);
  const lastMean = mean(last12.map((p) => p.amountCents));
  const prevMean = prev12.length === 12 ? mean(prev12.map((p) => p.amountCents)) : lastMean;
  const annualGrowth = prevMean === 0 ? 1 : lastMean / prevMean;

  // Build a lookup of "same month one year ago".
  const byKey = new Map<string, number>();
  for (const p of sorted) byKey.set(`${p.year}-${p.month}`, p.amountCents);

  // Residuals of "value vs same-month-prev-year * annualGrowth" used for band width
  const residuals: number[] = [];
  for (const p of last12) {
    const k = `${p.year - 1}-${p.month}`;
    const prior = byKey.get(k);
    if (prior !== undefined) {
      const expected = prior * annualGrowth;
      residuals.push(p.amountCents - expected);
    }
  }
  const resSd = stdev(residuals, 0);
  const z = input.confidenceZ ?? 1.645;

  const forecast: ForecastPoint[] = [];
  let next = lastMonth(sorted)!;
  for (let i = 0; i < input.horizonMonths; i++) {
    next = nextMonth(next.year, next.month);
    const priorKey = `${next.year - 1}-${next.month}`;
    const prior = byKey.get(priorKey) ?? lastMean;
    const point = prior * annualGrowth;
    const { lower, upper } = band(point, resSd, z);
    forecast.push({
      year: next.year,
      month: next.month,
      projectedCents: Math.round(point),
      lowerCents: Math.round(lower),
      upperCents: Math.round(upper),
    });
  }
  return {
    method: "seasonal",
    horizonMonths: input.horizonMonths,
    baseline: { meanCents: Math.round(lastMean), stdDevCents: Math.round(resSd), pointsUsed: sorted.length },
    forecast,
  };
}

export function forecast(input: ForecastInput): ForecastResult {
  switch (input.method) {
    case "historical-average": return forecastHistoricalAverage(input);
    case "linear-trend":       return forecastLinearTrend(input);
    case "seasonal":           return forecastSeasonal(input);
  }
}

/**
 * Convenience: aggregate a flat list of dated rows into a monthly series.
 */
export function toMonthlySeries(
  rows: { date: Date; amountCents: number }[],
): MonthlyPoint[] {
  const map = new Map<string, MonthlyPoint>();
  for (const r of rows) {
    const y = r.date.getUTCFullYear();
    const m = r.date.getUTCMonth() + 1;
    const k = `${y}-${m}`;
    const existing = map.get(k);
    if (existing) existing.amountCents += r.amountCents;
    else map.set(k, { year: y, month: m, amountCents: r.amountCents });
  }
  return sortHistory([...map.values()]);
}
