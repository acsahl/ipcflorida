import ReadingCard from "./ReadingCard.jsx";
import "./ReadingsGrid.css";

const SECTION_ORDER = ["psalms", "pentateuch", "chronicles", "gospels"];

function fmtKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReadingsGrid({ plan, date, isComplete, onToggle }) {
  const key = fmtKey(date);
  const day = plan?.readings?.[key];
  const labels = plan?._meta?.sectionLabels || {};

  if (!day) {
    return (
      <div className="grid-empty">
        <p>No readings for {key}. The plan covers 2026.</p>
      </div>
    );
  }

  const doneCount = SECTION_ORDER.filter((s) => isComplete(key, s)).length;

  return (
    <section className="readings">
      <header className="readings-header">
        <h2 className="readings-title">
          Four <em>passages</em>
        </h2>
        <span className="readings-count">
          {doneCount} <span className="count-sep">/</span> 4 complete
        </span>
      </header>

      <div className="readings-grid">
        {SECTION_ORDER.map((sec, i) => (
          <ReadingCard
            key={sec}
            section={sec}
            index={i}
            label={labels[sec]}
            passage={day[sec]}
            complete={isComplete(key, sec)}
            onToggle={() => onToggle(key, sec)}
          />
        ))}
      </div>
    </section>
  );
}
