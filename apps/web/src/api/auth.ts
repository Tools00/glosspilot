import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoginInput, UserPublic } from "@glosspilot/shared";
import { api, ApiError } from "./client";

export const ME_KEY = ["me"] as const;

export function useMe() {
  return useQuery<UserPublic | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await api<UserPublic>("/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api<UserPublic>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (user) => {
      qc.setQueryData(ME_KEY, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ ok: true }>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.invalidateQueries();
    },
  });
}
