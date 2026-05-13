import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateSiteInput,
  Site,
  SiteListQuery,
  SiteStatus,
  SiteWithChildren,
  UpdateSiteInput,
} from "@glosspilot/shared";
import { api } from "./client";

type ListResponse = {
  items: Site[];
  page: number;
  pageSize: number;
  total: number;
};

export const sitesKey = {
  list: (q: Partial<SiteListQuery>) => ["sites", "list", q] as const,
  detail: (id: number) => ["sites", "detail", id] as const,
};

export function useSitesList(query: Partial<SiteListQuery> = {}) {
  return useQuery({
    queryKey: sitesKey.list(query),
    queryFn: () => {
      const params = new URLSearchParams();
      if (query.status) params.set("status", query.status);
      if (query.page) params.set("page", String(query.page));
      if (query.pageSize) params.set("pageSize", String(query.pageSize));
      const qs = params.toString();
      return api<ListResponse>(`/sites${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useSite(id: number | null) {
  return useQuery({
    queryKey: sitesKey.detail(id ?? -1),
    queryFn: () => api<SiteWithChildren>(`/sites/${id}`),
    enabled: id !== null,
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSiteInput) =>
      api<Site>("/sites", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
}

export function useUpdateSite(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSiteInput) =>
      api<Site>(`/sites/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export function useArchiveSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<{ ok: true; id: number; status: SiteStatus }>(`/sites/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
}
