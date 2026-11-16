import { test, expect } from "bun:test";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readContextFiles } from "./context-files";

test("reads selected text and rejects paths escaping the checkout", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mux-context-"));
  try {
    await writeFile(join(dir, "source.txt"), "project context");
    await symlink(tmpdir(), join(dir, "outside"));
    expect(await readContextFiles(dir, ["source.txt"])).toMatchObject([{ path: "source.txt", content: "project context", bytes: 15, sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }]);
    await expect(readContextFiles(dir, ["../outside.txt"])).rejects.toThrow();
    await expect(readContextFiles(dir, ["/etc/hosts"])).rejects.toThrow();
    await expect(readContextFiles(dir, ["outside"])).rejects.toThrow();
    await writeFile(join(dir, "binary"), Buffer.from([0, 1]));
    await expect(readContextFiles(dir, ["binary"])).rejects.toThrow();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
