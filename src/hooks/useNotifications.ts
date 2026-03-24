"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getBackendToken } from "@/lib/api";

export function useNotifications(
  events: Record<string, (data: unknown) => void>,
  enabled = true,
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = getBackendToken();
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const socket = io(`${apiUrl}/notifications`, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    for (const [event, handler] of Object.entries(events)) {
      socket.on(event, handler);
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]); // intentionally not including events to avoid reconnect loops
}
