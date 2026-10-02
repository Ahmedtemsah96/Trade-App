'use server';

import { asOwner } from '@/lib/db';
import { checkPassword, hashPassword, startSession } from '@/lib/auth';

type Result = { error?: string };

const clean = (v: string | undefined) => (v ?? '').trim();

export async function signIn(input: { email: string; password: string }): Promise<Result> {
  const email = clean(input.email).toLowerCase();
  const user = await asOwner((db) =>
    db.one<{ id: string; password_hash: string }>(
      'select id, password_hash from users where lower(email) = $1',
      [email],
    ),
  );
  if (!user || !(await checkPassword(input.password, user.password_hash))) {
    return { error: 'Invalid email or password.' };
  }
  await startSession(user.id);
  return {};
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  vatNumber: string;
}): Promise<Result> {
  const email = clean(input.email).toLowerCase();
  if (!email.includes('@')) return { error: 'Enter a valid email address.' };
  if ((input.password ?? '').length < 8) return { error: 'Use a password of at least 8 characters.' };

  const passwordHash = await hashPassword(input.password);
  try {
    // One transaction: the company, the login and the admin membership are
    // created together or not at all.
    const userId = await asOwner(async (db) => {
      const org = await db.one<{ id: string }>(
        'insert into organizations (name, vat_number) values ($1, $2) returning id',
        [clean(input.companyName) || 'My company', clean(input.vatNumber) || null],
      );
      const user = await db.one<{ id: string }>(
        'insert into users (email, password_hash) values ($1, $2) returning id',
        [email, passwordHash],
      );
      await db.all(
        `insert into members (user_id, organization_id, full_name, email, role)
         values ($1, $2, $3, $4, 'admin')`,
        [user!.id, org!.id, clean(input.fullName) || email.split('@')[0], email],
      );
      return user!.id;
    });
    await startSession(userId);
    return {};
  } catch (e: any) {
    if (e?.code === '23505') return { error: 'An account with this email already exists.' };
    throw e;
  }
}
