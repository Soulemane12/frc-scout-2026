"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchAllConferenceEntries, fetchAllPitEntries,
  deleteConferenceEntries, deletePitEntries, deleteAllData,
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

export default function MentorPage() {
  const [tab, setTab] = useState<Tab>("conference");
  const [conferenceEntries, setConferenceEntries] = useState<ConferenceEntry[]>([]);
  const [pitEntries, setPitEntries] = useState<PitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [conf, pit] = await Promise.all([fetchAllConferenceEntries(), fetchAllPitEntries()]);
    setConferenceEntries(conf);
    setPitEntries(pit);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

  async function handleDeleteAll() {
    if (!confirm("Delete ALL data (conference + pit entries + photos)? This cannot be undone.")) return;
    setDeleting(true);
    await deleteAllData();
    setConferenceEntries([]);
    setPitEntries([]);
    setDeleting(false);
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mentor View</h1>
        <button
          onClick={load}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          Refresh
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
            {t === "conference" ? `Conference (${conferenceEntries.length})` : `Pit (${pitEntries.length})`}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-slate-400">Loading...</p>
      )}

      {/* Conference tab */}
      {!loading && tab === "conference" && (
        <div className="flex flex-col gap-3">
          {conferenceEntries.length === 0 && (
            <p className="text-sm text-slate-400">No conference submissions yet.</p>
          )}
          {conferenceEntries.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{e.firstName} {e.lastName}</CardTitle>
                  <span className="text-xs text-slate-400">{formatDate(e.timestamp)}</span>
                </div>
                {e.conferenceName && (
                  <p className="text-xs font-semibold text-blue-600 mt-0.5">{e.conferenceName}</p>
                )}
              </CardHeader>
              {e.learned && (
                <CardContent>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{e.learned}</p>
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
            <p className="text-sm text-slate-400">No pit submissions yet.</p>
          )}
          {pitEntries.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{e.firstName} {e.lastName}</CardTitle>
                  <span className="text-xs text-slate-400">{formatDate(e.timestamp)}</span>
                </div>
                {e.teamNameAndNumber && (
                  <p className="text-xs font-semibold text-blue-600 mt-0.5">{e.teamNameAndNumber}</p>
                )}
                {e.instagram && (
                  <p className="text-xs text-slate-500 mt-0.5">Instagram: {e.instagram}</p>
                )}
              </CardHeader>
              <CardContent>
                {e.photoUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {e.photoUrls.map((url, i) => (
                      <img
                        key={`${e.id}-photo-${i}`}
                        src={url}
                        alt={`${e.teamNameAndNumber} photo ${i + 1}`}
                        className="h-24 w-full rounded-lg border border-slate-200 object-cover"
                      />
                    ))}
                  </div>
                )}
                {e.learned && (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{e.learned}</p>
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

      {/* Delete all */}
      {!loading && (conferenceEntries.length > 0 || pitEntries.length > 0) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700 font-medium mb-3">Danger Zone</p>
          <Button variant="destructive" onClick={handleDeleteAll} disabled={deleting} className="w-full">
            {deleting ? "Deleting..." : "Delete All Data"}
          </Button>
        </div>
      )}

      <div className="pb-4" />
    </main>
  );
}
