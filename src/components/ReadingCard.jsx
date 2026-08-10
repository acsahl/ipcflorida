import "./ReadingCard.css";

export default function ReadingCard({ section, index, label, passage, complete, onToggle }) {
  return (
    <article
      className={`reading-card ${index === 0 ? "is-feature" : ""} ${complete ? "is-complete" : ""}`}
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
      <div className="reading-head">
        <span className="reading-index">{String(index + 1).padStart(2, "0")}</span>
        <span className={`reading-check ${complete ? "is-on" : ""}`} aria-hidden="true">
          {complete ? "✓" : ""}
        </span>
      </div>

      <div className="reading-body">
        <h3 className="reading-label">{label}</h3>
        <p className="reading-passage">{passage}</p>
      </div>

      <div className="reading-foot">
        <span className="reading-status">
          {complete ? "Complete" : "Mark complete"}
        </span>
        <span className="reading-rule" aria-hidden="true" />
      </div>
    </article>
  );
}
