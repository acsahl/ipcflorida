import { useEffect } from "react";
import "./ChapterEditModal.css";

function fmtDate(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Edit the readings that cover one chapter.
 *
 * Completions are keyed by (dateKey, section), and a single reading can span
 * several chapters — so toggling here marks the whole passage for that day,
 * not just this chapter. The passage text is shown so that's obvious.
 */
export default function ChapterEditModal({
  book,
  chapter,
  slots,
  plan,
  isComplete,
  onToggle,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!book) return null;

  const labels = plan?._meta?.sectionLabels || {};
  const doneCount = slots.filter((s) => isComplete(s.dateKey, s.section)).length;
  const allDone = slots.length > 0 && doneCount === slots.length;

  const setAll = (target) => {
    for (const s of slots) {
      if (isComplete(s.dateKey, s.section) !== target) onToggle(s.dateKey, s.section);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal chapter-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <p className="chapter-eyebrow">Edit reading</p>
        <h2 className="modal-title">
          {book} <span className="chapter-num">{chapter}</span>
        </h2>

        {slots.length === 0 ? (
          <p className="chapter-none">
            This chapter isn't scheduled anywhere in the 2026 plan, so there's
            nothing to check off.
          </p>
        ) : (
          <>
            <p className="modal-subtitle">
              {slots.length === 1
                ? "One day covers this chapter."
                : `${slots.length} days cover this chapter.`}{" "}
              Checking a day marks its whole passage complete.
            </p>

            <ul className="chapter-slots">
              {slots.map((s) => {
                const done = isComplete(s.dateKey, s.section);
                const passage = plan?.readings?.[s.dateKey]?.[s.section];
                return (
                  <li key={`${s.dateKey}|${s.section}`}>
                    <button
                      className={`slot ${done ? "is-done" : ""}`}
                      onClick={() => onToggle(s.dateKey, s.section)}
                      aria-pressed={done}
                    >
                      <span className={`slot-check ${done ? "is-on" : ""}`} aria-hidden="true">
                        {done ? "✓" : ""}
                      </span>
                      <span className="slot-body">
                        <span className="slot-passage">{passage}</span>
                        <span className="slot-meta">
                          {fmtDate(s.dateKey)} · {labels[s.section] || s.section}
                        </span>
                      </span>
                      <span className="slot-state">{done ? "Complete" : "Mark"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {slots.length > 1 && (
              <div className="chapter-bulk">
                <button className="btn-link" onClick={() => setAll(!allDone)}>
                  {allDone ? "Clear all days" : "Mark all days complete"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
