import "fake-indexeddb/auto";
import { beforeEach, describe, expect, test } from "vitest";
import { createIndexedDbProjectStore } from "./project-store";

describe("indexeddb project store", () => {
  beforeEach(() => {
    indexedDB.deleteDatabase("canvas-mcp-editor-projects-test");
  });

  test("stores and loads the current project id", async () => {
    const store = createIndexedDbProjectStore({
      databaseName: "canvas-mcp-editor-projects-test",
      indexedDB
    });

    await store.setCurrentProjectId("project-web");

    await expect(store.getCurrentProjectId()).resolves.toBe("project-web");
  });
});
