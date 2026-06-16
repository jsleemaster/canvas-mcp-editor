import { describe, expect, test } from "vitest";
import {
  createTeamManifest,
  parseTeamManifest,
  type TeamManifest
} from "./team-manifest";

describe("team manifests", () => {
  test("creates a valid local team manifest", () => {
    const team = createTeamManifest({
      name: "Design Team",
      currentUser: {
        userId: "user-1",
        displayName: "Lee",
        color: "#2563eb"
      }
    });

    expect(team).toMatchObject({
      schemaVersion: 1,
      name: "Design Team",
      currentUserId: "user-1",
      sync: {
        mode: "local",
        roomPrefix: "canvas-mcp-editor"
      },
      permissions: {
        canEdit: true,
        canInvite: true
      }
    });
    expect(team.teamId).toMatch(/^team-/);
    expect(team.members).toHaveLength(1);
    expect(team.documents).toEqual([]);
  });

  test("rejects empty team names", () => {
    expect(() =>
      createTeamManifest({
        name: " ",
        currentUser: {
          userId: "user-1",
          displayName: "Lee",
          color: "#2563eb"
        }
      })
    ).toThrow(/team name/i);
  });

  test("rejects websocket sync config without relayUrl", () => {
    expect(() =>
      createTeamManifest({
        name: "Design Team",
        currentUser: {
          userId: "user-1",
          displayName: "Lee",
          color: "#2563eb"
        },
        sync: {
          mode: "websocket",
          roomPrefix: "canvas-mcp-editor"
        }
      })
    ).toThrow(/relayUrl/i);
  });

  test("preserves imported manifest fields after validation", () => {
    const imported: TeamManifest = {
      schemaVersion: 1,
      teamId: "team-imported",
      name: "Imported Team",
      createdAt: "2026-06-16T00:00:00.000Z",
      currentUserId: "user-2",
      members: [
        {
          userId: "user-2",
          displayName: "Kim",
          color: "#16a34a"
        }
      ],
      documents: [
        {
          documentId: "sample-file",
          name: "Sample File",
          updatedAt: "2026-06-16T00:00:00.000Z"
        }
      ],
      sync: {
        mode: "websocket",
        roomPrefix: "canvas-mcp-editor",
        relayUrl: "ws://127.0.0.1:4327",
        token: "secret"
      },
      permissions: {
        canEdit: true,
        canInvite: false
      }
    };

    expect(parseTeamManifest(imported)).toEqual(imported);
  });
});
