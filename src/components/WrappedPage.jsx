import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import "./WrappedPage.css";

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function WrappedPage({ onPromptSignup }) {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/wrapped-me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError("Couldn't load your Wrapped."); });
    return () => { cancelled = true; };
  }, [user, token]);

  if (!user) {
    return (
      <section className="wrapped">
        <div className="wrapped-locked">
          <p className="wrapped-eyebrow">2026 Wrapped</p>
          <h2>Sign in to see your Wrapped</h2>
          <p>Your personal reading stats, streaks, and rank — built from your year so far.</p>
          <button className="btn-primary" onClick={onPromptSignup}>Sign up</button>
        </div>
      </section>
    );
  }

  if (error) return <div className="wrapped-locked"><p>{error}</p></div>;
  if (!data) return <div className="wrapped-locked"><p>Loading your Wrapped…</p></div>;

  const pct = Math.round((data.todayDOY / data.totalDaysInYear) * 100);

  return (
    <section className="wrapped">
      <div className="wrapped-hero">
        <p className="wrapped-eyebrow">2026 Wrapped</p>
        <h1>{data.displayName}'s year in the Word</h1>
        <p className="wrapped-sub">
          Day {data.todayDOY} of {data.totalDaysInYear} · {pct}% of the year gone
        </p>
      </div>

      <div className="wrapped-grid">
        <div className="wcard wcard-big">
          <span className="wcard-label">Days fully complete</span>
          <span className="wcard-number">{data.daysComplete}</span>
          <span className="wcard-note">out of {data.todayDOY} days so far this year</span>
        </div>

        <div className="wcard">
          <span className="wcard-label">Current streak</span>
          <span className="wcard-number">{data.currentStreak}</span>
          <span className="wcard-note">day{data.currentStreak === 1 ? "" : "s"} in a row</span>
        </div>

        <div className="wcard">
          <span className="wcard-label">Longest streak</span>
          <span className="wcard-number">{data.longestStreak}</span>
          <span className="wcard-note">your personal best</span>
        </div>

        <div className="wcard">
          <span className="wcard-label">Pace</span>
          <span className="wcard-number">{data.paceVsElapsed}%</span>
          <span className="wcard-note">of elapsed days completed in full</span>
        </div>

        <div className="wcard">
          <span className="wcard-label">Insights shared</span>
          <span className="wcard-number">{data.insightsCount}</span>
          <span className="wcard-note">reflections posted</span>
        </div>

        <div className="wcard">
          <span className="wcard-label">Community rank</span>
          <span className="wcard-number">{ordinal(data.rank)}</span>
          <span className="wcard-note">of {data.totalUsers} readers · top {100 - data.percentile + 1}%</span>
        </div>

        {data.favoriteSection && (
          <div className="wcard wcard-wide">
            <span className="wcard-label">Most-read section</span>
            <span className="wcard-number wcard-number-sm">
              {data.sectionLabels[data.favoriteSection]}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
