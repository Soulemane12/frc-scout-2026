"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchAllConferenceEntries, fetchAllPitEntries,
  deleteConferenceEntries, deletePitEntries,
} from "../lib/storage";
import type { ConferenceEntry, PitEntry } from "../lib/types";
import { Card, CardHeader, CardTitle, CardContent, Button } from "../components/ui";
import { cn } from "../lib/utils";

type Tab = "conference" | "pit";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function timeAgo(ts: number) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function MentorPage() {
  const [tab, setTab] = useState<Tab>("conference");
  const [conferenceEntries, setConferenceEntries] = useState<ConferenceEntry[]>([]);
  const [pitEntries, setPitEntries] = useState<PitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const [conf, pit] = await Promise.all([fetchAllConferenceEntries(), fetchAllPitEntries()]);
    setConferenceEntries(conf);
    setPitEntries(pit);
    setLastUpdated(Date.now());
    if (!silent) setLoading(false);
    else setRefreshing(false);
  }, []);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Refresh whenever the tab regains focus (new submissions from other devices)
  useEffect(() => {
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  // Tick "last updated" display every 10 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  async function handleDeleteConference(id: string) {
    if (!confirm("Delete this conference entry?")) return;
    await deleteConferenceEntries([id]);
    setConferenceEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleDeletePit(id: string) {
    if (!confirm("Delete this pit entry?")) return;
    await deletePitEntries([id]);
    setPitEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Submissions</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
              Live from database
            </span>
            {lastUpdated && (
              <span className="text-xs text-slate-400">· Updated {timeAgo(lastUpdated)}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
        >
          <svg className={cn("h-3 w-3", refreshing && "animate-spin")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {(["conference", "pit"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all",
              tab === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            {t === "conference"
              ? `Conference (${conferenceEntries.length})`
              : `Pit (${pitEntries.length})`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-slate-100 bg-slate-50 animate-pulse" />
          ))}
        </div>
      )}

      {/* Conference tab */}
      {!loading && tab === "conference" && (
        <div className="flex flex-col gap-3">
          {conferenceEntries.length === 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-400">No conference submissions yet.</p>
              <p className="text-xs text-slate-300 mt-1">Submissions will appear here as people fill out the form.</p>
            </div>
          )}
          {conferenceEntries.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{e.firstName} {e.lastName}</CardTitle>
                  <span className="shrink-0 text-xs text-slate-400">{formatDate(e.timestamp)}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {e.division && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{e.division}</span>}
                  {e.teamNumber && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">#{e.teamNumber}{e.teamName ? ` · ${e.teamName}` : ""}</span>}
                  {e.conferenceName && <span className="text-xs text-slate-500">{e.conferenceName}</span>}
                </div>
              </CardHeader>
              {e.learned && (
                <CardContent>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{e.learned}</p>
                </CardContent>
              )}
              <div className="flex justify-end px-6 pb-4">
                <Button variant="destructive" size="sm" onClick={() => handleDeleteConference(e.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pit tab */}
      {!loading && tab === "pit" && (
        <div className="flex flex-col gap-3">
          {pitEntries.length === 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-400">No pit submissions yet.</p>
              <p className="text-xs text-slate-300 mt-1">Submissions will appear here as people fill out the form.</p>
            </div>
          )}
          {pitEntries.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{e.firstName} {e.lastName}</CardTitle>
                  <span className="shrink-0 text-xs text-slate-400">{formatDate(e.timestamp)}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {e.division && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{e.division}</span>}
                  {e.teamNumber && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">#{e.teamNumber}{e.teamName ? ` · ${e.teamName}` : ""}</span>}
                </div>
                {e.instagram && (
                  <p className="text-xs text-slate-500 mt-0.5">@{e.instagram.replace(/^@/, "")}</p>
                )}
              </CardHeader>
              <CardContent>
                {e.photoUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {e.photoUrls.map((url, i) => (
                      <a key={`${e.id}-photo-${i}`} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`${e.teamNumber} ${e.teamName} photo ${i + 1}`}
                          className="h-24 w-full rounded-lg border border-slate-200 object-cover hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}
                {e.learned && (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{e.learned}</p>
                )}
              </CardContent>
              <div className="flex justify-end px-6 pb-4">
                <Button variant="destructive" size="sm" onClick={() => handleDeletePit(e.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="pb-4" />
    </main>
  );
}
