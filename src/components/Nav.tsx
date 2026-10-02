'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const LINKS = [
  ['/', 'Overview'],
  ['/containers', 'Containers'],
  ['/costs', 'Costs'],
  ['/quality', 'Quality'],
  ['/sales', 'Sales'],
  ['/vendors', 'Vendors'],
  ['/settings', 'Settings'],
];

export default function Nav({ company, person }: { company: string; person: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
        className="fixed left-3 top-3 z-50 rounded-sm border border-paper-rule bg-white px-3 py-2 text-sm lg:hidden"
      >
        {open ? 'Close' : 'Menu'}
      </button>

      <nav
        className={`${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-ink px-5 py-6 text-white
          transition-transform lg:static lg:translate-x-0`}
      >
        <div className="mb-8 mt-8 lg:mt-0">
          <p className="font-num text-micro tracking-widest text-crate">CONTAINER LEDGER</p>
          <p className="mt-2 truncate text-sm font-medium">{company}</p>
        </div>

        <ul className="flex-1 space-y-0.5">
          {LINKS.map(([href, name]) => {
            const active = href === '/' ? path === '/' : path.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block border-l-2 py-2 pl-3 text-sm transition-colors ${
                    active
                      ? 'border-crate bg-white/5 font-medium text-white'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-white/15 pt-4">
          <p className="truncate text-micro text-white/50">{person}</p>
          <form action="/auth/signout" method="post">
            <button className="mt-2 text-sm text-white/70 underline underline-offset-4 hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-ink/40 lg:hidden" />
      )}
    </>
  );
}
