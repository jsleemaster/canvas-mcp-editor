import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createHttpServer } from "./http";
import { FileStorage } from "./storage";

let tempRoot: string | undefined;

afterEach(async () => {
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
    tempRoot = undefined;
  }
});

describe("HTTP server", () => {
  test("serves health, file list, and sample file", async () => {
    tempRoot = await mkdtemp(path.join(tmpdir(), "canvas-mcp-editor-"));
    const server = createHttpServer(new FileStorage(tempRoot));

    const health = await server.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ ok: true });

    const files = await server.inject({ method: "GET", url: "/files" });
    expect(files.statusCode).toBe(200);
    expect(files.json().files[0].id).toBe("sample-file");

    const file = await server.inject({ method: "GET", url: "/files/sample-file" });
    expect(file.statusCode).toBe(200);
    expect(file.json().file.name).toBe("Sample File");
  });
});
