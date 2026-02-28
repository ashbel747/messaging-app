"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function usePresence() {
  const updatePresence = useMutation(api.users.updatePresence);

  useEffect(() => {
    const update = () => updatePresence();

    update(); // initial call

    const interval = setInterval(update, 2000); //after 2s

    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [updatePresence]);
}