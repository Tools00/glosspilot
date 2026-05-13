import { useQuery } from "@tanstack/react-query";
import type { Dashboard } from "@glosspilot/shared";
import { api } from "./client";

export const dashboardKey = ["dashboard"] as const;

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: () => api<Dashboard>("/dashboard"),
    enabled,
  });
}
