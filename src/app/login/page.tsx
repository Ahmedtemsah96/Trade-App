import { configured } from '@/lib/db';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  if (!configured || !process.env.AUTH_SECRET) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <h1 className="text-2xl font-semibold">Connect your database first</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Create a file called <code className="bg-crate-soft px-1">.env.local</code> in the project
          folder with your Neon connection string and a session secret, then restart the dev
          server. The full steps are in <code className="bg-crate-soft px-1">SETUP.md</code>.
        </p>
        <pre className="mt-6 overflow-x-auto border border-paper-rule bg-white p-4 text-xs">
{`DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require
AUTH_SECRET=any-random-string-of-at-least-32-characters`}
        </pre>
      </main>
    );
  }
  return <LoginForm />;
}
