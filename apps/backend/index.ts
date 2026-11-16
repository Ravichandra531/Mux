import { mongoose } from "db/client";
import { UserManager } from "./UserManager";
import { handleAuth } from "./auth";

const uri = process.env.DB_URL || process.env.db_url;
if (!uri) {
  throw new Error("Set DB_URL to a MongoDB connection string.");
}
await mongoose.connect(uri);
const manager = new UserManager();
const port = Number(process.env.PORT || 3001);
Bun.serve<{ id: string }>({
  port,
  hostname: process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
  async fetch(request, server) {
    const authResponse = await handleAuth(request);
    if (authResponse) return authResponse;
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (
      process.env.NODE_ENV !== "production" && url.pathname === "/ws" &&
      (!origin ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) &&
      server.upgrade(request, { data: { id: crypto.randomUUID() } })
    ) {
      return;
    }
    if (process.env.NODE_ENV === "production" && url.pathname !== "/ws") {
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
