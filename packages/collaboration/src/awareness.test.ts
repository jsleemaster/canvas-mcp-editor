import { describe, expect, test } from "vitest";
import {
  createPresenceState,
  summarizeAwarenessStates
} from "./awareness";

describe("collaboration awareness", () => {
  test("creates local user presence defaults", () => {
    expect(
      createPresenceState({
        userId: "user-1",
        displayName: "Lee",
        color: "#2563eb"
      })
    ).toEqual({
      userId: "user-1",
      displayName: "Lee",
      color: "#2563eb",
      selectedNodeId: null,
      cursor: null,
      activeTool: null
    });
  });

  test("summarizes valid remote awareness states", () => {
    const states = summarizeAwarenessStates([
      {
        userId: "user-1",
        displayName: "Lee",
        color: "#2563eb",
        selectedNodeId: "text-1",
        cursor: { x: 12, y: 24 },
        activeTool: "select"
      },
      { userId: "", displayName: "Invalid" },
      null
    ]);

    expect(states).toEqual([
      {
        userId: "user-1",
        displayName: "Lee",
        color: "#2563eb",
        selectedNodeId: "text-1",
        cursor: { x: 12, y: 24 },
        activeTool: "select"
      }
    ]);
  });
});
