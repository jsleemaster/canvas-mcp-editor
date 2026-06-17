import { describe, expect, test } from "vitest";
import {
  createSharedKeyEncryptionConfig,
  deriveSharedKey,
  encryptYjsUpdate,
  type SharedKeyEncryptionConfig
} from "@canvas-mcp-editor/collaboration";
import * as Y from "yjs";
import {
  createEncryptedProvider,
  encodeEncryptedSyncFrame,
  encodeEncryptedSyncQueryFrame
} from "./encrypted-provider";

class MockWebSocket {
  static readonly OPEN = 1;
  static instances: MockWebSocket[] = [];

  readonly listeners = new Map<string, Set<(event: Event | MessageEvent | CloseEvent) => void>>();
  readonly sent: Uint8Array[] = [];
  binaryType: BinaryType = "arraybuffer";
  readyState = MockWebSocket.OPEN;

  constructor(readonly url: string) {
    MockWebSocket.instances.push(this);
    queueMicrotask(() => this.emit("open", new Event("open")));
  }

  addEventListener(type: string, listener: (event: Event | MessageEvent | CloseEvent) => void) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: Event | MessageEvent | CloseEvent) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  send(data: ArrayBuffer | Uint8Array) {
    this.sent.push(data instanceof Uint8Array ? data : new Uint8Array(data));
  }

  close() {
    this.readyState = 3;
    this.emit("close", new CloseEvent("close"));
  }

  emitMessage(data: Uint8Array) {
    this.emit("message", new MessageEvent("message", { data }));
  }

  emit(type: string, event: Event | MessageEvent | CloseEvent) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe("encrypted collaboration provider", () => {
  test("connects with e2ee query params and sends encrypted document updates", async () => {
    const ydoc = new Y.Doc();
    const provider = createTestProvider({ ydoc });
    const socket = await waitForSocket();

    ydoc.getMap("design").set("documentJson", { name: "Secret Document" });
    await waitFor(() => socket.sent.some((frame) => frame[0] === 10));

    const bytes = new TextDecoder().decode(concat(socket.sent));
    expect(socket.url).toContain("e2ee=true");
    expect(socket.url).toContain("access=sync");
    expect(bytes).not.toContain("Secret Document");
    provider.destroy();
  });

  test("decrypts incoming encrypted updates into the local Y.Doc", async () => {
    const config = testEncryptionConfig();
    const ydoc = new Y.Doc();
    const provider = createTestProvider({ ydoc, encryption: config });
    const socket = await waitForSocket();
    const remote = new Y.Doc();
    remote.getMap("design").set("documentJson", { name: "Remote Secret" });
    const key = await deriveSharedKey("shared-passphrase", config);
    const encrypted = await encryptYjsUpdate(Y.encodeStateAsUpdate(remote), key);

    socket.emitMessage(encodeEncryptedSyncFrame(encrypted));

    await waitFor(() => ydoc.getMap("design").get("documentJson") !== undefined);
    expect(ydoc.getMap("design").get("documentJson")).toEqual({ name: "Remote Secret" });
    provider.destroy();
  });

  test("applies encrypted document snapshots over competing local seed documents", async () => {
    MockWebSocket.instances = [];
    const local = new Y.Doc();
    setClientId(local, 2);
    local.getMap("design").set("documentJson", { name: "Local Seed" });
    const receiver = createTestProvider({ ydoc: local, resetSockets: false });
    const receiverSocket = await waitForSocket(0);

    const remote = new Y.Doc();
    setClientId(remote, 1);
    remote.getMap("design").set("documentJson", { name: "Remote Seed" });
    const sender = createTestProvider({ ydoc: remote, resetSockets: false });
    const senderSocket = await waitForSocket(1);
    await waitFor(() => senderSocket.sent.length > 0);
    senderSocket.sent.length = 0;

    remote.getMap("design").set("documentJson", { name: "Remote Update" });
    await waitFor(() => senderSocket.sent.some((frame) => frame[0] === 10));
    receiverSocket.emitMessage(senderSocket.sent.find((frame) => frame[0] === 10) as Uint8Array);

    await waitFor(() => getDocumentName(local) === "Remote Update");
    expect(getDocumentName(local)).toBe("Remote Update");
    receiver.destroy();
    sender.destroy();
  });

  test("responds to encrypted sync queries with encrypted full state", async () => {
    const ydoc = new Y.Doc();
    ydoc.getMap("design").set("documentJson", { name: "Full State Secret" });
    const provider = createTestProvider({ ydoc });
    const socket = await waitForSocket();
    socket.sent.length = 0;

    socket.emitMessage(encodeEncryptedSyncQueryFrame());

    await waitFor(() => socket.sent.some((frame) => frame[0] === 10));
    const bytes = new TextDecoder().decode(concat(socket.sent));
    expect(bytes).not.toContain("Full State Secret");
    provider.destroy();
  });

  test("reports an error when encrypted updates cannot be decrypted", async () => {
    const config = testEncryptionConfig();
    const ydoc = new Y.Doc();
    const provider = createTestProvider({ ydoc, encryption: config, passphrase: "wrong-passphrase" });
    const statuses: string[] = [];
    provider.onStatus((status) => statuses.push(status));
    const socket = await waitForSocket();
    const remote = new Y.Doc();
    remote.getMap("design").set("documentJson", { name: "Unreadable" });
    const key = await deriveSharedKey("shared-passphrase", config);
    const encrypted = await encryptYjsUpdate(Y.encodeStateAsUpdate(remote), key);

    socket.emitMessage(encodeEncryptedSyncFrame(encrypted));

    await waitFor(() => statuses.includes("error"));
    provider.destroy();
  });
});

