import { timingSafeEqual } from "node:crypto";

/** Only the hosted Mux origin may connect, and only with the device's current pairing secret. */
export function authorizeCompanion(origin: string | null, protocols: string | null, secret: string): boolean {
  if (origin !== "https://mux-ysrx.onrender.com" || !/^[a-f0-9]{64}$/.test(secret)) return false;
  const values = (protocols || "").split(",").map(value => value.trim());
  if (values.length !== 2 || values[0] !== "mux-v1" || !/^[a-f0-9]{64}$/.test(values[1] || "")) return false;
  return timingSafeEqual(Buffer.from(values[1]!), Buffer.from(secret));
}
