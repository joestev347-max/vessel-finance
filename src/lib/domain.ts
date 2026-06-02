/**
 * Domain literal types. SQLite cannot store enums natively, so the schema uses
 * `String` columns and these literal unions provide TypeScript-side safety.
 *
 * Keep the values here in sync with the comments in prisma/schema.prisma and
 * with the seed data in prisma/seed.ts.
 */

export const VESSEL_TYPES = ["TANKER", "BULKER", "CONTAINER", "OFFSHORE_SUPPLY", "RORO", "LNG_CARRIER"] as const;
export type VesselType = (typeof VESSEL_TYPES)[number];

export const VESSEL_STATUSES = ["ACTIVE", "IN_DRYDOCK", "LAID_UP", "DECOMMISSIONED"] as const;
export type VesselStatus = (typeof VESSEL_STATUSES)[number];

export const ACCOUNT_CATEGORIES = ["REVENUE", "OPEX", "CAPEX", "OTHER"] as const;
export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number];

export const VOYAGE_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type VoyageStatus = (typeof VOYAGE_STATUSES)[number];

export const EXPENSE_STATUSES = ["PENDING", "APPROVED", "PAID", "REJECTED"] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
