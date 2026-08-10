import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import useCountUp from "../hooks/useCountUp.js";
import "./WrappedPage.css";

const SLIDE_MS = 5500;

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** One big animated number plus supporting copy. */
function StatSlide({ value, suffix = "", runKey, kicker, headline, sub }) {
  const shown = useCountUp(value, runKey);
  return (
    <>
      <p className="w-kicker r-1">{kicker}</p>
      <p className="w-number r-2">
        {shown}
        {suffix}
      </p>
      <h2 className="w-headline r-3">{headline}</h2>
      {sub && <p className="w-sub r-4">{sub}</p>}
    </>
  );
}

export default function WrappedPage({ onPromptSignup }) {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/wrapped-me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError("Couldn't load your Wrapped."); });
    return () => { cancelled = true; };
  }, [user, token]);

  const slides = useMemo(() => {
    if (!data) return [];
    const pctYear = Math.round((data.todayDOY / data.totalDaysInYear) * 100);
    const list = [
      {
        key: "intro",
        tone: "ink",
        render: () => (
          <>
            <p className="w-kicker r-1">IPC Florida · 2026</p>
            <h2 className="w-title r-2">
              {data.displayName}'s<br />
              <em>year in the Word</em>
            </h2>
            <p className="w-sub r-3">
              {pctYear}% of the year is behind you. Here's how it went.
            </p>
          </>
        ),
      },
      {
        key: "days",
        tone: "rust",
        render: (k) => (
          <StatSlide
            runKey={k}
            value={data.daysComplete}
            kicker="Days fully complete"
            headline="You finished all four passages"
            sub={`out of ${data.todayDOY} days so far this year`}
          />
        ),
      },
      {
        key: "streak",
        tone: "harvest",
        render: (k) => (
          <StatSlide
            runKey={k}
            value={data.longestStreak}
            kicker="Longest streak"
            headline={
              data.longestStreak >= 7
                ? "Days in a row without missing"
                : "Your best run so far"
            }
            sub={
              data.currentStreak > 0
                ? `You're on ${data.currentStreak} right now — keep it going.`
                : "Today's a good day to start a new one."
            }
          />
        ),
      },
      {
        key: "pace",
        tone: "olive",
        render: (k) => (
          <StatSlide
            runKey={k}
            value={data.paceVsElapsed}
            suffix="%"
            kicker="Your pace"
            headline="Of the year's days, completed in full"
            sub={
              data.paceVsElapsed >= 80
                ? "Well ahead of most readers."
                : "Every day counts — there's plenty of year left."
            }
          />
        ),
      },
    ];

    if (data.insightsCount > 0) {
      list.push({
        key: "insights",
        tone: "ink",
        render: (k) => (
          <StatSlide
            runKey={k}
            value={data.insightsCount}
            kicker="Insights shared"
            headline="Reflections you wrote down"
            sub="Others in the community read these."
          />
        ),
      });
    }

    list.push({
      key: "rank",
      tone: "rust",
      render: (k) => (
        <>
          <p className="w-kicker r-1">Community rank</p>
          <p className="w-number r-2">{ordinal(data.rank)}</p>
          <h2 className="w-headline r-3">
            of {data.totalUsers} reader{data.totalUsers === 1 ? "" : "s"}
          </h2>
          <p className="w-sub r-4">
            Top {Math.max(100 - data.percentile + 1, 1)}% of the church this year.
          </p>
          <span className="w-hidden">{k}</span>
        </>
      ),
    });

    if (data.favoriteSection) {
      list.push({
        key: "section",
        tone: "harvest",
        render: () => (
          <>
            <p className="w-kicker r-1">Most-read section</p>
            <h2 className="w-title w-title-sm r-2">
              <em>{data.sectionLabels[data.favoriteSection]}</em>
            </h2>
            <p className="w-sub r-3">You returned here more than anywhere else.</p>
          </>
        ),
      });
    }

    list.push({
      key: "outro",
      tone: "ink",
      render: () => (
        <>
          <p className="w-kicker r-1">That's your 2026 — so far</p>
          <h2 className="w-title r-2">
            <em>Keep going.</em>
          </h2>
          <div className="w-recap r-3">
            <div><span>{data.daysComplete}</span><small>days complete</small></div>
            <div><span>{data.longestStreak}</span><small>longest streak</small></div>
            <div><span>{ordinal(data.rank)}</span><small>of {data.totalUsers}</small></div>
          </div>
          <p className="w-sub r-4">"This Book of the Law shall not depart from your mouth…"</p>
        </>
      ),
    });

    return list;
  }, [data]);

  const count = slides.length;

  const go = useCallback((next) => {
    if (!count) return;
    setIndex((i) => Math.min(Math.max(next, 0), count - 1));
  }, [count]);

  // Auto-advance, unless paused or on the final slide.
  useEffect(() => {
    if (!count || paused) return;
    if (index >= count - 1) return;
    timer.current = setTimeout(() => setIndex((i) => i + 1), SLIDE_MS);
    return () => clearTimeout(timer.current);
  }, [index, count, paused]);

  // Keyboard: arrows to move, space to pause.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  if (!user) {
    return (
      <section className="wrapped-locked">
        <p className="wrapped-eyebrow">2026 Wrapped</p>
        <h2>Sign in to see your Wrapped</h2>
        <p>Your reading stats, streaks, and rank — built from your year so far.</p>
        <button className="btn-primary" onClick={onPromptSignup}>Sign up</button>
      </section>
    );
  }
  if (error) return <div className="wrapped-locked"><p>{error}</p></div>;
  if (!data) return <div className="wrapped-locked"><p>Loading your Wrapped…</p></div>;

  const slide = slides[index];
  const isLast = index === count - 1;

  return (
    <section className={`wrapped-story tone-${slide.tone}`} aria-roledescription="carousel">
      {/* segmented story progress */}
      <div className="w-bars">
        {slides.map((s, i) => (
          <button
            key={s.key}
            className="w-bar"
            onClick={() => go(i)}
            aria-label={`Slide ${i + 1} of ${count}`}
          >
            <span
              className={`w-bar-fill ${i < index ? "is-done" : ""} ${i === index ? "is-active" : ""}`}
              style={i === index ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
            />
          </button>
        ))}
      </div>

      {/* tap zones, like a story */}
      <button className="w-tap w-tap-prev" onClick={() => go(index - 1)} aria-label="Previous" />
      <button className="w-tap w-tap-next" onClick={() => go(index + 1)} aria-label="Next" />

      <div className="w-stage" key={slide.key}>
        {slide.render(index)}
      </div>

      <div className="w-controls">
        <button className="w-ctl" onClick={() => setPaused((p) => !p)}>
          {paused ? "▶ Play" : "❚❚ Pause"}
        </button>
        {isLast && (
          <button className="w-ctl w-ctl-primary" onClick={() => { setIndex(0); setPaused(false); }}>
            ↻ Replay
          </button>
        )}
      </div>
    </section>
  );
}
