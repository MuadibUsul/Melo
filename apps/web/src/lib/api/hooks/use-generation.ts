"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import type { JobUpdatedEvent, JobView } from "@music/contracts";
import { api, getAccessToken } from "../client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      type: string;
      mode?: "simple" | "pro";
      params: Record<string, unknown>;
      idempotencyKey?: string;
      parentJobId?: string;
    }) => {
      const headers: Record<string, string> = {};
      if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1"}/generation/jobs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            ...headers,
          },
          credentials: "include",
          body: JSON.stringify(input),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "生成提交失败" }));
        throw new Error(body.message ?? "生成提交失败");
      }
      return response.json() as Promise<JobView & { isDuplicate: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useJobs(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["jobs", page, pageSize],
    queryFn: () => api.get<{ items: JobView[]; total: number }>(`/generation/jobs?page=${page}&pageSize=${pageSize}`),
  });
}

export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.get<JobView>(`/generation/jobs/${jobId}`),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (!job) return 2000;
      if (job.status === "queued" || job.status === "processing") return 2000;
      return false;
    },
  });
}

export function useJobRealtime(userId: string | undefined, onUpdate: (event: JobUpdatedEvent) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(`${SOCKET_URL}/realtime`, {
      auth: { userId },
      transports: ["websocket", "polling"],
    });

    socket.on("job.updated", onUpdate);
    socketRef.current = socket;

    return () => {
      socket.off("job.updated", onUpdate);
      socket.disconnect();
    };
  }, [userId, onUpdate]);
}

export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => api.post<JobView>(`/generation/jobs/${jobId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
