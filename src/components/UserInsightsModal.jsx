import { useEffect, useState } from "react";
import "./UserInsightsModal.css";

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function UserInsightsModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`/api/insights-list?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal user-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {error && <p className="form-error">{error}</p>}
        {!data && !error && <p className="insights-status">Loading…</p>}
        {data && (
          <>
            <h2 className="modal-title">{data.user?.displayName || "Reader"}</h2>
            <p className="modal-subtitle">
              {data.insights.length} insight{data.insights.length === 1 ? "" : "s"} shared
            </p>

            {data.insights.length === 0 ? (
              <p className="insights-status">This reader hasn't shared any insights yet.</p>
            ) : (
              <ul className="insights-list user-insights-list">
                {data.insights.map((i) => (
                  <li key={i._id} className="insight-item">
                    <div className="insight-content">{i.content}</div>
                    <div className="insight-meta">
                      {i.dateKey && <span>Reading: {i.dateKey}</span>}
                      <span>{fmtTime(i.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
