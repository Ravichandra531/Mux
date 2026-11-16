import { realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

const candidates = ["AGENTS.md", "CLAUDE.md", ".claude/CLAUDE.md", ".cursorrules", ".cursor/rules"];

/** Discover common root-level instruction locations without claiming a provider loaded them. */
export async function findInstructionFiles(cwd: string): Promise<string[]> {
  const root = await realpath(cwd);
  const found = await Promise.all(candidates.map(async (path) => {
    try {
      const target = await realpath(resolve(root, path));
      const rel = relative(root, target);
      if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return null;
      await stat(target);
      return path;
    } catch { return null; }
  }));
  return found.filter((path): path is string => path !== null);
}
