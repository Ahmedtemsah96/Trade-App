// A margin you can scan without reading the number.
export default function MarginBar({ pct }: { pct: number }) {
  const clamped = Math.max(-100, Math.min(100, pct));
  const width = Math.abs(clamped);
  const positive = clamped >= 0;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-20 bg-paper-rule/60" aria-hidden>
        <div
          className={`absolute top-0 h-full ${positive ? 'left-1/2 bg-sage' : 'right-1/2 bg-clay'}`}
          style={{ width: `${width / 2}%` }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-ink-faint/40" />
      </div>
      <span className={`tnum font-num text-sm ${positive ? 'text-sage' : 'text-clay'}`}>
        {clamped.toFixed(1)}%
      </span>
    </div>
  );
}
