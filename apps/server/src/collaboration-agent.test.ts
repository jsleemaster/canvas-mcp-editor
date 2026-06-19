import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { assertUnchangedStateVector } from "./collaboration-agent";

describe("collaborative agent command guard", () => {
  test("rejects apply when the remote Yjs state vector changed after dry-run", () => {
    const ydoc = new Y.Doc();
    const beforeStateVector = Y.encodeStateVector(ydoc);

    ydoc.getMap("design").set("documentJson", { id: "sample-file", name: "Updated", pages: [] });

    expect(() => assertUnchangedStateVector(beforeStateVector, ydoc)).toThrow(
      "collaboration document changed before agent apply; retry dryRun"
    );
  });
});
