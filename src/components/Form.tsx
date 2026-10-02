'use client';

import { useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';

export function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? 'Saving…' : children}
    </button>
  );
}

/**
 * A disclosure panel holding a create form. Collapsed by default so the
 * table — the thing people came for — stays at the top of the page.
 */
export function AddPanel({
  action, label, title, children,
}: {
  action: (prev: any, form: FormData) => Promise<{ error?: string }>;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLFormElement>(null);

  async function onAction(formData: FormData) {
    const res = await action({}, formData);
    if (res?.error) setError(res.error);
    else { setError(''); ref.current?.reset(); setOpen(false); }
  }

  return (
    <div className="mb-6">
      <button onClick={() => setOpen(!open)} className={open ? 'btn-ghost' : 'btn-primary'}>
        {open ? 'Cancel' : label}
      </button>

      {open && (
        <form ref={ref} action={onAction} className="panel mt-4 p-5">
          <h2 className="mb-4 text-sm font-semibold">{title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
          {error && (
            <p className="mt-4 border-l-2 border-clay bg-clay-soft px-3 py-2 text-sm text-clay">
              {error}
            </p>
          )}
          <div className="mt-5">
            <Submit>{label.replace(/^Add |^New /, 'Save ')}</Submit>
          </div>
        </form>
      )}
    </div>
  );
}

export function Field({
  name, label, type = 'text', required, placeholder, step, defaultValue, min,
}: any) {
  return (
    <div>
      <label className="lbl" htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type} required={required} placeholder={placeholder}
        step={step} min={min} defaultValue={defaultValue} className="field"
      />
    </div>
  );
}

export function Select({ name, label, options, required, defaultValue, placeholder }: any) {
  return (
    <div>
      <label className="lbl" htmlFor={name}>{label}</label>
      <select id={name} name={name} required={required} defaultValue={defaultValue} className="field">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([v, l]: [string, string]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

export function DeleteButton({
  id, action, confirmText = 'Delete this row?',
}: { id: string; action: (id: string) => Promise<void>; confirmText?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        if (!confirm(confirmText)) return;
        setBusy(true);
        await action(id);
        setBusy(false);
      }}
      disabled={busy}
      className="text-micro text-ink-faint underline underline-offset-2 hover:text-clay"
    >
      {busy ? 'Removing…' : 'Remove'}
    </button>
  );
}
