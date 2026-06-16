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

  test("redacts runtime relay credentials from exported manifests", () => {
    const team = createTeamManifest({
      name: "Secret Team",
      currentUser: {
        userId: "user-1",
        displayName: "Lee",
        color: "#2563eb"
      },
      sync: {
        mode: "websocket",
        relayUrl: "ws://127.0.0.1:4327",
        token: "plain-runtime-token",
        memberTokenHashes: [
          {
            userId: "user-1",
            tokenHash: "sha256-user-1",
            role: "owner"
          }
        ]
      }
    });

    const exported = exportTeamManifest(team);

    expect(exported).not.toContain("plain-runtime-token");
    expect(exported).toContain("sha256-user-1");
    expect(importTeamManifest(exported).sync).toEqual({
      mode: "websocket",
      roomPrefix: "canvas-mcp-editor",
      relayUrl: "ws://127.0.0.1:4327"
    });
  });
});
