import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Day = { date: Date; inMonth: boolean; isToday: boolean; iso: string };

type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

const WEEKDAYS: Array<{ key: WeekdayKey; label: string }> = [
  { key: "sun", label: "일" },
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildMonthMatrix(view: Date, weekStartsOn: 0 | 1 = 0): Day[] {
  const first = startOfMonth(view);
  const last = endOfMonth(view);
  const today = new Date();
  const startOffset = (first.getDay() - weekStartsOn + 7) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const days: Day[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push({
      date: d,
      inMonth: d >= first && d <= last,
      isToday: isSameDay(d, today),
      iso: toISO(d),
    });
  }
  return days;
}

export type CalendarProps = {
  value?: Date | null;
  onChange?: (date: Date) => void;
  weekStartsOn?: 0 | 1;
  className?: string;
};

export default function Calendar({
  value = null,
  onChange,
  weekStartsOn = 0,
  className = "",
}: CalendarProps) {
  const [view, setView] = useState<Date>(value ?? new Date());
  const days = useMemo(
    () => buildMonthMatrix(view, weekStartsOn),
    [view, weekStartsOn]
  );
  const weekdayLabels = useMemo(() => {
    return WEEKDAYS.slice(weekStartsOn).concat(WEEKDAYS.slice(0, weekStartsOn));
  }, [weekStartsOn]);

  const year = view.getFullYear();
  const month = view.getMonth() + 1;

  const prevMonth = () =>
    setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  const nextMonth = () =>
    setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));
  const goToday = () => setView(new Date());

  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white/95 shadow-[0_24px_60px_-32px_rgba(16,185,129,0.6)] backdrop-blur ${className}`}
    >
      <div className="flex items-start justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 px-6 py-5 text-white">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-100/70">
            Monthly Overview
          </span>
          <p className="mt-1 text-[28px] font-bold leading-tight">
            {year}년 {month}월
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-full border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-white/25"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-full border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 px-6 pt-6 pb-3 text-center text-[11px] font-semibold uppercase tracking-[0.08em]">
        {weekdayLabels.map(({ key, label }) => (
          <div
            key={key}
            className={[
              "rounded-md py-2 text-2xl",
              key === "sun"
                ? "text-rose-500"
                : key === "sat"
                ? "text-sky-500"
                : "text-emerald-600",
            ].join(" ")}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 gap-3 px-4 pb-6 text-sm text-emerald-900 sm:px-6">
        {days.map((d) => {
          const selected = value && isSameDay(d.date, value);
          const dayOfWeek = d.date.getDay();
          const baseClasses = [
            "relative flex h-16 w-full flex-col justify-between rounded-2xl border-1 bg-white/75 px-3 pb-3 pt-2 text-right text-sm font-semibold transition-all duration-200",
            d.inMonth ? "text-emerald-900" : "text-emerald-200 opacity-50",
            d.inMonth && dayOfWeek === 0 && !selected ? "text-rose-500" : "",
            d.inMonth && dayOfWeek === 6 && !selected ? "text-sky-500" : "",
            selected
              ? "bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-xl ring-2 ring-emerald-300"
              : d.isToday
              ? "border-emerald-200 bg-white shadow-inner ring-1 ring-emerald-200/80"
              : "shadow-sm hover:-translate-y-0.5 hover:shadow-md",
          ];

          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => onChange?.(d.date)}
              className={baseClasses.join(" ")}
              aria-pressed={!!selected}
            >
              <span className="text-lg leading-none">{d.date.getDate()}</span>
              {selected ? (
                <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-emerald-50/90">
                  
                </span>
              ) : d.isToday ? (
                <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-emerald-500/80">
                  오늘
                </span>
              ) : (
                <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-transparent">
                  space
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
