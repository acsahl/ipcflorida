import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import "./AuthModal.css";

export default function AuthModal({ open, onClose, initialMode = "login" }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [caughtUpTo, setCaughtUpTo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const isSignup = mode === "signup";

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isSignup) {
        await signup({
          email,
          password,
          displayName,
          caughtUpTo: caughtUpTo || null,
        });
      } else {
        await login({ email, password });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2 className="modal-title">{isSignup ? "Create your account" : "Welcome back"}</h2>
        <p className="modal-subtitle">
          {isSignup
            ? "Track your reading and join the community."
            : "Sign in to continue your reading."}
        </p>

        <form onSubmit={submit} className="modal-form" noValidate>
          {isSignup && (
            <label className="field">
              <span>Display name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others see you"
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              minLength={isSignup ? 8 : 1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "8+ characters" : ""}
            />
          </label>

          {isSignup && (
            <label className="field">
              <span>Caught up to (optional)</span>
              <input
                type="date"
                value={caughtUpTo}
                onChange={(e) => setCaughtUpTo(e.target.value)}
              />
              <small className="field-hint">
                Pick the last date you've read through. We'll mark everything before it as complete.
              </small>
            </label>
          )}

          {error && <div className="form-error">{error}</div>}

          <button className="form-submit" type="submit" disabled={busy}>
            {busy ? "Working…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="mode-switch">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("login")}>Sign in</button>
            </>
          ) : (
            <>
              New here?{" "}
              <button onClick={() => setMode("signup")}>Create an account</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
