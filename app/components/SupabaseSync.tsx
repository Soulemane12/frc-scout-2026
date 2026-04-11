"use client";

import { useEffect } from "react";
import { syncOnReconnect, purgeOldData } from "../lib/storage";

export default function SupabaseSync() {
  useEffect(() => {
    purgeOldData().catch(() => {});
    syncOnReconnect().catch(() => {});
    const handleOnline = () => syncOnReconnect().catch(() => {});
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
