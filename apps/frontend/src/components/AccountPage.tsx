import { useEffect, useState, type FormEvent } from "react";
import { WorkspaceApp } from "./WorkspaceApp";
import "./auth.css";

export function AccountPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { void fetch("/api/auth/me").then(async response => { if (!response.ok) { location.replace("/login"); return; } const account = await response.json(); setEmail(account.email); }).catch(() => location.replace("/login")); }, []);
  async function signOut() { setCode(""); await fetch("/api/auth/logout", { method: "POST" }); location.assign("/"); }
  function connect(event: FormEvent) {
    event.preventDefault(); setError("");
    const token = code.trim();
    if (!/^[a-f0-9]{64}$/.test(token)) { setError("Enter the 64 character pairing code from your companion terminal."); return; }
    setBusy(true);
    const socket = new WebSocket("ws://127.0.0.1:3001/ws", ["mux-v1", token]);
    const timeout = setTimeout(() => { socket.close(); setBusy(false); setError("Could not connect. Start the companion on this computer and check your pairing code."); }, 6000);
    socket.onopen = () => { clearTimeout(timeout); socket.close(); setBusy(false); setConnected(true); };
    socket.onerror = () => { clearTimeout(timeout); setBusy(false); setError("Could not connect. Start the companion on this computer and check your pairing code."); };
  }
  if (connected) return <><div className="companion-bar">Connected to your computer <button type="button" onClick={() => { setConnected(false); setCode(""); }}>Disconnect</button><button type="button" onClick={() => void signOut()}>Sign out</button></div><WorkspaceApp pairingToken={code.trim()} /></>;
  return <main className="auth-page"><a className="auth-brand" href="/">mux<span>.</span></a><section className="auth-panel companion-panel"><p className="auth-eyebrow">YOUR ACCOUNT</p><h1>Connect your computer</h1><p className="auth-intro">{email ? `Signed in as ${email}. ` : ""}The companion runs your agents and accesses files on this computer.</p><ol className="companion-steps"><li>Install <a href="https://bun.sh" target="_blank" rel="noreferrer">Bun</a>, <a href="https://www.mongodb.com/try/download/community" target="_blank" rel="noreferrer">MongoDB Community Server</a>, Git, and your chosen agent CLI.</li><li>In a terminal, run these commands:<pre>git clone https://github.com/Ravichandra531/Mux.git{"\n"}cd Mux{"\n"}bun install{"\n"}bash scripts/mux-companion.sh</pre></li><li>Keep the terminal open and paste its pairing code below. Share it only with someone you trust to access your local workspaces.</li></ol><form onSubmit={connect}><label>Pairing code<input type="password" autoComplete="off" required value={code} onChange={e => setCode(e.target.value)} /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button disabled={busy || !email}>{busy ? "Connecting…" : "Connect workspace"}</button></form><p className="auth-switch"><button type="button" onClick={() => void signOut()}>Sign out</button></p></section></main>;
}
