# Collaboration E2EE Design

Objective 2 adds relay-safe end-to-end encryption for collaborative document updates while preserving the static web app and team-owned relay model.

## Scope

- Encrypt Yjs document update payloads before they leave the browser.
- Keep the relay unable to parse or apply encrypted document updates into a `Y.Doc`.
- Keep awareness and presence metadata unencrypted in this v1 so remote cursors, selections, and viewer awareness keep working.
- Keep passphrases and derived keys out of exported team manifests and IndexedDB team records.
- Continue using team-owned relay URLs and runtime relay/member tokens from the existing auth slice.

## Non-Goals

- No central key server, account system, recovery flow, or invitation service.
- No encrypted local browser storage.
- No encryption for presence metadata in this slice.
- No Rust relay migration in this slice.

## Manifest

`TeamManifest` gets optional non-secret encryption metadata:

```ts
type TeamEncryptionConfig =
  | { mode: "none" }
  | {
      mode: "shared-key";
      algorithm: "AES-GCM";
      kdf: "PBKDF2-SHA-256";
      salt: string;
      iterations: number;
    };
```

The exported manifest may include `encryption` metadata, but never a passphrase or derived key. Legacy manifests without `encryption` parse as unencrypted teams.

## Crypto

The web client derives an AES-GCM key from a user-entered passphrase with PBKDF2-SHA-256 using the manifest salt and iteration count. Each encrypted Yjs update gets a fresh 96-bit IV and is encoded as a binary frame containing the IV and ciphertext. Decryption failures are surfaced as connection errors and the invalid update is discarded.

## Relay Protocol

The websocket URL includes `e2ee=true` when `team.encryption.mode === "shared-key"`. An encrypted room is opaque to the relay:

- The relay does not create or mutate a room `Y.Doc`.
- The relay broadcasts encrypted sync frames without decrypting them.
- The relay still parses frame type, room auth, member auth, and awareness frames.
- Plain and encrypted clients cannot share the same relay room at the same time.

Encrypted document frames:

- `messageEncryptedSync = 10`: contains one encrypted Yjs update.
- `messageEncryptedSyncQuery = 11`: asks connected editors to send their current encrypted state update.

When an encrypted client connects, it sends a query frame. Existing encrypted editor clients respond with an encrypted `Y.encodeStateAsUpdate(ydoc)` payload, so late joiners catch up while at least one synced editor remains connected.

## UI

The Team panel adds:

- an E2EE toggle
- a passphrase input

The passphrase is runtime-only. Export, download, upload, and URL import continue to work with metadata only. Creating an encrypted relay team requires a relay URL and passphrase. Importing an encrypted manifest requires entering the passphrase before activation.

## Testing

- Unit test manifest parsing/export redacts passphrase-like fields and preserves encryption metadata.
- Unit test Web Crypto helpers round-trip and reject wrong passphrases.
- Unit test encrypted provider behavior with a fake websocket endpoint.
- Unit test relay opaque encrypted room behavior and mixed-mode rejection.
- Playwright collaboration e2e verifies two browser contexts sync document edits through an encrypted relay room.
