import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";

const NOTIFICATION_SOUND = "/notification.wav";

export function useNotifications() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

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
                console.log("Attempting to play sound:", NOTIFICATION_SOUND);
                const audio = new Audio(NOTIFICATION_SOUND);
                audio.volume = 1.0;
                const playPromise = audio.play();
                
                if (playPromise !== undefined) {
                  playPromise
                    .then(() => console.log("Audio played successfully!"))
                    .catch(e => console.error("Audio play blocked by browser:", e));
                }
              } catch (e) {
                console.error("Failed to play audio:", e);
              }

              toast("New Task Assigned", {
                description: `You have been assigned to: ${data.task_title}`,
                icon: React.createElement(BellRing, { className: "h-5 w-5 text-primary" }),
              });
            } else if (data.type === "BOARD_UPDATED") {
              queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
