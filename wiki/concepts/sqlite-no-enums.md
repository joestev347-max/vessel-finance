---
type: concept
created: 2026-06-02
updated: 2026-06-02
tags: [convention, sqlite, types, repo]
source_count: 0
sources: []
---

# SQLite has no enums — literal unions instead

SQLite has no native `enum` type, so every categorical field (status, type, category) is a
`String` column in `prisma/schema.prisma`. Allowed values are enforced on the TypeScript side by
literal-union types in `src/lib/domain.ts` and documented inline in the schema.

## The unions (`src/lib/domain.ts`)

- `VESSEL_TYPES`, `VESSEL_STATUSES`
- `ACCOUNT_CATEGORIES` (REVENUE | OPEX | CAPEX | OTHER)
- `VOYAGE_STATUSES`, `EXPENSE_STATUSES`

API routes validate incoming values against these with `z.enum(...)` before writing.

## The indexing pitfall

When indexing an `as const` tone/label map by a Prisma `string` field, you must cast the key:

```ts
STATUS_TONE[x.status as keyof typeof STATUS_TONE]
```

Without the cast, `next build` fails type-check ("expression of type 'string' can't be used to
index…"). This bit us on 2026-06-02 — see anti-pattern #3 in
[[synthesis/claude-anti-patterns]].

## Relationships

- Pairs with [[concepts/money-as-cents]] as a core repo convention.
- Affects every form/API in [[synthesis/data-model]].
