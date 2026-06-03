/**
 * Empty the database — delete ALL rows in every table, in dependency order.
 *
 * This is for starting fresh with real data instead of the sample fleet.
 * It drops data only; the schema is untouched. Re-seed sample data anytime
 * with `npm run db:seed`.
 *
 * Usage: npm run db:empty
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Order matters: delete children before parents to respect foreign keys.
  const steps: Array<[string, () => Promise<{ count: number }>]> = [
    ["budgetTransfers", () => prisma.budgetTransfer.deleteMany()],
    ["expenses", () => prisma.expense.deleteMany()],
    ["revenues", () => prisma.revenue.deleteMany()],
    ["budgets", () => prisma.budget.deleteMany()],
    ["voyages", () => prisma.voyage.deleteMany()],
    ["accounts", () => prisma.account.deleteMany()],
    ["vessels", () => prisma.vessel.deleteMany()],
  ];

  console.log("Emptying database…");
  for (const [label, run] of steps) {
    const { count } = await run();
    console.log(`  deleted ${count} ${label}`);
  }
  console.log("Done. Database is empty. Re-seed sample data with `npm run db:seed`.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
