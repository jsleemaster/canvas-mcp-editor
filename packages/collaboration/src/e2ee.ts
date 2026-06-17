import type { SharedKeyEncryptionConfig } from "./team-manifest";

export interface EncryptedYjsUpdate {
  iv: string;
  ciphertext: string;
}

export async function deriveSharedKey(
  passphrase: string,
  config: SharedKeyEncryptionConfig,
  crypto: Crypto = globalThis.crypto
): Promise<CryptoKey> {
  if (!passphrase.trim()) {
    throw new Error("encryption passphrase is required");
  }
  const subtle = getSubtleCrypto(crypto);
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode(config.salt),
      iterations: config.iterations
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptYjsUpdate(
  update: Uint8Array,
  key: CryptoKey,
  crypto: Crypto = globalThis.crypto
): Promise<EncryptedYjsUpdate> {
  const subtle = getSubtleCrypto(crypto);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    update
  );

  return {
    iv: base64UrlEncode(iv),
    ciphertext: base64UrlEncode(new Uint8Array(ciphertext))
  };
}

export async function decryptYjsUpdate(
  encrypted: EncryptedYjsUpdate,
  key: CryptoKey,
  crypto: Crypto = globalThis.crypto
): Promise<Uint8Array> {
  try {
    const plaintext = await getSubtleCrypto(crypto).decrypt(
      {
        name: "AES-GCM",
        iv: base64UrlDecode(encrypted.iv)
      },
      key,
      base64UrlDecode(encrypted.ciphertext)
    );
    return new Uint8Array(plaintext);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown crypto error";
    throw new Error(`failed to decrypt yjs update: ${message}`);
  }
}

function getSubtleCrypto(crypto: Crypto): SubtleCrypto {
  if (!crypto?.subtle) {
    throw new Error("Web Crypto subtle API is not available");
  }
  return crypto.subtle;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
