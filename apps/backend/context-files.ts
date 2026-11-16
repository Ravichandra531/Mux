import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { createHash } from "node:crypto";

/** Resolve only explicitly selected, small text files inside the session checkout. */
export async function readContextFiles(cwd: string, paths: string[]) {
  const root = await realpath(cwd);
  return Promise.all(paths.map(async (path) => {
    if (isAbsolute(path)) throw new Error("Context paths must be relative to the project.");
    const file = await realpath(resolve(root, path));
    const rel = relative(root, file);
    if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("Context files must be inside the project.");
    const info = await stat(file);
    if (!info.isFile() || info.size > 50_000) throw new Error(`Context file ${path} must be a file under 50 KB.`);
    const bytes = await readFile(file);
    if (bytes.length > 50_000 || bytes.includes(0)) throw new Error(`Context file ${path} must be a text file under 50 KB.`);
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { path: rel, content, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
  }));
}
