import { useQuery } from "@tanstack/react-query";
import type { UserPublic } from "@glosspilot/shared";
import { api } from "./client";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api<UserPublic[]>("/users"),
    staleTime: 5 * 60_000, // 5 min — users don't change often
  });
}
