import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";

const STORAGE_KEY = "bbr.completions.v1";

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveLocal(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export default function useCompletions() {
  const { token } = useAuth();
  const [completions, setCompletions] = useState(() => loadLocal());

  // Hydrate from server when signed in.
  useEffect(() => {
    if (!token) {
      setCompletions(loadLocal());
      return;
    }
    let cancelled = false;
    fetch("/api/completions-me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (cancelled) return;
        const next = {};
        for (const c of data.completions) next[`${c.dateKey}|${c.section}`] = 1;
        setCompletions(next);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  // Persist to localStorage when not signed in.
  useEffect(() => {
    if (!token) saveLocal(completions);
  }, [completions, token]);

  const isComplete = useCallback(
    (dateKey, section) => Boolean(completions[`${dateKey}|${section}`]),
    [completions]
  );

  const toggle = useCallback(async (dateKey, section) => {
    const k = `${dateKey}|${section}`;
    setCompletions((prev) => {
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = 1;
      return next;
    });

    if (token) {
      try {
        await fetch("/api/completions-toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ dateKey, section }),
        });
      } catch {}
    }
  }, [token]);

  // Per-day section count (0-4)
  const sectionsByDate = useMemo(() => {
    const byDate = {};
    for (const k of Object.keys(completions)) {
      const [date] = k.split("|");
      byDate[date] = (byDate[date] || 0) + 1;
    }
    return byDate;
  }, [completions]);

  const daysComplete = useMemo(
    () => Object.values(sectionsByDate).filter((n) => n >= 4).length,
    [sectionsByDate]
  );

  const getDayStatus = useCallback(
    (dateKey) => sectionsByDate[dateKey] || 0,
    [sectionsByDate]
  );

  return { isComplete, toggle, daysComplete, getDayStatus };
}