function createTestProvider(input: {
  ydoc: Y.Doc;
  encryption?: SharedKeyEncryptionConfig;
  passphrase?: string;
  resetSockets?: boolean;
}) {
  if (input.resetSockets ?? true) {
    MockWebSocket.instances = [];
  }
  return createEncryptedProvider({
    relayUrl: "ws://127.0.0.1:4327",
    roomId: "canvas-mcp-editor:team-1:sample-file",
    userId: "user-1",
    access: "sync",
    ydoc: input.ydoc,
    initialPresence: {
      sessionId: "session-1",
      userId: "user-1",
      displayName: "Lee",
      color: "#2563eb",
      selectedNodeId: null,
      selectedNodeBounds: null,
      cursor: null,
      viewport: null,
      updatedAtMs: null,
      activeTool: "select"
    },
    passphrase: input.passphrase ?? "shared-passphrase",
    encryption: input.encryption ?? testEncryptionConfig(),
    WebSocketCtor: MockWebSocket as unknown as typeof WebSocket
  });
}

function setClientId(ydoc: Y.Doc, clientId: number) {
  (ydoc as Y.Doc & { clientID: number }).clientID = clientId;
}

function getDocumentName(ydoc: Y.Doc): string | undefined {
  return (ydoc.getMap("design").get("documentJson") as { name?: string } | undefined)?.name;
}

function testEncryptionConfig(): SharedKeyEncryptionConfig {
  return createSharedKeyEncryptionConfig({
    salt: "fixed-test-salt",
    iterations: 1000
  });
}

async function waitForSocket(index = 0): Promise<MockWebSocket> {
  await waitFor(() => MockWebSocket.instances.length > index);
  return MockWebSocket.instances[index];
}

async function waitFor(assertion: () => boolean): Promise<void> {
  const startedAt = Date.now();
  while (!assertion()) {
    if (Date.now() - startedAt > 1000) {
      throw new Error("timed out waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

function concat(frames: Uint8Array[]): Uint8Array {
  const size = frames.reduce((total, frame) => total + frame.byteLength, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const frame of frames) {
    output.set(frame, offset);
    offset += frame.byteLength;
  }
  return output;
}
