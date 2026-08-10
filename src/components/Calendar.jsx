import { useMemo, useState } from "react";
import "./Calendar.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(year, month) {
  // month is 0-indexed; build everything in local time
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  return cells;
}

export default function Calendar({ currentDate, onSelectDate, getDayStatus }) {
  const today = new Date();
  const todayKey = fmtKey(today);

  const [view, setView] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
  });

  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view]);

  const canGoPrev = !(view.year === 2026 && view.month === 0);
  const canGoNext = !(view.year === 2026 && view.month === 11);

  const goPrev = () => {
    if (!canGoPrev) return;
    setView((v) => ({
      year: v.month === 0 ? v.year - 1 : v.year,
      month: v.month === 0 ? 11 : v.month - 1,
    }));
  };
  const goNext = () => {
    if (!canGoNext) return;
    setView((v) => ({
      year: v.month === 11 ? v.year + 1 : v.year,
      month: v.month === 11 ? 0 : v.month + 1,
    }));
  };

  const selectedKey = fmtKey(currentDate);

  return (
    <section className="cal">
      <div className="cal-header">
        <button
          className="cal-nav"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2 className="cal-title">
          {MONTH_NAMES[view.month]} <span className="cal-year">{view.year}</span>
        </h2>
        <button
          className="cal-nav"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-cell is-empty" />;
          const key = fmtKey(d);
          const status = getDayStatus(key); // 0..4
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const stateClass =
            status >= 4 ? "is-full" : status > 0 ? "is-partial" : "";
          return (
            <button
              key={i}
              className={`cal-cell ${stateClass} ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`}
              onClick={() => onSelectDate(d)}
            >
              <span className="cal-day-num">{d.getDate()}</span>
              {status > 0 && (
                <span className="cal-day-dots" aria-hidden="true">
                  {Array.from({ length: status }).map((_, j) => (
                    <span key={j} className="cal-dot" />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        <span><span className="legend-swatch is-full" /> All 4 readings</span>
        <span><span className="legend-swatch is-partial" /> Some readings</span>
        <span><span className="legend-swatch is-today" /> Today</span>
      </div>
    </section>
  );
}
