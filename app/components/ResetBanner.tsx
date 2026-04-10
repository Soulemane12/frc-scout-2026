"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { STORAGE_KEY, PIT_STORAGE_KEY } from "../lib/storage";

export default function ResetBanner() {
  const [show, setShow] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    async function check() {
      // Only run if this device has local data
      const hasLocal =
        (localStorage.getItem(STORAGE_KEY) ?? "[]") !== "[]" ||
        (localStorage.getItem(PIT_STORAGE_KEY) ?? "[]") !== "[]";
      if (!hasLocal) return;

      // Lightweight count check — no data transfer
      const { count: matchCount, error: mErr } = await supabase
        .from("match_entries")
        .select("*", { count: "exact", head: true });
      const { count: pitCount, error: pErr } = await supabase
        .from("pit_entries")
        .select("*", { count: "exact", head: true });

      if (mErr || pErr) return; // network issue — don't prompt
      if ((matchCount ?? 1) === 0 && (pitCount ?? 1) === 0) {
        setShow(true);
      }
    }
    check();
  }, []);

  if (!show) return null;

  function clear() {
    setClearing(true);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PIT_STORAGE_KEY);
    window.dispatchEvent(new Event("scout-updated"));
    setShow(false);
    setClearing(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-red-500 px-6 py-5 text-white text-center">
          <div className="text-3xl mb-2">🔄</div>
          <h2 className="text-lg font-bold">Data Reset</h2>
          <p className="text-sm text-red-100 mt-1">
            The admin has cleared all scouting data. Your device still has old entries.
          </p>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3">
          <p className="text-sm text-slate-600 text-center">
            Tap the button below to clear your local data and stay in sync.
          </p>
          <button
            onClick={clear}
            disabled={clearing}
            className="w-full rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-3 text-base transition-colors disabled:opacity-50"
          >
            {clearing ? "Clearing…" : "Clear My Data Now"}
          </button>
          <button
            onClick={() => setShow(false)}
            className="w-full rounded-xl border border-slate-200 text-slate-500 font-medium py-2.5 text-sm hover:bg-slate-50 transition-colors"
          >
            Dismiss for now
          </button>
        </div>
      </div>
    </div>
  );
}
