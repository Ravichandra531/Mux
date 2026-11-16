import { test, expect } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { reviewChanges } from "./git-review";

test("reviews staged, unstaged, and untracked changes without modifying the checkout", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mux-review-"));
  const git = (...args: string[]) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  try {
    git("init");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "Mux test");
    await writeFile(join(dir, "file.txt"), "original\n");
    git("add", "file.txt");
    git("commit", "-m", "initial");
    await writeFile(join(dir, "file.txt"), "staged\n");
    git("add", "file.txt");
    await writeFile(join(dir, "file.txt"), "unstaged\n");
    await writeFile(join(dir, "new.txt"), "new\n");
    const before = git("status", "--porcelain");
    const review = await reviewChanges(dir);
    expect(review.diff).toContain("+staged");
    expect(review.diff).toContain("+unstaged");
    expect(review.status).toContain("new.txt");
    expect(git("status", "--porcelain")).toBe(before);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
