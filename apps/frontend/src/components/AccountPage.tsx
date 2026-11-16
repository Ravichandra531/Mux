import { useEffect, useState } from "react";
import "./auth.css";
export function AccountPage() {
  const [email, setEmail] = useState("");
  useEffect(() => { void fetch("/api/auth/me").then(async response => { if (!response.ok) { location.replace("/login"); return; } const account = await response.json(); setEmail(account.email); }).catch(() => location.replace("/login")); }, []);
  async function signOut() { await fetch("/api/auth/logout", { method: "POST" }); location.assign("/"); }
  return <main className="auth-page"><a className="auth-brand" href="/">mux<span>.</span></a><section className="auth-panel"><p className="auth-eyebrow">YOUR ACCOUNT</p><h1>Welcome to Mux</h1><p className="auth-intro">{email ? `Signed in as ${email}` : "Loading your account…"}</p><p className="auth-intro">The agent workspace is being prepared for multiple users and is not available yet.</p><form onSubmit={event => { event.preventDefault(); void signOut(); }}><button>Sign out</button></form></section></main>;
}
