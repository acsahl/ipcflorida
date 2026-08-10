import "./HeroCard.css";

const YEAR_START = new Date(2026, 0, 1);

function dayOfYear(d) {
  return Math.floor((d - YEAR_START) / 86400000) + 1;
}

export default function HeroCard({ date, onPrev, onNext, showCta = false, onGetStarted }) {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const doy = Math.min(Math.max(dayOfYear(date), 1), 365);
  const pct = (doy / 365) * 100;

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();

  return (
    <section className="hero">
      {/* Left rail — vertical year progress */}
      <aside className="hero-rail" aria-hidden="true">
        <span className="rail-num">{String(doy).padStart(3, "0")}</span>
        <div className="rail-track">
          <div className="rail-fill" style={{ height: `${pct}%` }} />
        </div>
        <span className="rail-num rail-num-end">365</span>
      </aside>

      <div className="hero-body">
        <div className="hero-top">
          <span className="hero-eyebrow">
            {isToday ? "Today's reading" : "Reading for"}
          </span>
          <div className="hero-stepper">
            <button className="step" onClick={onPrev} aria-label="Previous day">‹</button>
            <button className="step" onClick={onNext} aria-label="Next day">›</button>
          </div>
        </div>

        <h1 className="hero-display">
          <span className="line-weekday">{weekday},</span>
          <span className="line-month">{month}</span>
          <span className="line-day">
            {day}
            <span className="line-year">{year}</span>
          </span>
        </h1>

        <div className="hero-foot">
          <div className="hero-meta">
            <span className="meta-key">Plan</span>
            <span className="meta-val">IPC Florida · 2026</span>
          </div>
          <div className="hero-meta">
            <span className="meta-key">Day</span>
            <span className="meta-val">{doy} of 365</span>
          </div>
          {showCta && (
            <button className="hero-cta-btn" onClick={onGetStarted}>
              Start tracking <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
