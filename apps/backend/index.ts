import { mongoose } from "db/client";
import { UserManager } from "./UserManager";
import { handleAuth } from "./auth";
import { authorizeCompanion } from "./companion-auth";

const uri = process.env.DB_URL || process.env.db_url;
if (!uri) {
  throw new Error("Set DB_URL to a MongoDB connection string.");
}
await mongoose.connect(uri);
const manager = new UserManager();
const port = Number(process.env.PORT || 3001);
const companion = process.env.MUX_COMPANION === "1";
const pairingSecret = process.env.MUX_PAIRING_TOKEN || "";
if (companion && !/^[a-f0-9]{64}$/.test(pairingSecret)) throw new Error("Companion mode requires a 64 character pairing token.");
Bun.serve<{ id: string }>({
  port,
  hostname: companion || process.env.NODE_ENV !== "production" ? "127.0.0.1" : "0.0.0.0",
  async fetch(request, server) {
    const authResponse = companion ? null : await handleAuth(request);
    if (authResponse) return authResponse;
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (companion && url.pathname === "/ws" && authorizeCompanion(origin, request.headers.get("sec-websocket-protocol"), pairingSecret) &&
        server.upgrade(request, { data: { id: crypto.randomUUID() }, headers: { "Sec-WebSocket-Protocol": "mux-v1" } })) return;
    if (
      !companion && process.env.NODE_ENV !== "production" && url.pathname === "/ws" &&
      (!origin ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) &&
      server.upgrade(request, { data: { id: crypto.randomUUID() } })
    ) {
      return;
    }
    if (!companion && process.env.NODE_ENV === "production" && url.pathname !== "/ws") {
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (relative.includes("..") || relative.includes("\\")) return new Response("Not found", { status: 404 });
      const file = Bun.file(`../frontend/dist/${relative || "index.html"}`);
      if (await file.exists() && relative !== "") return new Response(file);
      if (!relative || ["login", "signup", "app"].includes(relative)) return new Response(Bun.file("../frontend/dist/index.html"));
      return new Response("Not found", { status: 404 });
    }
    return new Response("Mux WebSocket server", { status: url.pathname === "/ws" ? 403 : 200 });
  },
  websocket: {
    open: (socket) => {
      void manager.open(socket);
    },
    message: (socket, message) => {
      void manager.message(socket, message.toString());
    },
    close: (socket) => manager.close(socket),
  },
});
console.log(`Mux backend listening on 127.0.0.1:${port}`);
