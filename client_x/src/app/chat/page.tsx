"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles"; // default LiveKit styles
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const { data: session } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    async function fetchToken() {
      const res = await fetch(
        `http://localhost:8000/get-token?identity=${encodeURIComponent(
          `${session?.user?.email || session?.user?.name || "guest"}`
        )}&room=fluentai`
      );
      const data = await res.json();
      setToken(data.token);
      setUrl(data.url);
    }

    fetchToken();
  }, [session]);

  if (!session) {
    return (
      <main className="flex items-center justify-center h-screen">
        <p>You must be logged in to join chat.</p>
      </main>
    );
  }

  if (!token || !url) {
    return (
      <main className="flex items-center justify-center h-screen">
        <p>Connecting to room...</p>
      </main>
    );
  }

  return (
    <LiveKitRoom
      video
      audio
      token={token}
      serverUrl={url}
      connect
      className="h-screen"
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
