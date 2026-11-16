import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { realpath } from "node:fs/promises";

const exec = promisify(execFile);

/** Remove only a registered, completely clean worktree; keep its branch. */
export async function removeCleanWorktree(project: string, worktree: string) {
  const projectRoot = await realpath(project);
  const target = await realpath(worktree);
  if (target === projectRoot) throw new Error("The project directory cannot be removed as a worktree.");
  const git = async (cwd: string, args: string[]) => (await exec("git", ["-C", cwd, ...args], { timeout: 15000, maxBuffer: 4_000_000, env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } })).stdout;
  const listing = await git(projectRoot, ["worktree", "list", "--porcelain", "-z"]);
  const paths = await Promise.all(listing.split("\0").filter((part) => part.startsWith("worktree ")).map(async (part) => realpath(part.slice(9)).catch(() => "")));
  if (!paths.includes(target)) throw new Error("This worktree is not registered with the project.");
  const status = await git(target, ["status", "--porcelain", "--untracked-files=all", "--ignored=matching"]);
  if (status.trim()) throw new Error("Worktree has modified, untracked or ignored files. Remove them manually before cleanup.");
  await git(projectRoot, ["worktree", "remove", "--", target]);
}
