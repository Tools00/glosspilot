import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateEventInput,
  Event,
  EventWithWorkers,
  UpdateEventInput,
} from "@glosspilot/shared";
import { api } from "./client";

type EventListItem = Event & {
  workers: { id: number; name: string; initials: string; role: "ADMIN" | "WORKER" }[];
};

export const eventsKey = {
  range: (from: string, to: string, userId?: number) =>
    ["events", "range", from, to, userId ?? "all"] as const,
  detail: (id: number) => ["events", "detail", id] as const,
  today: ["events", "today"] as const,
};

export function useEventsRange(
  from: string,
  to: string,
  userId?: number,
  enabled = true,
) {
  return useQuery({
    queryKey: eventsKey.range(from, to, userId),
    queryFn: () => {
      const p = new URLSearchParams({ from, to });
      if (userId) p.set("userId", String(userId));
      return api<EventListItem[]>(`/events?${p.toString()}`);
    },
    enabled,
  });
}

export function useEvent(id: number | null) {
  return useQuery({
    queryKey: eventsKey.detail(id ?? -1),
    queryFn: () => api<EventWithWorkers>(`/events/${id}`),
    enabled: id !== null,
  });
}

export function useMyToday() {
  return useQuery({
    queryKey: eventsKey.today,
    queryFn: () =>
      api<
        (Event & {
          site: { id: number; clientName: string; address: string; color: string; status: string };
        })[]
      >("/me/today"),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      api<Event>("/events", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEventInput) =>
      api<Event>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<{ ok: true; id: number }>(`/events/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}
