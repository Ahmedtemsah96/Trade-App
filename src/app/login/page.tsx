'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    vatNumber: '',
  });

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    const supabase = createClient();

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) setError(error.message);
      else router.push('/');
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            company_name: form.companyName,
            vat_number: form.vatNumber,
          },
        },
      });
      if (error) setError(error.message);
      else if (data.session) router.push('/');
      else setNotice('Check your inbox to confirm the address, then sign in.');
    }
    setBusy(false);
    router.refresh();
  }

  if (!configured) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <h1 className="text-2xl font-semibold">Connect your database first</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Create a file called <code className="bg-crate-soft px-1">.env.local</code> in the project
          folder with your Supabase project URL and anon key, then restart the dev server. The full
          steps are in <code className="bg-crate-soft px-1">SETUP.md</code>.
        </p>
        <pre className="mt-6 overflow-x-auto border border-paper-rule bg-white p-4 text-xs">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...`}
        </pre>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Left: the pitch, in the product's own vocabulary */}
      <section className="hidden flex-col justify-between bg-ink px-12 py-14 text-white lg:flex">
        <p className="font-num text-micro tracking-widest text-crate">CONTAINER LEDGER</p>
        <div className="max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            Every container is a cost centre.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-white/70">
            Goods, freight, clearance, fermentation and labour land against the container they
            belong to. Sales land against the same one. Margin is what is left, per carton, the
            moment you post the entry.
          </p>
          <dl className="mt-10 space-y-4 border-t border-white/15 pt-8 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Cost types tracked</dt>
              <dd className="tnum font-num">11</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Tenant isolation</dt>
              <dd className="font-num">Postgres RLS</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Reporting currency</dt>
              <dd className="font-num">SAR</dd>
            </div>
          </dl>
        </div>
        <p className="text-micro text-white/40">Built for produce importers.</p>
      </section>

      {/* Right: the form */}
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold">
            {mode === 'signin' ? 'Sign in' : 'Create your company workspace'}
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            {mode === 'signin'
              ? 'Use the address your workspace was created with.'
              : 'Your company gets its own isolated set of books.'}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="lbl" htmlFor="company">Company name</label>
                  <input id="company" required className="field" value={form.companyName}
                    onChange={set('companyName')} placeholder="Al Arabia Trading" />
                </div>
                <div>
                  <label className="lbl" htmlFor="name">Your name</label>
                  <input id="name" required className="field" value={form.fullName}
                    onChange={set('fullName')} placeholder="Ahmed Temsah" />
                </div>
                <div>
                  <label className="lbl" htmlFor="vat">VAT registration number</label>
                  <input id="vat" className="field" value={form.vatNumber}
                    onChange={set('vatNumber')} placeholder="3xxxxxxxxxxxxx3 — optional" />
                </div>
              </>
            )}
            <div>
              <label className="lbl" htmlFor="email">Work email</label>
              <input id="email" type="email" required className="field" value={form.email}
                onChange={set('email')} autoComplete="email" />
            </div>
            <div>
              <label className="lbl" htmlFor="password">Password</label>
              <input id="password" type="password" required minLength={6} className="field"
                value={form.password} onChange={set('password')}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </div>

            {error && (
              <p className="border-l-2 border-clay bg-clay-soft px-3 py-2 text-sm text-clay">
                {error}
              </p>
            )}
            {notice && (
              <p className="border-l-2 border-sage bg-sage-soft px-3 py-2 text-sm text-sage">
                {notice}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create workspace'}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice(''); }}
            className="mt-6 text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            {mode === 'signin' ? 'Set up a new company workspace' : 'I already have an account'}
          </button>
        </div>
      </section>
    </main>
  );
}
