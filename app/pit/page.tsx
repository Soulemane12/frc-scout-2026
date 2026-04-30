"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Textarea, Label,
} from "../components/ui";
import { loadPitEntries, savePitEntries } from "../lib/storage";
import { supabase } from "../lib/supabase";
import type { PitEntry } from "../lib/types";

const ROBOT_PHOTOS_BUCKET = "robot-photos";

type PhotoDraft = {
  id: string;
  file: File;
  previewUrl: string;
};

const BLANK = {
  firstName: "",
  lastName: "",
  teamNameAndNumber: "",
  instagram: "",
  learned: "",
};

export default function PitPage() {
  const [f, setF] = useState(BLANK);
  const [submitted, setSubmitted] = useState(false);
  const [photoDrafts, setPhotoDrafts] = useState<PhotoDraft[]>([]);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof BLANK>(key: K, val: string) {
    setF((prev) => ({ ...prev, [key]: val }));
  }

  async function uploadPhotos(entryId: string): Promise<string[]> {
    const uploads = await Promise.all(
      photoDrafts.map(async ({ file }, i) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const teamSlug = f.teamNameAndNumber.replace(/\s+/g, "-").toLowerCase() || "unknown-team";
        const path = `${teamSlug}/${entryId}/${i + 1}-${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(ROBOT_PHOTOS_BUCKET).upload(path, file, {
          cacheControl: "31536000",
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (error) throw error;
        return supabase.storage.from(ROBOT_PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl;
      })
    );
    return uploads;
  }

  async function handleSubmit() {
    if (!f.firstName.trim() || !f.lastName.trim()) {
      alert("Please fill in your first and last name before submitting.");
      return;
    }
    setSaving(true);
    try {
      const id = crypto.randomUUID();
      const photoUrls = photoDrafts.length > 0 ? await uploadPhotos(id) : [];
      const entry: PitEntry = { ...f, photoUrls, id, timestamp: Date.now() };
      savePitEntries([entry, ...loadPitEntries()]);
      photoDrafts.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
      setPhotoDrafts([]);
      setF(BLANK);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (error) {
      console.error(error);
      alert("Could not upload photos. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoChange(files: FileList | null) {
    if (!files?.length) return;
    const next = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotoDrafts((prev) => [...prev, ...next]);
  }

  function removePhotoDraft(id: string) {
    setPhotoDrafts((prev) => {
      const draft = prev.find((p) => p.id === id);
      if (draft) URL.revokeObjectURL(draft.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">

      {submitted && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-medium text-green-800">
          <span className="text-base">✓</span> Pit entry saved!
        </div>
      )}

      <div className="pb-1">
        <h1 className="text-2xl font-bold text-slate-900">PIT</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Team Name and Number</CardTitle></CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="e.g. 4571 Titan"
            value={f.teamNameAndNumber}
            onChange={(e) => set("teamNameAndNumber", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Can I take a picture of your pit? Can I take a picture of your robot? Can I take a group pic with you guys?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => document.getElementById("photo-input")?.click()}
            >
              <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
              </svg>
              <span className="text-sm font-semibold text-slate-700">Browse Files</span>
              <span className="text-xs text-slate-400">Drag and drop files here</span>
            </div>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                handlePhotoChange(e.target.files);
                e.target.value = "";
              }}
            />
            {photoDrafts.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photoDrafts.map((photo, i) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.previewUrl}
                      alt={`Preview ${i + 1}`}
                      className="h-24 w-full rounded-lg border border-slate-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhotoDraft(photo.id)}
                      className="absolute right-1 top-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Does your team have an instagram? Ours is rambots</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="@teamhandle"
            value={f.instagram}
            onChange={(e) => set("instagram", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What did you learn from this team that is applicable to you and our team?</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={6}
            placeholder="Share what you learned..."
            value={f.learned}
            onChange={(e) => set("learned", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Who filled this out? <span className="text-red-500">*</span></CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>First Name</Label>
              <Input
                type="text"
                placeholder="First"
                value={f.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Last Name</Label>
              <Input
                type="text"
                placeholder="Last"
                value={f.lastName}
                onChange={(e) => set("lastName", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" onClick={handleSubmit} disabled={saving} className="w-full rounded-xl shadow-md">
        {saving ? "Saving..." : "Submit Pit Entry"}
      </Button>

      <div className="pb-4" />
    </main>
  );
}
