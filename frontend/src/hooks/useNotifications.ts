import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";

const NOTIFICATION_SOUND = "/notification.wav";
let audioUnlocked = false;
let globalAudio: HTMLAudioElement | null = null;

const primeAudio = () => {
  if (audioUnlocked || typeof window === "undefined") return;
  try {
    globalAudio = new Audio(NOTIFICATION_SOUND);
    globalAudio.volume = 0.01;
    const playPromise = globalAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (globalAudio) {
            globalAudio.pause();
            globalAudio.currentTime = 0;
            globalAudio.volume = 1.0;
          }
          audioUnlocked = true;
          window.removeEventListener("pointerdown", primeAudio);
          window.removeEventListener("keydown", primeAudio);
        })
        .catch(() => {});
    }
  } catch {
  }
};

export function useNotifications() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("pointerdown", primeAudio);
    window.addEventListener("keydown", primeAudio);
    return () => {
      window.removeEventListener("pointerdown", primeAudio);
      window.removeEventListener("keydown", primeAudio);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let isComponentMounted = true;
    let reconnectTimer: NodeJS.Timeout;

    const connectWebSocket = async () => {
      try {
        const token = await getToken();
        if (!token || !isComponentMounted) return;

        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        let wsUrl;
        
        if (import.meta.env.VITE_API_URL) {
           const apiBase = import.meta.env.VITE_API_URL;
           const url = new URL(apiBase);
           url.protocol = wsProtocol;
           wsUrl = `${url.toString().replace(/\/$/, '')}/api/ws?token=${token}`;
        } else {
           wsUrl = `${wsProtocol}//${window.location.host}/api/ws?token=${token}`;
        }
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected for notifications");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "TASK_ASSIGNED") {
              try {
                const audio = new Audio(NOTIFICATION_SOUND);
                audio.volume = 1.0;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                  playPromise.catch(() => {});
                }
              } catch {
              }

              toast("New Task Assigned", {
                description: `You have been assigned to: ${data.task_title}`,
                icon: React.createElement(BellRing, { className: "h-5 w-5 text-primary" }),
              });
            } else if (data.type === "TASK_UPDATED" && data.task) {
              queryClient.setQueriesData({ queryKey: ["tasks"] }, (oldData: any) => {
                if (!Array.isArray(oldData)) return oldData;
                return oldData.map((t: any) => (t.id === data.task.id ? data.task : t));
              });
            } else if (data.type === "TASK_CREATED" && data.task) {
              queryClient.setQueriesData({ queryKey: ["tasks"] }, (oldData: any) => {
                if (!Array.isArray(oldData)) return [data.task];
                if (oldData.some((t: any) => t.id === data.task.id)) return oldData;
                return [...oldData, data.task];
              });
            } else if (data.type === "TASK_DELETED" && data.task_id) {
              queryClient.setQueriesData({ queryKey: ["tasks"] }, (oldData: any) => {
                if (!Array.isArray(oldData)) return oldData;
                return oldData.filter((t: any) => t.id !== data.task_id);
              });
            } else if (data.type === "BOARD_UPDATED") {
              queryClient.invalidateQueries({ queryKey: ["tasks"] });
            } else if (data.type === "PRESENCE_UPDATED") {
              const event = new CustomEvent("on_presence_update", {
                detail: data.online_users
              });
              window.dispatchEvent(event);
            }
          } catch (e) {
            console.error("Error parsing WS message:", e);
          }
        };

        ws.onclose = (e) => {
          console.log("WebSocket closed", e.code);
          wsRef.current = null;
          if (isComponentMounted && e.code !== 1008) {
            reconnectTimer = setTimeout(connectWebSocket, 5000);
          }
        };

        ws.onerror = (e) => {
          console.error("WebSocket error", e);
        };
      } catch (e) {
        console.error("Error setting up WS:", e);
      }
    };

    connectWebSocket();

    return () => {
      isComponentMounted = false;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [getToken, isLoaded, isSignedIn]);
}
