import { queryNoTenant } from '../db.js';
import { signAccessToken, verifyPassword } from '../auth.js';
import { isRole, type AuthContext } from '../types.js';

export interface LoginRow {
  id: string;
  company_id: string;
  role: string;
  password_hash: string | null;
}

export type LookupFn = (email: string) => Promise<LoginRow[]>;

// Generic failure: never reveal whether the email, the password, or uniqueness
// was the problem (avoids user enumeration).
export class LoginError extends Error {
  constructor() {
    super('invalid credentials');
    this.name = 'LoginError';
  }
}

// Default lookup uses the SECURITY DEFINER function (RLS-safe, pre-tenant).
export const dbLookup: LookupFn = async (email) => {
  const { rows } = await queryNoTenant('select id, company_id, role, password_hash from private.tug_auth_lookup($1)', [email]);
  return rows as LoginRow[];
};

export interface LoginResult {
  token: string;
  user: AuthContext;
}

// Pure-ish login logic; lookup is injectable for unit tests.
export async function loginUser(email: string, password: string, lookup: LookupFn = dbLookup): Promise<LoginResult> {
  const matches = await lookup(email);
  if (matches.length !== 1) throw new LoginError(); // unknown OR ambiguous across tenants
  const row = matches[0]!;
  if (!row.password_hash) throw new LoginError();
  if (!(await verifyPassword(password, row.password_hash))) throw new LoginError();
  if (!isRole(row.role)) throw new LoginError();
  const user: AuthContext = { userId: row.id, companyId: row.company_id, role: row.role };
  return { token: signAccessToken(user), user };
}
