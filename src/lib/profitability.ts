/**
 * Profitability engine — pure functions that operate on already-loaded data.
 *
 * The Prisma-backed loader is in src/lib/profitability-loader.ts so this file
 * stays unit-testable without a database.
 */
import type { AccountCategory } from "./domain";

export interface AccountRef {
  id: string;
  name: string;
  category: AccountCategory;
  subcategory: string | null;
}

export interface ExpenseRow {
  accountId: string;
  amountCents: number;
  expenseDate: Date;
  voyageId?: string | null;
}

export interface RevenueRow {
  accountId: string;
  amountCents: number;
  recognitionDate: Date;
  voyageId?: string | null;
}

export interface ProfitabilityInput {
  expenses: ExpenseRow[];
  revenues: RevenueRow[];
  accounts: AccountRef[];
  from: Date;
  to: Date;
}

export interface ProfitabilityResult {
  from: Date;
  to: Date;
  totals: {
    revenueCents: number;
    opexCents: number;
    capexCents: number;
    otherCents: number;
    grossProfitCents: number;   // revenue - opex
    netProfitCents: number;     // revenue - opex - capex - other
    grossMarginPct: number;
    netMarginPct: number;
  };
  revenueByAccount: { accountId: string; accountName: string; amountCents: number }[];
  opexBySubcategory: { subcategory: string; amountCents: number }[];
  capexByAccount: { accountId: string; accountName: string; amountCents: number }[];
  monthly: {
    year: number;
    month: number;
    revenueCents: number;
    opexCents: number;
    capexCents: number;
    netProfitCents: number;
  }[];
}

function inRange(d: Date, from: Date, to: Date): boolean {
  return d >= from && d <= to;
}

function pct(num: number, denom: number): number {
  if (denom === 0) return 0;
  return (num / denom) * 100;
}

function sortByAmountDesc<T extends { amountCents: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.amountCents - a.amountCents);
}

export function computeProfitability(input: ProfitabilityInput): ProfitabilityResult {
  const { expenses, revenues, accounts, from, to } = input;
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const revFiltered = revenues.filter((r) => inRange(r.recognitionDate, from, to));
  const expFiltered = expenses.filter((e) => inRange(e.expenseDate, from, to));

  // Totals
  let revenueCents = 0;
  const revByAcct = new Map<string, number>();
  for (const r of revFiltered) {
    revenueCents += r.amountCents;
    revByAcct.set(r.accountId, (revByAcct.get(r.accountId) ?? 0) + r.amountCents);
  }

  let opexCents = 0;
  let capexCents = 0;
  let otherCents = 0;
  const opexBySub = new Map<string, number>();
  const capexByAcct = new Map<string, number>();
  for (const e of expFiltered) {
    const acct = accountById.get(e.accountId);
    if (!acct) continue;
    if (acct.category === "OPEX") {
      opexCents += e.amountCents;
      const sub = acct.subcategory ?? "Uncategorized";
      opexBySub.set(sub, (opexBySub.get(sub) ?? 0) + e.amountCents);
    } else if (acct.category === "CAPEX") {
      capexCents += e.amountCents;
      capexByAcct.set(e.accountId, (capexByAcct.get(e.accountId) ?? 0) + e.amountCents);
    } else if (acct.category === "OTHER") {
      otherCents += e.amountCents;
    } else if (acct.category === "REVENUE") {
      // A revenue-classified account shouldn't show on the expense side; ignore defensively.
    }
  }

  const grossProfitCents = revenueCents - opexCents;
  const netProfitCents = revenueCents - opexCents - capexCents - otherCents;
  const grossMarginPct = pct(grossProfitCents, revenueCents);
  const netMarginPct = pct(netProfitCents, revenueCents);

  // Monthly breakdown — walk all months that overlap [from, to]
  const monthlyMap = new Map<string, {
    year: number; month: number;
    revenueCents: number; opexCents: number; capexCents: number;
  }>();
  function monthKey(y: number, m: number) { return `${y}-${m}`; }
  function bucket(y: number, m: number) {
    const k = monthKey(y, m);
    let v = monthlyMap.get(k);
    if (!v) {
      v = { year: y, month: m, revenueCents: 0, opexCents: 0, capexCents: 0 };
      monthlyMap.set(k, v);
    }
    return v;
  }
  for (const r of revFiltered) {
    const d = r.recognitionDate;
    bucket(d.getUTCFullYear(), d.getUTCMonth() + 1).revenueCents += r.amountCents;
  }
  for (const e of expFiltered) {
    const acct = accountById.get(e.accountId);
    if (!acct) continue;
    const d = e.expenseDate;
    const b = bucket(d.getUTCFullYear(), d.getUTCMonth() + 1);
    if (acct.category === "OPEX") b.opexCents += e.amountCents;
    else if (acct.category === "CAPEX") b.capexCents += e.amountCents;
  }
  const monthly = [...monthlyMap.values()]
    .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year)
    .map((m) => ({
      ...m,
      netProfitCents: m.revenueCents - m.opexCents - m.capexCents,
    }));

  return {
    from,
    to,
    totals: {
      revenueCents,
      opexCents,
      capexCents,
      otherCents,
      grossProfitCents,
      netProfitCents,
      grossMarginPct,
      netMarginPct,
    },
    revenueByAccount: sortByAmountDesc(
      [...revByAcct.entries()].map(([accountId, amountCents]) => ({
        accountId,
        accountName: accountById.get(accountId)?.name ?? accountId,
        amountCents,
      })),
    ),
    opexBySubcategory: sortByAmountDesc(
      [...opexBySub.entries()].map(([subcategory, amountCents]) => ({ subcategory, amountCents })),
    ),
    capexByAccount: sortByAmountDesc(
      [...capexByAcct.entries()].map(([accountId, amountCents]) => ({
        accountId,
        accountName: accountById.get(accountId)?.name ?? accountId,
        amountCents,
      })),
    ),
    monthly,
  };
}

