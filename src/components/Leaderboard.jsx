import { useEffect, useState } from "react";
import UserInsightsModal from "./UserInsightsModal.jsx";
import "./Leaderboard.css";

function snippet(text, max = 90) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}

export default function Leaderboard({ refreshKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [openUserId, setOpenUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${day}`;
    fetch(`/api/leaderboard?dateKey=${dateKey}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (error) return <div className="lb-error">Couldn't load leaderboard.</div>;
  if (!data) return <div className="lb-loading">Loading leaderboard…</div>;

  const yearPct = Math.round(data.yearProgress * 100);
  const commPct = Math.round(data.communityProgress * 100);

  return (
    <>
      <section className="lb">
        <div className="lb-header">
          <h2>Community</h2>
          <span className="lb-meta">{data.totalUsers} reader{data.totalUsers === 1 ? "" : "s"}</span>
        </div>

        <div className="lb-bars">
          <ProgressBar
            label="Year progress"
            sub={`Day ${data.todayDOY} of ${data.totalDaysInYear}`}
            pct={yearPct}
            color="var(--ink)"
          />
          <ProgressBar
            label="Caught up to today"
            sub={`${data.usersCaughtUp} of ${data.totalUsers} readers completed today's reading`}
            pct={commPct}
            color="var(--accent)"
          />
        </div>

        {data.leaderboard.length > 0 && (
          <div className="lb-list">
            <h3>Top readers</h3>
            <ol>
              {(() => {
                // Standard "1224" competition ranking — tied users share a rank.
                const ranked = [];
                let lastDays = null;
                let lastRank = 0;
                data.leaderboard.forEach((u, i) => {
                  const rank = u.daysComplete === lastDays ? lastRank : i + 1;
                  ranked.push({ ...u, rank, tied: u.daysComplete === lastDays });
                  lastDays = u.daysComplete;
                  lastRank = rank;
                });
                // Mark the first member of a tie group as tied too
                for (let i = 0; i < ranked.length - 1; i++) {
                  if (ranked[i + 1].tied) ranked[i].tied = true;
                }
                return ranked;
              })().map((u) => {
                return (
                  <li
                    key={u.userId}
                    className="lb-row is-clickable"
                    onClick={() => setOpenUserId(u.userId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenUserId(u.userId);
                      }
                    }}
                  >
                    <span className="lb-rank">
                      {u.tied ? `T${u.rank}` : u.rank}
                    </span>
                    <div className="lb-name-wrap">
                      {u.latestInsight && (
                        <span className="lb-bubble" title="Latest insight — click to read">
                          {snippet(u.latestInsight.content)}
                        </span>
                      )}
                      <span className="lb-name">{u.displayName}</span>
                    </div>
                    <span className="lb-days">{u.daysComplete} days ›</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>

      <UserInsightsModal userId={openUserId} onClose={() => setOpenUserId(null)} />
    </>
  );
}

function ProgressBar({ label, sub, pct, color }) {
  return (
    <div className="bar">
      <div className="bar-top">
        <span className="bar-label">{label}</span>
        <span className="bar-pct">{pct}%</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bar-sub">{sub}</div>
    </div>
  );
}
