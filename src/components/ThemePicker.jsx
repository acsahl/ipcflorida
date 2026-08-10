import { useEffect, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import "./ThemePicker.css";

export default function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = themes.find((t) => t.id === theme) || themes[0];

  return (
    <div className="theme-picker" ref={wrap}>
      <button
        className="theme-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Colour theme: ${active.label}`}
        title="Colour theme"
      >
        <span className="theme-dot" aria-hidden="true">
          <span style={{ background: active.swatch[0] }} />
          <span style={{ background: active.swatch[1] }} />
        </span>
      </button>

      {open && (
        <ul className="theme-menu" role="listbox" aria-label="Colour theme">
          {themes.map((t) => (
            <li key={t.id}>
              <button
                role="option"
                aria-selected={t.id === theme}
                className={`theme-option ${t.id === theme ? "is-active" : ""}`}
                onClick={() => { setTheme(t.id); setOpen(false); }}
              >
                <span className="theme-dot" aria-hidden="true">
                  <span style={{ background: t.swatch[0] }} />
                  <span style={{ background: t.swatch[1] }} />
                </span>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