/**
 * TCE = (voyage revenue - voyage variable costs) / days at sea.
 * Variable costs here = OPEX accounts with subcategory "Voyage".
 */
export function computeVoyageTCE(args: {
  revenues: RevenueRow[];
  expenses: ExpenseRow[];
  accounts: AccountRef[];
  voyageId: string;
  startDate: Date;
  endDate: Date;
}): {
  voyageId: string;
  daysAtSea: number;
  revenueCents: number;
  variableCostsCents: number;
  tceUsdPerDay: number;
} {
  const days = Math.max(
    1,
    Math.round((args.endDate.getTime() - args.startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const accountById = new Map(args.accounts.map((a) => [a.id, a]));
  const revenue = args.revenues
    .filter((r) => r.voyageId === args.voyageId)
    .reduce((sum, r) => sum + r.amountCents, 0);
  const variable = args.expenses
    .filter((e) => {
      if (e.voyageId !== args.voyageId) return false;
      const acct = accountById.get(e.accountId);
      return acct?.category === "OPEX" && acct?.subcategory === "Voyage";
    })
    .reduce((sum, e) => sum + e.amountCents, 0);
  const tceUsdPerDay = (revenue - variable) / 100 / days;
  return {
    voyageId: args.voyageId,
    daysAtSea: days,
    revenueCents: revenue,
    variableCostsCents: variable,
    tceUsdPerDay,
  };
}

/**
 * Budget vs actual for a single vessel-account combo over a year.
 */
export function computeBudgetVariance(args: {
  budgets: { fiscalYear: number; fiscalMonth: number; amountCents: number; accountId: string }[];
  expenses: ExpenseRow[];
  revenues: RevenueRow[];
  accounts: AccountRef[];
  year: number;
}): {
  byAccount: {
    accountId: string;
    accountName: string;
    category: AccountCategory;
    budgetedCents: number;
    actualCents: number;
    varianceCents: number;       // actual - budgeted
    variancePct: number;
  }[];
} {
  const accountById = new Map(args.accounts.map((a) => [a.id, a]));
  const budgetByAcct = new Map<string, number>();
  for (const b of args.budgets) {
    if (b.fiscalYear !== args.year) continue;
    budgetByAcct.set(b.accountId, (budgetByAcct.get(b.accountId) ?? 0) + b.amountCents);
  }
  const actualByAcct = new Map<string, number>();
  for (const e of args.expenses) {
    if (e.expenseDate.getUTCFullYear() !== args.year) continue;
    actualByAcct.set(e.accountId, (actualByAcct.get(e.accountId) ?? 0) + e.amountCents);
  }
  for (const r of args.revenues) {
    if (r.recognitionDate.getUTCFullYear() !== args.year) continue;
    actualByAcct.set(r.accountId, (actualByAcct.get(r.accountId) ?? 0) + r.amountCents);
  }
  const ids = new Set<string>([...budgetByAcct.keys(), ...actualByAcct.keys()]);
  const byAccount = [...ids].map((id) => {
    const acct = accountById.get(id);
    const budgeted = budgetByAcct.get(id) ?? 0;
    const actual = actualByAcct.get(id) ?? 0;
    return {
      accountId: id,
      accountName: acct?.name ?? id,
      category: acct?.category ?? ("OTHER" as AccountCategory),
      budgetedCents: budgeted,
      actualCents: actual,
      varianceCents: actual - budgeted,
      variancePct: pct(actual - budgeted, budgeted),
    };
  });
  return { byAccount };
}
