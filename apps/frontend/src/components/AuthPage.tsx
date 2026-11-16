import { useState, type FormEvent } from "react";
import "./auth.css";

export function AuthPage() {
  const [signup, setSignup] = useState(location.pathname === "/signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${signup ? "signup" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in. Please try again.");
      location.assign("/app");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><a className="auth-brand" href="/">mux<span>.</span></a><section className="auth-panel"><p className="auth-eyebrow">YOUR WORKSPACE FOR AGENTS</p><h1>{signup ? "Create your account" : "Welcome back"}</h1><p className="auth-intro">{signup ? "Get started with a workspace for your coding agents." : "Sign in to continue to your workspace."}</p><form onSubmit={submit}><label>Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></label>{signup && <p className="auth-hint">Use at least 12 characters.</p>}{error && <p className="auth-error" role="alert">{error}</p>}<button disabled={busy} type="submit">{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button></form><p className="auth-switch">{signup ? "Already have an account?" : "New to Mux?"} <button type="button" onClick={() => { setSignup(!signup); setError(""); history.replaceState(null, "", signup ? "/login" : "/signup"); }}>{signup ? "Sign in" : "Create an account"}</button></p></section></main>;
}
