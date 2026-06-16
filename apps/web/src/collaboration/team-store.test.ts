import "fake-indexeddb/auto";
import { beforeEach, describe, expect, test } from "vitest";
import { createTeamManifest } from "@canvas-mcp-editor/collaboration";
import {
  createIndexedDbTeamStore,
  exportTeamManifest,
  importTeamManifest
} from "./team-store";

describe("indexeddb team store", () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase("canvas-mcp-editor-collaboration-test");
  });

  test("saves, lists, and loads the current team", async () => {
    const store = createIndexedDbTeamStore({
      databaseName: "canvas-mcp-editor-collaboration-test",
      indexedDB
    });
    const team = createTeamManifest({
      name: "Design Team",
      currentUser: {
        userId: "user-1",
        displayName: "Lee",
        color: "#2563eb"
      }
    });

    await store.saveTeam(team);
    await store.setCurrentTeam(team.teamId);

    expect(await store.listTeams()).toEqual([team]);
    expect(await store.getTeam(team.teamId)).toEqual(team);
    expect(await store.getCurrentTeam()).toEqual(team);
  });

  test("imports and exports a manifest as JSON", () => {
    const team = createTeamManifest({
      name: "Export Team",
      currentUser: {
        userId: "user-1",
        displayName: "Lee",
        color: "#2563eb"
      }
    });

    expect(importTeamManifest(exportTeamManifest(team))).toEqual(team);
  });
});
