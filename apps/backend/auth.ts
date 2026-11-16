import { mongoose } from "db/client";
import { createHash, randomBytes } from "node:crypto";

const accountSchema = new mongoose.Schema({ email: { type: String, required: true, unique: true }, passwordHash: { type: String, required: true } }, { timestamps: true });
const loginSchema = new mongoose.Schema({ tokenHash: { type: String, required: true, unique: true }, account: { type: mongoose.Schema.Types.ObjectId, required: true }, expiresAt: { type: Date, required: true, index: { expires: 0 } } });
const Account = mongoose.model("MuxAccount", accountSchema);
const Login = mongoose.model("MuxLogin", loginSchema);
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const cookieName = "mux_session";
const attempts: number[] = [];
const cookieToken = (req: Request) => req.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
const json = (data: unknown, status = 200, headers?: Record<string, string>) => Response.json(data, { status, headers });

export async function handleAuth(req: Request): Promise<Response | null> {
  const path = new URL(req.url).pathname;
  if (!path.startsWith("/api/auth/")) return null;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = (value: string, maxAge: number) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
  if (req.method === "GET" && path === "/api/auth/me") {
    const token = cookieToken(req);
    const session = token && await Login.findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } }).lean();
    const account = session && await Account.findById(session.account).lean();
    return account ? json({ email: account.email }) : json({ error: "Not signed in" }, 401);
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const origin = req.headers.get("origin");
  const requestUrl = new URL(req.url);
  let validOrigin = false;
  try { const parsed = new URL(origin || ""); validOrigin = process.env.NODE_ENV === "production" ? parsed.protocol === "https:" && parsed.host === requestUrl.host : parsed.origin === requestUrl.origin || /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(parsed.origin); } catch { /* invalid origin */ }
  if (!validOrigin) return json({ error: "Invalid origin" }, 403);
  if (path === "/api/auth/logout") {
    const token = cookieToken(req);
    if (token) await Login.deleteOne({ tokenHash: digest(token) });
    return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
  }
  if (path !== "/api/auth/login" && path !== "/api/auth/signup") return json({ error: "Not found" }, 404);
  const now = Date.now();
  while (attempts.length && attempts[0]! < now - 60_000) attempts.shift();
  if (attempts.length >= 30) return json({ error: "Too many attempts. Please try again shortly." }, 429);
  attempts.push(now);
  let input: { email?: unknown; password?: unknown };
  try { const text = await req.text(); if (text.length > 4096) return json({ error: "Invalid request" }, 400); input = JSON.parse(text) as typeof input; } catch { return json({ error: "Invalid request" }, 400); }
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128) return json({ error: "Enter a valid email and a password of 12 to 128 characters." }, 400);
  let account;
  if (path.endsWith("signup")) {
    const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });
    try { account = await Account.create({ email, passwordHash }); } catch (error) {
      if ((error as { code?: number }).code === 11000) return json({ error: "Unable to create account. Try signing in instead." }, 409);
      throw error;
    }
  } else {
    account = await Account.findOne({ email });
    if (!account || !(await Bun.password.verify(password, account.passwordHash))) return json({ error: "Email or password is incorrect." }, 401);
  }
  const token = randomBytes(32).toString("base64url");
  const lifetime = 60 * 60 * 24 * 7;
  await Login.create({ tokenHash: digest(token), account: account._id, expiresAt: new Date(Date.now() + lifetime * 1000) });
  return json({ email: account.email }, 200, { "Set-Cookie": cookie(token, lifetime) });
}
