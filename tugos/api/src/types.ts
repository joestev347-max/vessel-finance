// Domain role union — mirrors the CHECK constraint on tug_users.role and the
// blueprint's seven surface roles. Kept in lockstep with the DB by literal union.
export const ROLES = [
  'fleet_admin',
  'port_captain',
  'dispatcher',
  'captain',
  'crew',
  'billing',
  'client',
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(x: unknown): x is Role {
  return typeof x === 'string' && (ROLES as readonly string[]).includes(x);
}

// The verified identity carried on every authenticated request.
export interface AuthContext {
  userId: string;
  companyId: string;
  role: Role;
}
