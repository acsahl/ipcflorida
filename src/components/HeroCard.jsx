import "./HeroCard.css";

function fmtDate(d) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function HeroCard({ date, onPrev, onNext, showCta = false, onGetStarted }) {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return (
    <section className="hero">
      <div className="hero-gradient" aria-hidden="true">
        <svg viewBox="0 0 800 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a2c33" />
              <stop offset="55%" stopColor="#1a1c21" />
              <stop offset="100%" stopColor="#3a3226" />
            </linearGradient>
          </defs>
          <rect width="800" height="400" fill="#101114" />
          <path d="M0,200 Q200,50 400,200 T800,200 L800,400 L0,400 Z" fill="url(#g1)" opacity="0.9" />
          <path d="M0,250 Q200,150 400,260 T800,240 L800,400 L0,400 Z" fill="url(#g1)" opacity="0.6" />
        </svg>
      </div>

      <div className="hero-content">
        <div className="hero-pill">
          <button className="day-nav" onClick={onPrev} aria-label="Previous day">‹</button>
          <div className="hero-text">
            <span className="hero-eyebrow">{isToday ? "Today" : "Reading for"}</span>
            <h1 className="hero-date">{fmtDate(date)}</h1>
          </div>
          <button className="day-nav" onClick={onNext} aria-label="Next day">›</button>
        </div>

        {showCta && (
          <div className="hero-cta">
            <span>Stay in the Word, daily</span>
            <button className="cta-button" onClick={onGetStarted}>
              Get started <span className="cta-arrow">↗</span>
            </button>
          </div>
        )}
      </div>

      <div className="hero-badge">
        <span className="badge-star">★</span>
        <div>
          <div className="badge-line-1">IPC Florida</div>
          <div className="badge-line-2">Reading Plan 2026</div>
        </div>
      </div>
    </section>
  );
}
