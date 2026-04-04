"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui";

export default function PitPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <div className="pb-1">
        <h1 className="text-2xl font-bold text-slate-900">Pit Scouting</h1>
        <p className="text-sm text-slate-500">NYC Regional · REBUILT 2026</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Pit scouting questions will be added here.</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
