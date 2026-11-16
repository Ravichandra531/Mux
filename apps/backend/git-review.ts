import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const limit = 200_000;

/** Review the current checkout, including pre-existing changes. Never mutates Git. */
export async function reviewChanges(cwd: string) {
  const git = async (args: string[]) => (await run("git", ["-C", cwd, ...args], {
    maxBuffer: 4_000_000,
    timeout: 15_000,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", GIT_PAGER: "cat" },
  })).stdout;
  await git(["rev-parse", "--show-toplevel"]);
  const [status, staged, unstaged] = await Promise.all([
    git(["status", "--short", "--untracked-files=normal"]),
    git(["--no-pager", "diff", "--no-ext-diff", "--cached", "--"]),
    git(["--no-pager", "diff", "--no-ext-diff", "--"]),
  ]);
  const full = [staged && `Staged changes\n${staged}`, unstaged && `Unstaged changes\n${unstaged}`].filter(Boolean).join("\n\n");
  return { status, diff: full.slice(0, limit), truncated: full.length > limit };
}
