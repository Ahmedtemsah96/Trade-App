export default function Stat({
  label, value, sub, tone = 'ink',
}: { label: string; value: string; sub?: string; tone?: 'ink' | 'sage' | 'clay' }) {
  const color = tone === 'sage' ? 'text-sage' : tone === 'clay' ? 'text-clay' : 'text-ink';
  return (
    <div className="border-l-2 border-paper-rule pl-4">
      <p className="text-micro font-medium text-ink-faint">{label}</p>
      <p className={`tnum mt-1.5 font-num text-2xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-micro text-ink-faint">{sub}</p>}
    </div>
  );
}
