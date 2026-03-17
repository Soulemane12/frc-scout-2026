"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

// ── Button ───────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[0.98]",
        teal: "bg-teal-600 text-white shadow-sm hover:bg-teal-700 active:scale-[0.98]",
        outline: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        destructive: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-6 pt-5 pb-3", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-base font-semibold text-slate-900", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs text-slate-500 mt-0.5", className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-6 pb-5", className)}>{children}</div>;
}

// ── Input ────────────────────────────────────────────────────────────────────

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow",
        className
      )}
      {...props}
    />
  );
}

// ── Textarea ─────────────────────────────────────────────────────────────────

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none",
        className
      )}
      {...props}
    />
  );
}

// ── Label ────────────────────────────────────────────────────────────────────

export function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-sm font-medium text-slate-700", className)} {...props}>
      {children}
    </label>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      blue: "bg-blue-100 text-blue-700",
      red: "bg-red-100 text-red-700",
      green: "bg-green-100 text-green-700",
      yellow: "bg-yellow-100 text-yellow-800",
      slate: "bg-slate-100 text-slate-700",
      teal: "bg-teal-100 text-teal-700",
    },
  },
  defaultVariants: { variant: "slate" },
});

export function Badge({
  className,
  variant,
  children,
}: { className?: string; children: React.ReactNode } & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}

// ── Divider with label ───────────────────────────────────────────────────────

export function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

// ── FormField (label + hint + child) ────────────────────────────────────────

export function FormField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div>
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// ── ChoiceGroup (styled radio cards) ────────────────────────────────────────

export function ChoiceGroup({
  label,
  hint,
  options,
  value,
  onChange,
  cols = 2,
}: {
  label: string;
  hint?: string;
  options: { label: string; value: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
  cols?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        {hint && <CardDescription>{hint}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {options.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(selected ? "" : opt.value)}
                className={cn(
                  "flex flex-col items-start rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all",
                  selected
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border-2 flex-shrink-0",
                      selected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                    )}
                  />
                  {opt.label}
                </div>
                {opt.sub && <span className="mt-0.5 pl-5 text-xs text-slate-400">{opt.sub}</span>}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── MultiChoiceGroup (checkboxes, multiple selection) ────────────────────────

export function MultiChoiceGroup({
  label,
  hint,
  options,
  value,
  onChange,
  cols = 2,
}: {
  label: string;
  hint?: string;
  options: { label: string; value: string; sub?: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  cols?: number;
}) {
  function toggle(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        {hint && <CardDescription>{hint}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {options.map((opt) => {
            const selected = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={cn(
                  "flex flex-col items-start rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all",
                  selected
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-3.5 w-3.5 rounded border-2 flex-shrink-0 flex items-center justify-center",
                      selected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                    )}
                  >
                    {selected && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {opt.label}
                </div>
                {opt.sub && <span className="mt-0.5 pl-5 text-xs text-slate-400">{opt.sub}</span>}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Counter ──────────────────────────────────────────────────────────────────

export function Counter({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        {hint && <CardDescription>{hint}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange(Math.max(0, value - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm text-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-95"
          >
            −
          </button>
          <div className="flex h-10 min-w-[5rem] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-2xl font-bold text-slate-900">
            {value}
          </div>
          <button
            onClick={() => onChange(value + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 shadow-sm text-lg font-bold hover:bg-blue-100 transition-colors active:scale-95"
          >
            +
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── StarRating ───────────────────────────────────────────────────────────────

export function StarRating({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        {hint && <CardDescription>{hint}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onChange(star === value ? 0 : star)}
              className={cn(
                "text-3xl transition-transform hover:scale-110 active:scale-95",
                star <= value ? "text-yellow-400" : "text-slate-200"
              )}
            >
              ★
            </button>
          ))}
        </div>
        {value > 0 && (
          <p className="mt-1.5 text-xs text-slate-400">
            {["", "Poor", "Below average", "Average", "Good", "Excellent"][value]}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ pct, color = "bg-blue-500" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className={cn("h-2 rounded-full transition-all duration-300", color)}
        style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
      />
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-white px-4 py-3 shadow-sm", accent ? `border-l-4 ${accent} border-slate-200` : "border-slate-200")}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
