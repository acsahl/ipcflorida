import { useMemo, useState } from "react";
import { BOOKS, OT_COUNT, buildBookIndex } from "../lib/passages.js";
import "./BooksPage.css";

const TESTAMENTS = [
  { key: "ot", label: "Old Testament", books: BOOKS.slice(0, OT_COUNT) },
  { key: "nt", label: "New Testament", books: BOOKS.slice(OT_COUNT) },
];

export default function BooksPage({ plan, isComplete }) {
  const [filter, setFilter] = useState("all"); // all | started | done
  const index = useMemo(() => (plan ? buildBookIndex(plan) : {}), [plan]);

  // Per book: each chapter -> "read" | "partial" | "unread"
  const stats = useMemo(() => {
    const out = {};
    for (const [name, total] of BOOKS) {
      const entry = index[name];
      const chapters = [];
      let read = 0;

      for (let ch = 1; ch <= total; ch++) {
        const slots = entry?.chapters.get(ch);
        if (!slots || slots.length === 0) {
          chapters.push({ ch, state: "unscheduled", slots: [] });
          continue;
        }
        // Several books are scheduled twice in the year (Psalms and Isaiah
        // both appear in two blocks), so a chapter can have more than one
        // slot. Reading it once counts — that's the question being asked.
        const done = slots.filter((s) => isComplete(s.dateKey, s.section)).length;
        const state = done > 0 ? "read" : "unread";
        if (done > 0) read += 1;
        chapters.push({ ch, state, slots, done, times: slots.length });
      }

      out[name] = {
        name,
        total,
        read,
        pct: total ? Math.round((read / total) * 100) : 0,
        chapters,
      };
    }
    return out;
  }, [index, isComplete]);

  const totals = useMemo(() => {
    const all = Object.values(stats);
    return {
      chaptersRead: all.reduce((s, b) => s + b.read, 0),
      chaptersTotal: all.reduce((s, b) => s + b.total, 0),
      booksDone: all.filter((b) => b.read === b.total).length,
      booksStarted: all.filter((b) => b.read > 0 && b.read < b.total).length,
    };
  }, [stats]);

  const keep = (b) =>
    filter === "all" ||
    (filter === "started" && b.read > 0) ||
    (filter === "done" && b.read === b.total);

  if (!plan) return <div className="books-empty"><p>Loading the plan…</p></div>;

  const pctAll = totals.chaptersTotal
    ? Math.round((totals.chaptersRead / totals.chaptersTotal) * 100)
    : 0;

  return (
    <section className="books">
      <header className="books-header">
        <div>
          <h2 className="books-title">The whole <em>Bible</em></h2>
          <p className="books-sub">
            Every chapter the 2026 plan covers, and how much of it you've read.
          </p>
        </div>
        <div className="books-totals">
          <div className="bt">
            <span className="bt-num">{totals.chaptersRead}</span>
            <span className="bt-key">of {totals.chaptersTotal} chapters</span>
          </div>
          <div className="bt">
            <span className="bt-num">{totals.booksDone}</span>
            <span className="bt-key">books finished</span>
          </div>
          <div className="bt">
            <span className="bt-num">{pctAll}%</span>
            <span className="bt-key">of the Bible</span>
          </div>
        </div>
      </header>

      <div className="books-filters">
        {[
          ["all", "All 66"],
          ["started", `Started (${totals.booksStarted + totals.booksDone})`],
          ["done", `Finished (${totals.booksDone})`],
        ].map(([k, label]) => (
          <button
            key={k}
            className={`books-filter ${filter === k ? "is-active" : ""}`}
            onClick={() => setFilter(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {TESTAMENTS.map(({ key, label, books }) => {
        const shown = books.map(([n]) => stats[n]).filter(keep);
        if (!shown.length) return null;
        return (
          <div key={key} className="books-group">
            <h3 className="books-group-title">
              <span>{label}</span>
              <span className="books-rule" aria-hidden="true" />
              <span className="books-group-meta">{shown.length} books</span>
            </h3>
            <div className="books-grid">
              {shown.map((b) => (
                <article
                  key={b.name}
                  className={`book ${b.read === b.total ? "is-done" : ""} ${b.total > 40 ? "is-wide" : ""}`}
                >
                  <div className="book-head">
                    <h4 className="book-name">{b.name}</h4>
                    <span className="book-count">
                      {b.read}<span className="book-slash">/</span>{b.total}
                    </span>
                  </div>

                  <div
                    className="book-chapters"
                    role="img"
                    aria-label={`${b.name}: ${b.read} of ${b.total} chapters read`}
                  >
                    {b.chapters.map((c) => (
                      <span
                        key={c.ch}
                        className={`chip is-${c.state}`}
                        title={
                          c.slots.length
                            ? `${b.name} ${c.ch} — scheduled ${c.slots
                                .map((s) => s.dateKey)
                                .join(", ")}${c.done ? " (read)" : ""}`
                            : `${b.name} ${c.ch} — not in the plan`
                        }
                      />
                    ))}
                  </div>

                  <div className="book-bar" aria-hidden="true">
                    <span style={{ width: `${b.pct}%` }} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
