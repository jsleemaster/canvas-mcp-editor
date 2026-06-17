import { describe, expect, test } from "vitest";
import { createSharedKeyEncryptionConfig } from "./team-manifest";
import {
  decryptYjsUpdate,
  deriveSharedKey,
  encryptYjsUpdate
} from "./e2ee";

describe("collaboration e2ee helpers", () => {
  test("encrypts and decrypts a Yjs update with a shared passphrase", async () => {
    const config = createSharedKeyEncryptionConfig({
      salt: "fixed-test-salt",
      iterations: 1000
    });
    const key = await deriveSharedKey("correct horse battery staple", config);
    const update = new Uint8Array([0, 1, 2, 3, 255]);

    const encrypted = await encryptYjsUpdate(update, key);
    const decrypted = await decryptYjsUpdate(encrypted, key);

    expect(encrypted.iv).not.toEqual("");
    expect(encrypted.ciphertext).not.toContain("0,1,2,3,255");
    expect(decrypted).toEqual(update);
  });

  test("rejects encrypted updates when the passphrase is wrong", async () => {
    const config = createSharedKeyEncryptionConfig({
      salt: "fixed-test-salt",
      iterations: 1000
    });
    const update = new Uint8Array([10, 20, 30]);
    const correctKey = await deriveSharedKey("right-passphrase", config);
    const wrongKey = await deriveSharedKey("wrong-passphrase", config);
    const encrypted = await encryptYjsUpdate(update, correctKey);

    await expect(decryptYjsUpdate(encrypted, wrongKey)).rejects.toThrow(/decrypt/i);
  });

  test("uses a unique iv for each encrypted update", async () => {
    const config = createSharedKeyEncryptionConfig({
      salt: "fixed-test-salt",
      iterations: 1000
    });
    const key = await deriveSharedKey("same-passphrase", config);
    const update = new Uint8Array([42, 43, 44]);

    const first = await encryptYjsUpdate(update, key);
    const second = await encryptYjsUpdate(update, key);

    expect(first.iv).not.toEqual(second.iv);
    expect(first.ciphertext).not.toEqual(second.ciphertext);
  });

  test("rejects empty passphrases", async () => {
    const config = createSharedKeyEncryptionConfig({
      salt: "fixed-test-salt",
      iterations: 1000
    });

    await expect(deriveSharedKey(" ", config)).rejects.toThrow(/passphrase/i);
  });
});
