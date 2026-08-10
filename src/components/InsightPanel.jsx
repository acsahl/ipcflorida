import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import "./InsightPanel.css";

function fmtKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function InsightPanel({ date, onPromptSignup }) {
  const { user, token } = useAuth();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    if (!user) {
      setInsights([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/insights-list?userId=${user._id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => { if (!cancelled) setInsights(d.insights); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  async function submit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/insights-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim(), dateKey: fmtKey(date) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");
      setInsights((prev) => [data.insight, ...prev]);
      setContent("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(insight) {
    setEditingId(insight._id);
    setEditingContent(insight.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingContent("");
  }

  async function saveEdit(id) {
    if (!editingContent.trim()) return;
    try {
      const res = await fetch("/api/insights-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, content: editingContent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setInsights((prev) =>
        prev.map((i) => (i._id === id ? { ...i, content: data.content } : i))
      );
      cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteInsight(id) {
    if (!confirm("Delete this insight? This can't be undone.")) return;
    try {
      const res = await fetch("/api/insights-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setInsights((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return (
      <section className="insights">
        <div className="insights-header">
          <h2>Your insights</h2>
        </div>
        <div className="insights-empty">
          <p>Sign in to share what God is teaching you.</p>
          <button className="btn-primary" onClick={onPromptSignup}>Sign up</button>
        </div>
      </section>
    );
  }

  return (
    <section className="insights">
      <div className="insights-header">
        <h2>Your insights</h2>
        <span className="insights-meta">{insights.length} posted</span>
      </div>

      <form onSubmit={submit} className="insights-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What stood out to you in today's reading?"
          rows={3}
          maxLength={2000}
        />
        {error && <div className="form-error">{error}</div>}
        <div className="insights-actions">
          <span className="insights-hint">{content.length}/2000</span>
          <button className="btn-primary" type="submit" disabled={busy || !content.trim()}>
            {busy ? "Posting…" : "Post insight"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="insights-status">Loading…</p>
      ) : insights.length === 0 ? (
        <p className="insights-status">No insights yet — share your first one above.</p>
      ) : (
        <ul className="insights-list">
          {insights.slice(0, 5).map((i) => (
            <li key={i._id} className="insight-item">
              {editingId === i._id ? (
                <>
                  <textarea
                    className="insight-edit"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    maxLength={2000}
                  />
                  <div className="insight-actions">
                    <button className="btn-link" onClick={cancelEdit}>Cancel</button>
                    <button className="btn-small" onClick={() => saveEdit(i._id)}>
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="insight-content">{i.content}</div>
                  <div className="insight-meta">
                    {i.dateKey && <span>{i.dateKey}</span>}
                    <span>{fmtTime(i.createdAt)}</span>
                    <span className="insight-spacer" />
                    <button className="btn-link" onClick={() => startEdit(i)}>Edit</button>
                    <button className="btn-link danger" onClick={() => deleteInsight(i._id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
