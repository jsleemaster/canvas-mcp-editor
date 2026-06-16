import type { RendererDocument } from "@canvas-mcp-editor/renderer";
import {
  createCollaborativeDesignDocument,
  createDocumentRoomId,
  createPresenceState,
  summarizeAwarenessStates,
  type CollaborationPresence,
  type TeamManifest
} from "@canvas-mcp-editor/collaboration";
import { Awareness } from "y-protocols/awareness";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import type * as Y from "yjs";

export type CollabConnectionStatus = "offline" | "connecting" | "synced" | "error";

export interface CollaborationProviderInput {
  relayUrl: string;
  roomId: string;
  token?: string;
  ydoc: Y.Doc;
  initialPresence: CollaborationPresence;
}

export interface CollaborationProvider {
  onStatus(listener: (status: CollabConnectionStatus) => void): void;
  updatePresence(presence: CollaborationPresence): void;
  getPresence(): CollaborationPresence[];
  destroy(): void;
}

export type CollaborationProviderFactory = (input: CollaborationProviderInput) => CollaborationProvider;

export interface CollabDocumentSession {
  team: TeamManifest;
  documentId: string;
  readonly status: CollabConnectionStatus;
  getDocument(): RendererDocument;
  transact(label: string, apply: (document: RendererDocument) => RendererDocument): void;
  subscribe(listener: (document: RendererDocument) => void): () => void;
  updatePresence(patch: Partial<CollaborationPresence>): void;
  getPresence(): CollaborationPresence[];
  destroy(): void;
}

export interface CreateCollabDocumentSessionInput {
  team: TeamManifest;
  documentId: string;
  initialDocument: RendererDocument;
  enablePersistence?: boolean;
  providerFactory?: CollaborationProviderFactory;
}

export function createCollabDocumentSession(
  input: CreateCollabDocumentSessionInput
): CollabDocumentSession {
  const document = createCollaborativeDesignDocument({ document: input.initialDocument });
  const localPresence = createPresenceState({
    ...input.team.members.find((member) => member.userId === input.team.currentUserId),
    userId: input.team.currentUserId
  });
  const localPresenceState = { current: localPresence };
  let status: CollabConnectionStatus = input.team.sync.mode === "websocket" ? "connecting" : "offline";
  let provider: CollaborationProvider | null = null;
  let persistence: { destroy(): Promise<void> | void } | null = null;

  if (input.enablePersistence ?? true) {
    persistence = new IndexeddbPersistence(
      createDocumentRoomId(input.team.teamId, input.documentId),
      document.ydoc
    );
  }

  if (input.team.sync.mode === "websocket") {
    provider = (input.providerFactory ?? createDefaultProvider)({
      relayUrl: input.team.sync.relayUrl,
      roomId: createDocumentRoomId(input.team.teamId, input.documentId),
      token: input.team.sync.token,
      ydoc: document.ydoc,
      initialPresence: localPresence
    });
    provider.onStatus((nextStatus) => {
      status = nextStatus;
    });
  }

  return {
    team: input.team,
    documentId: input.documentId,
    get status() {
      return status;
    },
    getDocument: document.getDocument,
    transact: document.transact,
    subscribe: document.subscribe,
    updatePresence(patch) {
      localPresenceState.current = createPresenceState({
        ...localPresenceState.current,
        ...patch
      });
      provider?.updatePresence(localPresenceState.current);
    },
    getPresence() {
      if (provider) {
        const remotePresence = provider.getPresence();
        return remotePresence.length ? remotePresence : [localPresenceState.current];
      }

      return [localPresenceState.current];
    },
    destroy() {
      provider?.destroy();
      void persistence?.destroy();
      document.destroy();
    }
  };
}

function createDefaultProvider(input: CollaborationProviderInput): CollaborationProvider {
  const awareness = new Awareness(input.ydoc);
  awareness.setLocalState(input.initialPresence);
  const provider = new WebsocketProvider(input.relayUrl, input.roomId, input.ydoc, {
    awareness,
    params: input.token ? { token: input.token } : undefined
  });
  const statusListeners = new Set<(status: CollabConnectionStatus) => void>();

  provider.on("status", (event: { status: "connected" | "disconnected" | "connecting" }) => {
    const nextStatus =
      event.status === "connected" ? "synced" : event.status === "disconnected" ? "offline" : "connecting";
    for (const listener of statusListeners) {
      listener(nextStatus);
    }
  });
  provider.on("connection-error", () => {
    for (const listener of statusListeners) {
      listener("error");
    }
  });

  return {
    onStatus(listener) {
      statusListeners.add(listener);
    },
    updatePresence(presence) {
      awareness.setLocalState(presence);
    },
    getPresence() {
      return summarizeAwarenessStates(Array.from(awareness.getStates().values()));
    },
    destroy() {
      statusListeners.clear();
      provider.destroy();
      awareness.destroy();
    }
  };
}
