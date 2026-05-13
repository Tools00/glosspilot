import { useState } from "react";
import { Link } from "react-router-dom";
import type { SiteStatus } from "@glosspilot/shared";
import { useMe } from "../api/auth";
import { useSitesList } from "../api/sites";
import { StatusBadge } from "../components/StatusBadge";
import { NewSiteModal } from "./NewSiteModal";

const FILTERS: { v: SiteStatus | undefined; label: string }[] = [
  { v: undefined, label: "All" },
  { v: "planned", label: "Planned" },
  { v: "active", label: "Active" },
  { v: "completed", label: "Completed" },
  { v: "archived", label: "Archived" },
];

export function SitesListPage() {
  const { data: me } = useMe();
  const [status, setStatus] = useState<SiteStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const list = useSitesList({ status, page, pageSize: 20 });
  const isAdmin = me?.role === "ADMIN";

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const pageSize = list.data?.pageSize ?? 20;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sites</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total} total · page {page} of {pages}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowNew(true)}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            + New site
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-1 text-sm">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => {
              setStatus(f.v);
              setPage(1);
            }}
            className={`rounded-md px-3 py-1.5 transition ${
              status === f.v
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/70 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Address</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Progress</th>
              <th className="px-4 py-3 text-left">Dates</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!list.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No sites match this filter.
                </td>
              </tr>
            )}
            {items.map((s) => {
              const pct =
                s.totalUnits > 0
                  ? Math.round((s.doneUnits / s.totalUnits) * 100)
                  : 0;
              return (
                <tr
                  key={s.id}
                  className="border-t border-slate-800 transition hover:bg-slate-900/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/sites/${s.id}`}
                      className="font-medium hover:text-emerald-400"
                    >
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                        style={{ background: s.color }}
                      />
                      {s.clientName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{s.address}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {s.doneUnits}/{s.totalUnits}{" "}
                    <span className="text-xs text-slate-500">({pct}%)</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {s.startDate ?? "—"} → {s.endDate ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex justify-end gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-slate-700 px-3 py-1.5 disabled:opacity-30"
          >
            ← Prev
          </button>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-slate-700 px-3 py-1.5 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}

      {showNew && <NewSiteModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
