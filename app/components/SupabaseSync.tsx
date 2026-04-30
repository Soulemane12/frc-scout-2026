"use client";

import { useEffect } from "react";
import { syncOnReconnect } from "../lib/storage";

export default function SupabaseSync() {
  useEffect(() => {
    syncOnReconnect().catch(() => {});
    const handleOnline = () => syncOnReconnect().catch(() => {});
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
