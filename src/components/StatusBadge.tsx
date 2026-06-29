const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
  error: "bg-rose-500/10 text-rose-400 ring-rose-500/30",
  running: "bg-blue-500/10 text-blue-400 ring-blue-500/30",
  waiting: "bg-slate-500/10 text-slate-400 ring-slate-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  success: "Başarılı",
  error: "Hatalı",
  running: "Çalışıyor",
  waiting: "Beklemede",
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const style = STATUS_STYLES[normalized] ?? STATUS_STYLES.waiting;
  const label = STATUS_LABELS[normalized] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}
