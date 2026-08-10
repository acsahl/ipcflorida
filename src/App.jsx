import { useEffect, useState } from "react";
import HeroCard from "./components/HeroCard.jsx";
import ReadingsGrid from "./components/ReadingsGrid.jsx";
import AuthModal from "./components/AuthModal.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import InsightPanel from "./components/InsightPanel.jsx";
import Calendar from "./components/Calendar.jsx";
import WrappedPage from "./components/WrappedPage.jsx";
import useCompletions from "./hooks/useCompletions.js";
import { useAuth } from "./contexts/AuthContext.jsx";
import "./styles/app.css";

export default function App() {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState("today"); // "today" | "leaderboard"

  const { isComplete, toggle, daysComplete, getDayStatus } = useCompletions();
  const { user, logout, loading: authLoading } = useAuth();

  useEffect(() => {
    fetch("/data/reading-plan-2026.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setPlan)
      .catch((e) => setError(e.message));
  }, []);

  const shiftDay = (delta) => {
    setCurrentDate((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() + delta);
      return next;
    });
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <span className="brand-name">Daily Word</span>
          <span className="brand-sub">IPC Florida · Est. 2026</span>
        </div>
        <nav className="app-nav">
          <button
            className={`nav-link ${page === "today" ? "is-active" : ""}`}
            onClick={() => setPage("today")}
          >
            Today
          </button>
          <button
            className={`nav-link ${page === "calendar" ? "is-active" : ""}`}
            onClick={() => setPage("calendar")}
          >
            Calendar
          </button>
          <button
            className={`nav-link ${page === "leaderboard" ? "is-active" : ""}`}
            onClick={() => setPage("leaderboard")}
          >
            Leaderboard
          </button>
          <button
            className={`nav-link ${page === "wrapped" ? "is-active" : ""}`}
            onClick={() => setPage("wrapped")}
          >
            Wrapped
          </button>
          {authLoading ? (
            <span className="nav-link" style={{ opacity: 0.5 }}>…</span>
          ) : user ? (
            <>
              <span className="nav-link" style={{ fontWeight: 600 }}>
                {user.displayName || user.email}
              </span>
              <button className="btn-primary" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <button className="nav-link" onClick={() => openAuth("login")}>
                Sign in
              </button>
              <button className="btn-primary" onClick={() => openAuth("signup")}>
                Sign up
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="app-main">
        {page === "today" && (
          <>
            <HeroCard
              date={currentDate}
              onPrev={() => shiftDay(-1)}
              onNext={() => shiftDay(1)}
              showCta={!user}
              onGetStarted={() => openAuth("signup")}
            />

            {error && <p className="error">Failed to load: {error}</p>}
            {plan && (
              <ReadingsGrid
                plan={plan}
                date={currentDate}
                isComplete={isComplete}
                onToggle={toggle}
              />
            )}

            {plan && (
              <div className="summary-strip">
                <div className="summary-stat">
                  <span className="summary-num">{daysComplete}</span>
                  <span className="summary-key">
                    day{daysComplete === 1 ? "" : "s"} complete
                  </span>
                </div>
                <span className="summary-rule" aria-hidden="true" />
                <button className="wrapped-cta" onClick={() => setPage("wrapped")}>
                  View your 2026 Wrapped <span className="cta-arrow">↗</span>
                </button>
              </div>
            )}

            <InsightPanel
              date={currentDate}
              onPromptSignup={() => openAuth("signup")}
            />
          </>
        )}

        {page === "calendar" && (
          <Calendar
            currentDate={currentDate}
            getDayStatus={getDayStatus}
            onSelectDate={(d) => {
              setCurrentDate(d);
              setPage("today");
            }}
          />
        )}

        {page === "leaderboard" && (
          <Leaderboard refreshKey={daysComplete} />
        )}

        {page === "wrapped" && (
          <WrappedPage onPromptSignup={() => openAuth("signup")} />
        )}
      </main>

      <footer className="app-footer">
        <p>"This Book of the Law shall not depart from your mouth…" — Joshua 1:8</p>
      </footer>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
