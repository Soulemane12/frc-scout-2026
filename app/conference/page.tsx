"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Textarea, Label,
} from "../components/ui";
import { loadConferenceEntries, saveConferenceEntries } from "../lib/storage";

const BLANK = {
  firstName: "",
  lastName: "",
  conferenceName: "",
  learned: "",
};

export default function ConferencePage() {
  const [f, setF] = useState(BLANK);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof typeof BLANK>(key: K, val: string) {
    setF((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit() {
    if (!f.firstName.trim() || !f.lastName.trim()) {
      alert("Please fill in your first and last name before submitting.");
      return;
    }
    const entry = {
      ...f,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    saveConferenceEntries([entry, ...loadConferenceEntries()]);
    setF(BLANK);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">

      {submitted && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-medium text-green-800">
          <span className="text-base">✓</span> Response saved!
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-base font-semibold text-slate-800 leading-snug">
          What did you learn? Think about off season projects. Think about goals. I will show all your submissions to Nicotri when we come back.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Conference Name</CardTitle></CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="e.g. NE District Championship"
            value={f.conferenceName}
            onChange={(e) => set("conferenceName", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What did you learn at this conference that is applicable to you and our team?</CardTitle>
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

      <Button size="lg" onClick={handleSubmit} className="w-full rounded-xl shadow-md">
        Submit
      </Button>

      <div className="pb-4" />
    </main>
  );
}
