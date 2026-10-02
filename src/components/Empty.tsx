export default function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="border border-dashed border-paper-rule px-6 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-faint">{hint}</p>
    </div>
  );
}
