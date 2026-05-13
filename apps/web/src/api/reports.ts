import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateReportInput,
  Report,
  ReportListQuery,
  ReportWithJoins,
} from "@glosspilot/shared";
import { api } from "./client";

type ListResponse = {
  items: ReportWithJoins[];
  page: number;
  pageSize: number;
  total: number;
};

export const reportsKey = {
  list: (q: Partial<ReportListQuery>) => ["reports", "list", q] as const,
  detail: (id: number) => ["reports", "detail", id] as const,
};

export function useReportsList(query: Partial<ReportListQuery> = {}) {
  return useQuery({
    queryKey: reportsKey.list(query),
    queryFn: () => {
      const p = new URLSearchParams();
      if (query.siteId) p.set("siteId", String(query.siteId));
      if (query.userId) p.set("userId", String(query.userId));
      if (query.from) p.set("from", query.from);
      if (query.to) p.set("to", query.to);
      if (query.page) p.set("page", String(query.page));
      if (query.pageSize) p.set("pageSize", String(query.pageSize));
      const qs = p.toString();
      return api<ListResponse>(`/reports${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useReport(id: number | null) {
  return useQuery({
    queryKey: reportsKey.detail(id ?? -1),
    queryFn: () => api<ReportWithJoins>(`/reports/${id}`),
    enabled: id !== null,
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportInput) =>
      api<Report>("/reports", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<{ ok: true; id: number }>(`/reports/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
