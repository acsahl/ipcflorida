import ReadingCard from "./ReadingCard.jsx";
import "./ReadingsGrid.css";

const SECTION_ORDER = ["psalms", "pentateuch", "chronicles", "gospels"];

const ACCENTS = {
  psalms: { bg: "#2b3350", fg: "#f3f1ea", icon: "♪" },
  pentateuch: { bg: "#0a0a0c", fg: "#f3f1ea", icon: "✦" },
  chronicles: { bg: "#332e26", fg: "#f3f1ea", icon: "◆" },
  gospels: { bg: "#f3ede0", fg: "#14120f", icon: "✝" },
};

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

  return (
    <div className="readings-grid">
      {SECTION_ORDER.map((sec) => (
        <ReadingCard
          key={sec}
          section={sec}
          label={labels[sec]}
          passage={day[sec]}
          accent={ACCENTS[sec]}
          complete={isComplete(key, sec)}
          onToggle={() => onToggle(key, sec)}
        />
      ))}
    </div>
  );
}
