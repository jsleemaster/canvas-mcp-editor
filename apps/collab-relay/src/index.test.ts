import { describe, expect, test } from "vitest";
import WebSocket from "ws";
import {
  createCollabRelayServer,
  validateRelayConnection
} from "./index";

describe("collaboration relay", () => {
  test("serves health and accepts allowed websocket rooms", async () => {
    const relay = createCollabRelayServer({
      host: "127.0.0.1",
      port: 0,
      allowedRoomPrefix: "canvas-mcp-editor:"
    });
    await relay.listen();

    const health = await fetch(`${relay.httpUrl}/health`);
    expect(await health.json()).toEqual({
      ok: true,
      rooms: 0
    });

    const socket = new WebSocket(`${relay.wsUrl}/canvas-mcp-editor:team-1:sample-file`);
    await new Promise<void>((resolve, reject) => {
      socket.once("open", resolve);
      socket.once("error", reject);
    });

    expect(relay.roomCount()).toBe(1);

    socket.close();
    await relay.close();
  });

  test("validates room prefix and token", () => {
    expect(
      validateRelayConnection({
        roomId: "canvas-mcp-editor:team-1:sample-file",
        allowedRoomPrefix: "canvas-mcp-editor:"
      })
    ).toEqual({ ok: true, canWriteDocument: true });

    expect(
      validateRelayConnection({
        roomId: "other:team-1:sample-file",
        allowedRoomPrefix: "canvas-mcp-editor:"
      })
    ).toEqual({ ok: false, reason: "room prefix is not allowed" });

    expect(
      validateRelayConnection({
        roomId: "canvas-mcp-editor:team-1:sample-file",
        allowedRoomPrefix: "canvas-mcp-editor:",
        expectedToken: "secret",
        token: "wrong"
      })
    ).toEqual({ ok: false, reason: "relay token is invalid" });
  });

  test("validates member identity and role-specific document permissions", () => {
    const memberTokens = [
      {
        userId: "owner-1",
        token: "owner-secret",
        role: "owner" as const
      },
      {
        userId: "viewer-1",
        token: "viewer-secret",
        role: "viewer" as const
      }
    ];

    expect(
      validateRelayConnection({
        roomId: "canvas-mcp-editor:team-1:sample-file",
        allowedRoomPrefix: "canvas-mcp-editor:",
        userId: "owner-1",
        memberToken: "owner-secret",
        requestedAccess: "sync",
        memberTokens
      })
    ).toEqual({ ok: true, role: "owner", canWriteDocument: true });

    expect(
      validateRelayConnection({
        roomId: "canvas-mcp-editor:team-1:sample-file",
        allowedRoomPrefix: "canvas-mcp-editor:",
        userId: "viewer-1",
        memberToken: "viewer-secret",
        requestedAccess: "sync",
        memberTokens
      })
    ).toEqual({
      ok: false,
      reason: "member is not allowed to edit document"
    });

    expect(
      validateRelayConnection({
        roomId: "canvas-mcp-editor:team-1:sample-file",
        allowedRoomPrefix: "canvas-mcp-editor:",
        userId: "viewer-1",
        memberToken: "viewer-secret",
        requestedAccess: "awareness",
        memberTokens
      })
    ).toEqual({ ok: true, role: "viewer", canWriteDocument: false });

    expect(
      validateRelayConnection({
        roomId: "canvas-mcp-editor:team-1:sample-file",
        allowedRoomPrefix: "canvas-mcp-editor:",
        userId: "unknown",
        memberToken: "viewer-secret",
        requestedAccess: "awareness",
        memberTokens
      })
    ).toEqual({ ok: false, reason: "member is not allowed" });
  });

  test("rejects invalid websocket members and accepts allowed websocket members", async () => {
    const relay = createCollabRelayServer({
      host: "127.0.0.1",
      port: 0,
      allowedRoomPrefix: "canvas-mcp-editor:",
      memberTokens: [
        {
          userId: "editor-1",
          token: "editor-secret",
          role: "editor"
        },
        {
          userId: "viewer-1",
          token: "viewer-secret",
          role: "viewer"
        }
      ]
    });
    await relay.listen();

    const editorSocket = new WebSocket(
      `${relay.wsUrl}/canvas-mcp-editor:team-1:sample-file?userId=editor-1&memberToken=editor-secret&access=sync`
    );
    await new Promise<void>((resolve, reject) => {
      editorSocket.once("open", resolve);
      editorSocket.once("error", reject);
    });
    expect(relay.roomCount()).toBe(1);

    const rejectedSocket = new WebSocket(
      `${relay.wsUrl}/canvas-mcp-editor:team-1:sample-file?userId=editor-1&memberToken=wrong&access=sync`
    );
    await new Promise<void>((resolve, reject) => {
      rejectedSocket.once("unexpected-response", (_request, response) => {
        expect(response.statusCode).toBe(401);
        resolve();
      });
      rejectedSocket.once("open", () => reject(new Error("invalid member connected")));
      rejectedSocket.once("error", reject);
    });

    const rejectedViewerSync = new WebSocket(
      `${relay.wsUrl}/canvas-mcp-editor:team-1:sample-file?userId=viewer-1&memberToken=viewer-secret&access=sync`
    );
    await new Promise<void>((resolve, reject) => {
      rejectedViewerSync.once("unexpected-response", (_request, response) => {
        expect(response.statusCode).toBe(401);
        resolve();
      });
      rejectedViewerSync.once("open", () => reject(new Error("viewer sync connected")));
      rejectedViewerSync.once("error", reject);
    });

    const viewerAwarenessSocket = new WebSocket(
      `${relay.wsUrl}/canvas-mcp-editor:team-1:sample-file?userId=viewer-1&memberToken=viewer-secret&access=awareness`
    );
    await new Promise<void>((resolve, reject) => {
      viewerAwarenessSocket.once("open", resolve);
      viewerAwarenessSocket.once("error", reject);
    });

    editorSocket.close();
    viewerAwarenessSocket.close();
    await relay.close();
  });
});
