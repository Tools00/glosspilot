import { useState } from "react";
import { Link } from "react-router-dom";
import { useMe } from "../api/auth";
import { useReportsList, useDeleteReport } from "../api/reports";
import { useSitesList } from "../api/sites";
import { useUsers } from "../api/users";
import { NewReportModal } from "./NewReportModal";

export function ReportsListPage() {
  const { data: me } = useMe();
  const sites = useSitesList({ pageSize: 100 });
  const users = useUsers();
  const [siteId, setSiteId] = useState<number | undefined>();
  const [userId, setUserId] = useState<number | undefined>();
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);

  const list = useReportsList({
    siteId,
    userId,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize: 20,
  });
  const del = useDeleteReport();
  const isAdmin = me?.role === "ADMIN";

  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total} report{total === 1 ? "" : "s"} total
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          + New report
        </button>
      </div>

      <div className="mb-6 grid gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterField label="Site">
          <select
            className={input}
            value={siteId ?? ""}
            onChange={(e) => {
              setPage(1);
              setSiteId(e.target.value ? Number(e.target.value) : undefined);
            }}
          >
            <option value="">All sites</option>
            {sites.data?.items.map((s) => (
              <option key={s.id} value={s.id}>
                {s.clientName}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Worker">
          <select
            className={input}
            value={userId ?? ""}
            onChange={(e) => {
              setPage(1);
              setUserId(e.target.value ? Number(e.target.value) : undefined);
            }}
          >
            <option value="">All workers</option>
            {users.data?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="From">
          <input
            type="date"
            className={input}
            value={from}
            onChange={(e) => {
              setPage(1);
              setFrom(e.target.value);
            }}
          />
        </FilterField>
        <FilterField label="To">
          <input
            type="date"
            className={input}
            value={to}
            onChange={(e) => {
              setPage(1);
              setTo(e.target.value);
            }}
          />
        </FilterField>
      </div>

      <div className="space-y-2">
        {list.isLoading && <div className="text-slate-400">Loading…</div>}
        {!list.isLoading && (list.data?.items.length ?? 0) === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-sm text-slate-500">
            No reports match the current filters.
          </div>
        )}
        {list.data?.items.map((r) => (
          <article
            key={r.id}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: r.site.color }}
                />
                <Link
                  to={`/sites/${r.site.id}`}
                  className="text-sm font-medium hover:text-emerald-400"
                >
                  {r.site.clientName}
                </Link>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400">
                  {r.user.name} ({r.user.initials})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {new Date(r.reportedAt).toLocaleString()}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this report?")) del.mutate(r.id);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
              {r.summary}
            </p>
          </article>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-700 px-3 py-1.5 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-slate-400">
            Page {page} of {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className="rounded-lg border border-slate-700 px-3 py-1.5 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {showNew && <NewReportModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

const input =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}
