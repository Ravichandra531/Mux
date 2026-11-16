import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { removeCleanWorktree } from "./worktree-cleanup";

test("rejects a dirty worktree and removes a clean registered worktree", async () => {
  const parent = await mkdtemp(join(tmpdir(), "mux-worktree-"));
  const repo = join(parent, "repo");
  const target = join(parent, "worktree");
  const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" });
  try {
    git("init", repo);
    git("-C", repo, "config", "user.email", "test@example.com");
    git("-C", repo, "config", "user.name", "Mux test");
    await writeFile(join(repo, "file.txt"), "initial\n");
    await writeFile(join(repo, ".gitignore"), "ignored.txt\n");
    git("-C", repo, "add", "file.txt", ".gitignore");
    git("-C", repo, "commit", "-m", "initial");
    git("-C", repo, "worktree", "add", "-b", "mux-test", target);
    await writeFile(join(target, "untracked.txt"), "keep");
    await expect(removeCleanWorktree(repo, target)).rejects.toThrow("untracked");
    await rm(join(target, "untracked.txt"));
    await writeFile(join(target, "ignored.txt"), "keep");
    await expect(removeCleanWorktree(repo, target)).rejects.toThrow("ignored");
    await rm(join(target, "ignored.txt"));
    await removeCleanWorktree(repo, target);
    expect(git("-C", repo, "worktree", "list")).not.toContain(target);
    expect(git("-C", repo, "branch", "--list", "mux-test")).toContain("mux-test");
  } finally { await rm(parent, { recursive: true, force: true }); }
});
