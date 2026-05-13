import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import type { SiteStatus } from "@glosspilot/shared";
import { useMe } from "../api/auth";
import { useArchiveSite, useSite, useUpdateSite } from "../api/sites";
import { useReportsList, useDeleteReport } from "../api/reports";
import { StatusBadge } from "../components/StatusBadge";
import { NewReportModal } from "./NewReportModal";

export function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const siteId = id ? Number(id) : null;
  const { data: me } = useMe();
  const { data: site, isLoading, error } = useSite(siteId);
  const update = useUpdateSite(siteId ?? 0);
  const archive = useArchiveSite();
  const navigate = useNavigate();
  const isAdmin = me?.role === "ADMIN";
  const [showNewReport, setShowNewReport] = useState(false);
  const reports = useReportsList(
    siteId ? { siteId, pageSize: 20 } : {},
  );
  const delReport = useDeleteReport();

  if (isLoading) {
    return <div className="text-slate-400">Loading…</div>;
  }
  if (error || !site) {
    return (
      <div>
        <p className="text-rose-400">Site not found.</p>
        <Link to="/sites" className="mt-2 inline-block text-sm text-emerald-400">
          ← Back to sites
        </Link>
      </div>
    );
  }

  const pct =
    site.totalUnits > 0 ? Math.round((site.doneUnits / site.totalUnits) * 100) : 0;

  const setStatus = (status: SiteStatus) => {
    if (status === "archived") return; // use archive button
    update.mutate({ status: status as "planned" | "active" | "completed" });
  };

  const onArchive = () => {
    if (!siteId) return;
    if (!confirm(`Archive ${site.clientName}?`)) return;
    archive.mutate(siteId, {
      onSuccess: () => navigate("/sites"),
    });
  };

  return (
    <div>
      <Link to="/sites" className="text-xs text-slate-400 hover:text-slate-100">
        ← Sites
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: site.color }}
            />
            {site.clientName}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{site.address}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <StatusBadge status={site.status} />
            <span>·</span>
            <span>
              {site.startDate ?? "no start"} → {site.endDate ?? "no end"}
            </span>
            <span>·</span>
            <span>
              {site.doneUnits}/{site.totalUnits} units ({pct}%)
            </span>
          </div>
        </div>

        {isAdmin && site.status !== "archived" && (
          <div className="flex flex-wrap gap-2">
            {(["planned", "active", "completed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                disabled={site.status === s || update.isPending}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:border-slate-500 disabled:opacity-40"
              >
                {s}
              </button>
            ))}
            <button
              onClick={onArchive}
              disabled={archive.isPending}
              className="rounded-lg border border-rose-900 bg-rose-950/40 px-3 py-1.5 text-xs text-rose-300 hover:border-rose-700"
            >
              Archive
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tasks ({site.tasks.length})
          </h2>
          <div className="space-y-2">
            {site.tasks.map((t) => {
              const tpct = t.total > 0 ? Math.round((t.done / t.total) * 100) : 0;
              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-slate-400">
                      {t.done}/{t.total} {t.unit} ({tpct}%)
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${tpct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {site.tasks.length === 0 && (
              <div className="text-sm text-slate-500">No tasks defined.</div>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Materials ({site.materials.length})
          </h2>
          <div className="space-y-2">
            {site.materials.map((m) => {
              const mpct =
                m.neededQty > 0 ? Math.round((m.takenQty / m.neededQty) * 100) : 0;
              return (
                <div
                  key={m.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {m.name}
                      {m.variant && (
                        <span className="ml-2 text-xs text-slate-500">({m.variant})</span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">
                      {m.takenQty}/{m.neededQty} ({mpct}%)
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-sky-500"
                      style={{ width: `${mpct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {site.materials.length === 0 && (
              <div className="text-sm text-slate-500">No materials tracked.</div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Reports ({reports.data?.total ?? 0})
          </h2>
          <button
            onClick={() => setShowNewReport(true)}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
          >
            + New report
          </button>
        </div>
        <div className="space-y-2">
          {reports.data?.items.length === 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-500">
              No reports yet for this site.
            </div>
          )}
          {reports.data?.items.map((r) => (
            <article
              key={r.id}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {r.user.name} ({r.user.initials}) ·{" "}
                  {new Date(r.reportedAt).toLocaleString()}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this report?")) delReport.mutate(r.id);
                    }}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                {r.summary}
              </p>
            </article>
          ))}
        </div>
      </section>

      {showNewReport && siteId !== null && (
        <NewReportModal
          defaultSiteId={siteId}
          onClose={() => setShowNewReport(false)}
        />
      )}
    </div>
  );
}
