'use client';

import { useState } from 'react';
import { seedDemoData } from '@/app/actions';

export default function SeedButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div>
      <button
        className="btn-ghost"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const res = await seedDemoData();
          if (res?.error) setError(res.error);
          setBusy(false);
        }}
      >
        {busy ? 'Loading…' : 'Load sample data'}
      </button>
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}
    </div>
  );
}
