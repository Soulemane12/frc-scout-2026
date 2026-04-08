"use client";

import { useState, useRef, useEffect } from "react";
import type { ScoutingEntry, PitEntry } from "@/app/lib/types";

interface Message {
  role: "user" | "ai";
  content: string;
  matchProof?: ScoutingEntry[];
  pitProof?: PitEntry[];
}

const STARTERS = [
  "Who should we pick first overall?",
  "Which team climbs most reliably?",
  "Which teams score the most fuel on average?",
  "Who has the best autonomous performance?",
  "Which teams should we avoid picking?",
  "Compare the top 3 teams overall",
];

function climbLabel(c: string) {
  if (c === "l1") return "L1";
  if (c === "l2") return "L2";
  if (c === "l3") return "L3";
  return "None";
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      elements.push(
        <p key={i} className="font-bold text-blue-700 mt-3 mb-1 text-sm">
          {line.slice(4)}
        </p>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <p key={i} className="font-bold text-blue-800 mt-3 mb-1">
          {line.slice(3)}
        </p>
      );
    } else if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      elements.push(
        <p key={i} className="font-semibold mt-2">
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.match(/^[-*] /)) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-blue-400 mt-0.5 shrink-0">•</span>
          <span>{inlineMarkdown(line.slice(2))}</span>
        </div>
      );
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      elements.push(
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-blue-500 shrink-0 font-medium">{num}.</span>
          <span>{inlineMarkdown(line.replace(/^\d+\. /, ""))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i}>{inlineMarkdown(line)}</p>);
    }
    i++;
  }

  return elements;
}

function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function MatchProofTable({ entries }: { entries: ScoutingEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-blue-50 text-blue-800">
            <th className="px-2 py-1.5 text-left font-semibold border border-blue-100">Team</th>
            <th className="px-2 py-1.5 text-left font-semibold border border-blue-100">Match</th>
            <th className="px-2 py-1.5 text-left font-semibold border border-blue-100">Alliance</th>
            <th className="px-2 py-1.5 text-right font-semibold border border-blue-100">Auto Fuel</th>
            <th className="px-2 py-1.5 text-right font-semibold border border-blue-100">Cycles</th>
            <th className="px-2 py-1.5 text-right font-semibold border border-blue-100">Climb</th>
            <th className="px-2 py-1.5 text-left font-semibold border border-blue-100">Won</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const autoFuel = e.autoCycles * e.autoYellowPerCycle;
            const won = e.allianceWinner === e.allianceColor;
            return (
              <tr key={e.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-2 py-1.5 border border-slate-100 font-semibold">{e.teamNumber}</td>
                <td className="px-2 py-1.5 border border-slate-100">{e.matchNumber}</td>
                <td className="px-2 py-1.5 border border-slate-100">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${e.allianceColor === "blue" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                    {e.allianceColor}
                  </span>
                </td>
                <td className="px-2 py-1.5 border border-slate-100 text-right">{autoFuel}</td>
                <td className="px-2 py-1.5 border border-slate-100 text-right">{e.cycles}</td>
                <td className="px-2 py-1.5 border border-slate-100 text-right font-medium">{climbLabel(e.teleopClimb)}</td>
                <td className="px-2 py-1.5 border border-slate-100">
                  <span className={`text-xs font-semibold ${won ? "text-green-600" : "text-red-500"}`}>
                    {won ? "W" : "L"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PitProofTable({ entries }: { entries: PitEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-violet-50 text-violet-800">
            <th className="px-2 py-1.5 text-left font-semibold border border-violet-100">Team</th>
            <th className="px-2 py-1.5 text-left font-semibold border border-violet-100">Drivetrain</th>
            <th className="px-2 py-1.5 text-left font-semibold border border-violet-100">Max Climb</th>
            <th className="px-2 py-1.5 text-left font-semibold border border-violet-100">Climb Consist.</th>
            <th className="px-2 py-1.5 text-left font-semibold border border-violet-100">Auto Consist.</th>
            <th className="px-2 py-1.5 text-right font-semibold border border-violet-100">Est. Points</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              <td className="px-2 py-1.5 border border-slate-100 font-semibold">{e.teamNumber}</td>
              <td className="px-2 py-1.5 border border-slate-100 capitalize">{e.drivetrainType}</td>
              <td className="px-2 py-1.5 border border-slate-100 uppercase font-medium">{e.maxClimb === "none" ? "None" : e.maxClimb.toUpperCase()}</td>
              <td className="px-2 py-1.5 border border-slate-100 capitalize">{e.climbConsistency}</td>
              <td className="px-2 py-1.5 border border-slate-100 capitalize">{e.autoConsistency}</td>
              <td className="px-2 py-1.5 border border-slate-100 text-right font-medium">{e.estimatedPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProofSection({ matchProof, pitProof }: { matchProof?: ScoutingEntry[]; pitProof?: PitEntry[] }) {
  const [open, setOpen] = useState(false);
  const hasMatch = matchProof && matchProof.length > 0;
  const hasPit = pitProof && pitProof.length > 0;
  if (!hasMatch && !hasPit) return null;

  const total = (matchProof?.length ?? 0) + (pitProof?.length ?? 0);

  return (
    <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          Proof — {total} record{total !== 1 ? "s" : ""} referenced
        </span>
        <span className="text-slate-400 text-xs">{open ? "▲ hide" : "▼ show"}</span>
      </button>
      {open && (
        <div className="p-3 space-y-3 bg-white">
          {hasMatch && (
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-1.5">
                Match Scouting Data ({matchProof.length} {matchProof.length === 1 ? "entry" : "entries"})
              </p>
              <MatchProofTable entries={matchProof} />
            </div>
          )}
          {hasPit && (
            <div>
              <p className="text-xs font-semibold text-violet-700 mb-1.5">
                Pit Scouting Data ({pitProof.length} {pitProof.length === 1 ? "entry" : "entries"})
              </p>
              <PitProofTable entries={pitProof} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const history = messages.map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMessages(prev => [...prev, {
          role: "ai",
          content: data.error ?? "Something went wrong. Please try again.",
        }]);
        return;
      }

      setMessages(prev => [...prev, {
        role: "ai",
        content: data.answer,
        matchProof: data.matchProof,
        pitProof: data.pitProof,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "ai",
        content: "Network error — make sure you are connected and try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] bg-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l.8 3M5 14.5l-.8 3M3 3l18 18" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-sm leading-tight">Scout AI</h1>
          <p className="text-xs text-slate-500">Powered by Groq · llama-3.3-70b</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l.8 3M5 14.5l-.8 3M3 3l18 18" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-800 text-lg">Scout AI</h2>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                Ask me anything about the scouted teams. I&apos;ll search through all match and pit data and show you the exact records I used.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {STARTERS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-slate-700 font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${msg.role === "user" ? "max-w-[75%]" : "w-full max-w-[90%]"}`}>
              {msg.role === "user" ? (
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                  {msg.content}
                </div>
              ) : (
                <div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-800 shadow-sm border border-slate-100 space-y-1 leading-relaxed">
                    {renderMarkdown(msg.content)}
                  </div>
                  <ProofSection matchProof={msg.matchProof} pitProof={msg.pitProof} />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 shrink-0">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the scouted teams..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 leading-relaxed overflow-hidden"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-1.5">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}
