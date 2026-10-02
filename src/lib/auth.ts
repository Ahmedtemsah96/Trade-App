import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { asOwner } from './db';
import { SESSION_COOKIE, signSession, verifySession } from './session';

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function checkPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

export async function startSession(userId: string) {
  cookies().set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}

export type Member = {
  userId: string;
  orgId: string;
  email: string;
  fullName: string | null;
  role: string;
  company: string;
};

/**
 * The signed-in user and their organization, or null. Looked up on every
 * request, so removing someone from `members` locks them out immediately.
 */
export async function currentMember(): Promise<Member | null> {
  const userId = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return asOwner((db) =>
    db.one<Member>(
      `select m.user_id as "userId", m.organization_id as "orgId", u.email,
              m.full_name as "fullName", m.role, o.name as company
         from members m
         join users u on u.id = m.user_id
         join organizations o on o.id = m.organization_id
        where m.user_id = $1`,
      [userId],
    ),
  );
}

/** For pages: the current member, or a redirect to the login screen. */
export async function requireMember(): Promise<Member> {
  const member = await currentMember();
  if (!member) redirect('/login');
  return member;
}
