import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import type { RendererDocument } from "@canvas-mcp-editor/renderer";
import { createCollaborativeDesignDocument } from "./yjs-document";

function sampleDocument(): RendererDocument {
  return {
    id: "sample-file",
    name: "Sample File",
    pages: [
      {
        id: "page-1",
        name: "Page 1",
        children: [
          {
            id: "text-1",
            kind: "text",
            name: "Headline",
            transform: { x: 32, y: 40, rotation: 0 },
            size: { width: 260, height: 48 },
            style: { fill: "#111827", stroke: null, stroke_width: 0, opacity: 1 },
            content: {
              type: "text",
              value: "Canvas MCP Editor",
              font_size: 28,
              font_family: "Inter"
            },
            children: []
          }
        ]
      }
    ]
  };
}

describe("collaborative design document", () => {
  test("creates a Yjs document and returns the initial design file", () => {
    const document = createCollaborativeDesignDocument({ document: sampleDocument() });

    expect(document.ydoc).toBeInstanceOf(Y.Doc);
    expect(document.getDocument()).toEqual(sampleDocument());

    document.destroy();
  });

  test("applies transactions and notifies subscribers once", () => {
    const document = createCollaborativeDesignDocument({ document: sampleDocument() });
    const updates: RendererDocument[] = [];
    const unsubscribe = document.subscribe((nextDocument) => updates.push(nextDocument));

    document.transact("rename", (current) => ({
      ...current,
      name: "Renamed File"
    }));

    expect(document.getDocument().name).toBe("Renamed File");
    expect(updates.map((update) => update.name)).toEqual(["Renamed File"]);

    unsubscribe();
    document.destroy();
  });

  test("syncs two sessions through Yjs updates in memory", () => {
    const first = createCollaborativeDesignDocument({ document: sampleDocument() });
    const second = createCollaborativeDesignDocument({ document: sampleDocument() });

    Y.applyUpdate(second.ydoc, Y.encodeStateAsUpdate(first.ydoc));
    Y.applyUpdate(first.ydoc, Y.encodeStateAsUpdate(second.ydoc));

    first.ydoc.on("update", (update: Uint8Array) => {
      Y.applyUpdate(second.ydoc, update);
    });
    second.ydoc.on("update", (update: Uint8Array) => {
      Y.applyUpdate(first.ydoc, update);
    });

    first.transact("rename", (current) => ({
      ...current,
      name: "Synced File"
    }));

    expect(second.getDocument().name).toBe("Synced File");

    first.destroy();
    second.destroy();
  });

  test("rejects invalid document payloads", () => {
    const document = createCollaborativeDesignDocument({ document: sampleDocument() });

    expect(() => document.setDocument({ name: "Missing fields" } as unknown as RendererDocument)).toThrow(
      /invalid design document/i
    );

    document.destroy();
  });
});
