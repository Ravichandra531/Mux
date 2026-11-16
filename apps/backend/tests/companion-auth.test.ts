import { describe, expect, test } from "bun:test";
import { authorizeCompanion } from "../companion-auth";
const code = "a".repeat(64);
describe("local companion pairing", () => {
  test("accepts only the hosted origin with the correct token", () => {
    expect(authorizeCompanion("https://mux-ysrx.onrender.com", `mux-v1, ${code}`, code)).toBe(true);
    expect(authorizeCompanion("https://evil.example", `mux-v1, ${code}`, code)).toBe(false);
    expect(authorizeCompanion(null, `mux-v1, ${code}`, code)).toBe(false);
    expect(authorizeCompanion("https://mux-ysrx.onrender.com", `mux-v1, ${"b".repeat(64)}`, code)).toBe(false);
    expect(authorizeCompanion("https://mux-ysrx.onrender.com", "mux-v1", code)).toBe(false);
    expect(authorizeCompanion("https://mux-ysrx.onrender.com", `mux-v1, ${code}`, "")).toBe(false);
  });
});
