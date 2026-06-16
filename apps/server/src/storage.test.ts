import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { FileStorage } from "./storage";

let tempRoot: string | undefined;

afterEach(async () => {
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
    tempRoot = undefined;
  }
});

describe("FileStorage", () => {
  test("seeds and lists the sample document", async () => {
    tempRoot = await mkdtemp(path.join(tmpdir(), "canvas-mcp-editor-"));
    const storage = new FileStorage(tempRoot);

    const files = await storage.listFiles();

    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      id: "sample-file",
      name: "Sample File"
    });
  });

  test("reads a stored document by file id", async () => {
    tempRoot = await mkdtemp(path.join(tmpdir(), "canvas-mcp-editor-"));
    const storage = new FileStorage(tempRoot);

    const document = await storage.readFile("sample-file");

    expect(document).toMatchObject({
      id: "sample-file",
      name: "Sample File"
    });
  });
});
