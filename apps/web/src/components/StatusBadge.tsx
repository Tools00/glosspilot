import type { SiteStatus } from "@glosspilot/shared";

const styles: Record<SiteStatus, string> = {
  planned: "bg-slate-700 text-slate-200",
  active: "bg-emerald-500/20 text-emerald-300 border border-emerald-700/50",
  completed: "bg-sky-500/20 text-sky-300 border border-sky-700/50",
  archived: "bg-slate-800 text-slate-500",
};

export function StatusBadge({ status }: { status: SiteStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
