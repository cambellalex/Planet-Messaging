/**
 * AUTH MODULE
 * ============================================================
 * Handles user authentication, session management, and
 * organisation (multi-tenant) account creation.
 *
 * SETUP:
 *   npm install next-auth bcryptjs @prisma/client prisma
 *   Set environment variables:
 *     DATABASE_URL          — PostgreSQL connection string
 *     NEXTAUTH_SECRET       — random 32-byte secret (openssl rand -hex 32)
 *     NEXTAUTH_URL          — public URL of the app
 *
 * ARCHITECTURE:
 *   - Uses NextAuth.js (Auth.js v5) for session management
 *   - Credentials provider for email+password
 *   - Prisma adapter for database sessions
 *   - bcrypt for password hashing (cost factor 12)
 *
 * FUNCTIONS IMPLEMENTED HERE:
 *   - hashPassword(plain)         → bcrypt hash
 *   - verifyPassword(plain, hash) → boolean
 *   - createUser(data)            → creates org + user atomically
 *   - getSession()                → server-side session helper
 *   - requireAuth()               → throws if not authenticated
 *
 * FUTURE:
 *   - OAuth providers (Google Workspace, Microsoft 365)
 *   - SAML / SSO for enterprise customers
 *   - TOTP-based MFA
 *   - API key management for programmatic access
 *
 * ============================================================
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organisationId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: Date;
}

export interface Organisation {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
}

/**
 * Hashes a plaintext password using bcrypt (cost=12).
 * Never store plaintext passwords.
 */
export async function hashPassword(_plain: string): Promise<string> {
  // const bcrypt = await import('bcryptjs');
  // return bcrypt.hash(_plain, 12);
  throw new Error('hashPassword: bcryptjs not installed. Run: npm install bcryptjs');
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(_plain: string, _hash: string): Promise<boolean> {
  // const bcrypt = await import('bcryptjs');
  // return bcrypt.compare(_plain, _hash);
  throw new Error('verifyPassword: bcryptjs not installed.');
}

/**
 * Atomically creates an organisation and its first owner user.
 * Wraps both inserts in a Prisma transaction.
 */
export async function createUser(_input: CreateUserInput): Promise<{ user: User; org: Organisation }> {
  // const { db } = await import('@/lib/db');
  // return db.$transaction(async (tx) => {
  //   const org = await tx.organisation.create({ data: { name: _input.companyName } });
  //   const hash = await hashPassword(_input.password);
  //   const user = await tx.user.create({
  //     data: { email: _input.email, firstName: _input.firstName,
  //             lastName: _input.lastName, passwordHash: hash,
  //             organisationId: org.id, role: 'owner' },
  //   });
  //   return { user, org };
  // });
  throw new Error('createUser: database not configured.');
}
