import { Link } from "react-router-dom";
import { useMe } from "../api/auth";
import { useDeleteEvent, useEvent } from "../api/events";
import { StatusBadge } from "../components/StatusBadge";

export function EventDetailModal({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const { data: me } = useMe();
  const { data: ev, isLoading } = useEvent(id);
  const del = useDeleteEvent();
  const isAdmin = me?.role === "ADMIN";

  const onDelete = () => {
    if (!confirm(`Delete event "${ev?.title}"?`)) return;
    del.mutate(id, { onSuccess: onClose });
  };

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-1 h-3 w-3 rounded-full"
              style={{ background: ev?.color ?? "#666" }}
            />
            <div>
              <h2 className="text-lg font-semibold">{isLoading ? "…" : ev?.title}</h2>
              {ev && (
                <div className="mt-1 text-xs text-slate-400">
                  {ev.startDate} → {ev.endDate}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            ✕
          </button>
        </div>

        {ev && (
          <div className="space-y-4 px-6 py-5 text-sm">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Site</div>
              <Link
                to={`/sites/${ev.site.id}`}
                className="inline-flex items-center gap-2 text-slate-100 hover:text-emerald-400"
                onClick={onClose}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: ev.site.color }}
                />
                {ev.site.clientName}
                <StatusBadge status={ev.site.status} />
              </Link>
              <div className="mt-1 text-xs text-slate-400">{ev.site.address}</div>
            </div>

            {ev.note && (
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Note</div>
                <p className="whitespace-pre-wrap text-slate-300">{ev.note}</p>
              </div>
            )}

            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Workers ({ev.workers.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {ev.workers.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-xs"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-800 text-[10px] font-bold">
                      {w.initials}
                    </span>
                    {w.name}
                  </div>
                ))}
                {ev.workers.length === 0 && (
                  <span className="text-xs text-slate-500">Nobody assigned.</span>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={onDelete}
                  disabled={del.isPending}
                  className="rounded-lg border border-rose-900 bg-rose-950/40 px-3 py-1.5 text-xs text-rose-300 hover:border-rose-700 disabled:opacity-50"
                >
                  Delete event
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
