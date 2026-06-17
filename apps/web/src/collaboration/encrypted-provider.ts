import {
  decryptYjsUpdate,
  deriveSharedKey,
  encryptYjsUpdate,
  summarizeAwarenessStates,
  type CollaborationPresence,
  type EncryptedYjsUpdate,
  type SharedKeyEncryptionConfig
} from "@canvas-mcp-editor/collaboration";
import { Awareness } from "y-protocols/awareness";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";
import type {
  CollabConnectionStatus,
  CollaborationProvider,
  CollaborationProviderInput
} from "./collab-session";

export interface EncryptedProviderInput extends CollaborationProviderInput {
  passphrase: string;
  encryption: SharedKeyEncryptionConfig;
  WebSocketCtor?: typeof WebSocket;
}

const messageAwareness = 1;
const messageQueryAwareness = 3;
const messageEncryptedSync = 10;
const messageEncryptedSyncQuery = 11;
const remoteEncryptedOrigin = Symbol("remote-encrypted-update");

export function createEncryptedProvider(input: EncryptedProviderInput): CollaborationProvider {
  const statusListeners = new Set<(status: CollabConnectionStatus) => void>();
  const presenceListeners = new Set<() => void>();
  const awareness = new Awareness(input.ydoc);
  awareness.setLocalState(input.initialPresence);
  const WebSocketCtor = input.WebSocketCtor ?? WebSocket;
  const outboundQueue: Uint8Array[] = [];
  let socket: WebSocket | null = null;
  let key: CryptoKey | null = null;
  let destroyed = false;

  const emitStatus = (status: CollabConnectionStatus) => {
    for (const listener of statusListeners) {
      listener(status);
    }
  };
  const emitPresence = () => {
    for (const listener of presenceListeners) {
      listener();
    }
  };
  const sendFrame = (frame: Uint8Array) => {
    if (socket?.readyState === WebSocketCtor.OPEN) {
      socket.send(frame);
      return;
    }
    outboundQueue.push(frame);
  };
  const sendEncryptedUpdate = async (update: Uint8Array) => {
    if (!key || input.access !== "sync") {
      return;
    }
    sendFrame(encodeEncryptedSyncFrame(await encryptYjsUpdate(update, key)));
  };
  const onDocumentUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === remoteEncryptedOrigin) {
      return;
    }
    void sendEncryptedUpdate(update).catch(() => emitStatus("error"));
  };
  const sendAwarenessUpdate = () => {
    sendFrame(
      encodeAwarenessFrame(
        awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()))
      )
    );
  };
  const onSocketOpen = () => {
    if (destroyed) {
      return;
    }
    emitStatus("synced");
    sendAwarenessUpdate();
    if (input.access === "sync") {
      sendFrame(encodeEncryptedSyncQueryFrame());
    }
    while (outboundQueue.length && socket?.readyState === WebSocketCtor.OPEN) {
      socket.send(outboundQueue.shift() as Uint8Array);
    }
  };
  const onSocketMessage = (event: MessageEvent) => {
    void handleIncomingMessage(toUint8Array(event.data)).catch(() => emitStatus("error"));
  };
  const onSocketClose = () => emitStatus("offline");
  const onSocketError = () => emitStatus("error");
  const connect = async () => {
    try {
      key = await deriveSharedKey(input.passphrase, input.encryption);
      if (destroyed) {
        return;
      }
      socket = new WebSocketCtor(createEncryptedWebSocketUrl(input));
      socket.binaryType = "arraybuffer";
      socket.addEventListener("open", onSocketOpen);
      socket.addEventListener("message", onSocketMessage);
      socket.addEventListener("close", onSocketClose);
      socket.addEventListener("error", onSocketError);
    } catch {
      emitStatus("error");
    }
  };
  const handleIncomingMessage = async (bytes: Uint8Array) => {
    const frame = decodeFrame(bytes);
    if (frame.type === messageEncryptedSync) {
      if (!key || input.access !== "sync" || !frame.payload) {
        return;
      }
      const encrypted = JSON.parse(new TextDecoder().decode(frame.payload)) as EncryptedYjsUpdate;
      Y.applyUpdate(input.ydoc, await decryptYjsUpdate(encrypted, key), remoteEncryptedOrigin);
      return;
    }

    if (frame.type === messageEncryptedSyncQuery) {
      await sendEncryptedUpdate(Y.encodeStateAsUpdate(input.ydoc));
      return;
    }

    if (frame.type === messageAwareness && frame.payload) {
      awarenessProtocol.applyAwarenessUpdate(awareness, frame.payload, "remote-awareness");
      emitPresence();
      return;
    }

    if (frame.type === messageQueryAwareness) {
      sendAwarenessUpdate();
    }
  };

  input.ydoc.on("update", onDocumentUpdate);
  awareness.on("change", emitPresence);
  void connect();

  return {
    onStatus(listener) {
      statusListeners.add(listener);
    },
    onPresence(listener) {
      presenceListeners.add(listener);
      return () => {
        presenceListeners.delete(listener);
      };
    },
    updatePresence(presence: CollaborationPresence) {
      awareness.setLocalState(presence);
      sendAwarenessUpdate();
    },
    getPresence() {
      return summarizeAwarenessStates(Array.from(awareness.getStates().values()));
    },
    destroy() {
      destroyed = true;
      statusListeners.clear();
      presenceListeners.clear();
      input.ydoc.off("update", onDocumentUpdate);
      awareness.off("change", emitPresence);
      socket?.removeEventListener("open", onSocketOpen);
      socket?.removeEventListener("message", onSocketMessage);
      socket?.removeEventListener("close", onSocketClose);
      socket?.removeEventListener("error", onSocketError);
      socket?.close();
      awareness.destroy();
    }
  };
}

