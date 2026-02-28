"use client";

import { usePresence } from "@/hooks/usePresence";

export default function PresenceProvider() {
  usePresence();
  return null; // no UI
}