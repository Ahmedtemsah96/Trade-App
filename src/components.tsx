import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { loadSampleData } from './seed';
import { useSaveFailed } from './store';

export const fdStr = (f: FormData, k: string) => { const v = String(f.get(k) ?? '').trim(); return v === '' ? null : v; };
export const fdNum = (f: FormData, k: string) => { const v = fdStr(f, k); return v === null ? null : Number(v); };

export function Stat({ label, value, sub, tone = 'ink' }: { label: string; value: string; sub?: string; tone?: 'ink' | 'sage' | 'clay' }) {
  const color = tone === 'sage' ? 'text-sage' : tone === 'clay' ? 'text-clay' : 'text-ink';
  return (
    <div className="border-l-2 border-paper-rule pl-4">
      <p className="text-micro font-medium text-ink-faint">{label}</p>
      <p className={`tnum mt-1.5 font-num text-2xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-micro text-ink-faint">{sub}</p>}
    </div>
  );
}

// A margin you can scan without reading the number.
export function MarginBar({ pct }: { pct: number }) {
  const clamped = Math.max(-100, Math.min(100, pct));
  const positive = clamped >= 0;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-20 bg-paper-rule/60" aria-hidden>
        <div className={`absolute top-0 h-full ${positive ? 'left-1/2 bg-sage' : 'right-1/2 bg-clay'}`}
          style={{ width: `${Math.abs(clamped) / 2}%` }} />
        <div className="absolute left-1/2 top-0 h-full w-px bg-ink-faint/40" />
      </div>
      <span className={`tnum font-num text-sm ${positive ? 'text-sage' : 'text-clay'}`}>{clamped.toFixed(1)}%</span>
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="border border-dashed border-paper-rule px-6 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-faint">{hint}</p>
    </div>
  );
}

export function Header({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">{children}</p>
    </header>
  );
}

/** A collapsed create form. `onSubmit` returns an error message to show, or nothing on success. */
export function AddPanel({ onSubmit, label, title, children }: {
  onSubmit: (f: FormData) => string | void; label: string; title: string; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err = onSubmit(new FormData(e.currentTarget));
    if (err) setError(err); else { setError(''); setOpen(false); }
  }

  return (
    <div className="mb-6">
      <button onClick={() => { setOpen(!open); setError(''); }} className={open ? 'btn-ghost' : 'btn-primary'}>
        {open ? 'Cancel' : label}
      </button>
      {open && (
        <form onSubmit={handle} className="panel mt-4 p-5">
          <h2 className="mb-4 text-sm font-semibold">{title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
          {error && <p className="mt-4 border-l-2 border-clay bg-clay-soft px-3 py-2 text-sm text-clay">{error}</p>}
          <div className="mt-5"><button type="submit" className="btn-primary">Save</button></div>
        </form>
      )}
    </div>
  );
}

export function Field({ name, label, type = 'text', required, placeholder, step, defaultValue, min }: {
  name: string; label: string; type?: string; required?: boolean; placeholder?: string; step?: string; defaultValue?: string | number; min?: string;
}) {
  return (
    <div>
      <label className="lbl" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} required={required} placeholder={placeholder}
        step={step} min={min} defaultValue={defaultValue} className="field" />
    </div>
  );
}

export function Select({ name, label, options, required, defaultValue, placeholder }: {
  name: string; label: string; options: readonly (readonly [string, string])[]; required?: boolean; defaultValue?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="lbl" htmlFor={name}>{label}</label>
      <select id={name} name={name} required={required} defaultValue={defaultValue ?? ''} className="field">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

export function DeleteButton({ onDelete, confirmText = 'Delete this row?' }: { onDelete: () => void; confirmText?: string }) {
  return (
    <button onClick={() => { if (confirm(confirmText)) onDelete(); }}
      className="text-micro text-ink-faint underline underline-offset-2 hover:text-clay">Remove</button>
  );
}

export function SeedButton() {
  const [error, setError] = useState('');
  return (
    <div>
      <button className="btn-ghost" onClick={() => setError(loadSampleData() ?? '')}>Load sample data</button>
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}
    </div>
  );
}

const LINKS = [
  ['', 'Overview'], ['containers', 'Containers'], ['costs', 'Costs'], ['quality', 'Quality'],
  ['sales', 'Sales'], ['vendors', 'Vendors'], ['settings', 'Settings'],
] as const;

export function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('?')[0];
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function Nav({ company, route }: { company: string; route: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(!open)} aria-label="Toggle navigation"
        className="fixed left-3 top-3 z-50 rounded-sm border border-paper-rule bg-white px-3 py-2 text-sm lg:hidden">
        {open ? 'Close' : 'Menu'}
      </button>
      <nav className={`${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-ink px-5 py-6 text-white transition-transform lg:static lg:translate-x-0`}>
        <div className="mb-8 mt-8 lg:mt-0">
          <p className="font-num text-micro tracking-widest text-crate">CONTAINER LEDGER</p>
          <p className="mt-2 truncate text-sm font-medium">{company}</p>
        </div>
        <ul className="flex-1 space-y-0.5">
          {LINKS.map(([href, name]) => (
            <li key={href}>
              <a href={`#/${href}`} onClick={() => setOpen(false)}
                className={`block border-l-2 py-2 pl-3 text-sm transition-colors ${route === href
                  ? 'border-crate bg-white/5 font-medium text-white' : 'border-transparent text-white/60 hover:text-white'}`}>
                {name}
              </a>
            </li>
          ))}
        </ul>
        <p className="border-t border-white/15 pt-4 text-micro text-white/50">
          Saved in this browser. Download a backup from Settings.
        </p>
      </nav>
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-ink/40 lg:hidden" />}
    </>
  );
}

export function SaveWarning() {
  if (!useSaveFailed()) return null;
  return (
    <div className="mb-6 border-l-2 border-clay bg-clay-soft px-4 py-3 text-sm text-clay">
      This browser is blocking storage, so your changes will be lost when you close the page.
      Allow site data for this page, or download a backup from Settings after each session.
    </div>
  );
}