export function encodeEncryptedSyncFrame(update: EncryptedYjsUpdate): Uint8Array {
  return encodePayloadFrame(messageEncryptedSync, new TextEncoder().encode(JSON.stringify(update)));
}

export function encodeEncryptedSyncQueryFrame(): Uint8Array {
  return encodeTypeFrame(messageEncryptedSyncQuery);
}

function encodeAwarenessFrame(update: Uint8Array): Uint8Array {
  return encodePayloadFrame(messageAwareness, update);
}

function createEncryptedWebSocketUrl(input: EncryptedProviderInput): string {
  const base = input.relayUrl.endsWith("/") ? input.relayUrl : `${input.relayUrl}/`;
  const url = new URL(`${base}${encodeURIComponent(input.roomId)}`);
  if (input.token) {
    url.searchParams.set("token", input.token);
  }
  url.searchParams.set("userId", input.userId);
  if (input.memberToken) {
    url.searchParams.set("memberToken", input.memberToken);
  }
  url.searchParams.set("access", input.access);
  url.searchParams.set("e2ee", "true");
  return url.toString();
}

function encodeTypeFrame(type: number): Uint8Array {
  return encodeVarUint(type);
}

function encodePayloadFrame(type: number, payload: Uint8Array): Uint8Array {
  return concat(encodeVarUint(type), encodeVarUint(payload.byteLength), payload);
}

function decodeFrame(bytes: Uint8Array): { type: number; payload?: Uint8Array } {
  const cursor = { offset: 0 };
  const type = decodeVarUint(bytes, cursor);
  if (cursor.offset >= bytes.byteLength) {
    return { type };
  }
  const payloadLength = decodeVarUint(bytes, cursor);
  return {
    type,
    payload: bytes.slice(cursor.offset, cursor.offset + payloadLength)
  };
}

function encodeVarUint(value: number): Uint8Array {
  const bytes: number[] = [];
  let nextValue = value;
  while (nextValue > 0x7f) {
    bytes.push((nextValue & 0x7f) | 0x80);
    nextValue = Math.floor(nextValue / 128);
  }
  bytes.push(nextValue);
  return new Uint8Array(bytes);
}

function decodeVarUint(bytes: Uint8Array, cursor: { offset: number }): number {
  let num = 0;
  let multiplier = 1;
  while (cursor.offset < bytes.byteLength) {
    const byte = bytes[cursor.offset];
    cursor.offset += 1;
    num += (byte & 0x7f) * multiplier;
    if (byte < 0x80) {
      return num;
    }
    multiplier *= 128;
  }
  throw new Error("invalid collaboration frame");
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((total, part) => total + part.byteLength, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function toUint8Array(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  throw new Error("unsupported collaboration frame payload");
}
