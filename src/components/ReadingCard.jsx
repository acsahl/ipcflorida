import "./ReadingCard.css";

export default function ReadingCard({ section, label, passage, accent, complete, onToggle }) {
  return (
    <article
      className={`reading-card ${complete ? "is-complete" : ""}`}
      style={{ background: accent.bg, color: accent.fg }}
      data-section={section}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-pressed={complete}
    >
      <div className="reading-icon" aria-hidden="true">
        {complete ? "✓" : accent.icon}
      </div>
      <div className="reading-body">
        <h3 className="reading-label">{label}</h3>
        <p className="reading-passage">{passage}</p>
      </div>
      <div className="reading-foot">
        <span className="reading-status">
          {complete ? "Completed · tap to undo" : "Tap to mark complete"}
        </span>
      </div>
    </article>
  );
}
