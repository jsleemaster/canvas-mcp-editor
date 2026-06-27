import { describe, expect, test } from "vitest";
import type { RendererNode } from "@layo/renderer";
import { pdfForNode, svgForNode } from "./node-artifacts";

const nestedFrame: RendererNode = {
  id: "frame-1",
  kind: "frame",
  name: "Frame",
  transform: { x: 120, y: 80, rotation: 0 },
  size: { width: 240, height: 160 },
  style: { fill: "#f8fafc", stroke: "#94a3b8", stroke_width: 1, opacity: 1 },
  content: { type: "empty" },
  children: [
    {
      id: "text-1",
      kind: "text",
      name: "Nested headline",
      transform: { x: 24, y: 32, rotation: 0 },
      size: { width: 150, height: 32 },
      style: { fill: "#111827", stroke: null, stroke_width: 0, opacity: 1 },
      content: { type: "text", value: "Nested headline", font_size: 18, font_family: "Inter" },
      children: []
    },
    {
      id: "rectangle-1",
      kind: "rectangle",
      name: "Nested swatch",
      transform: { x: 24, y: 84, rotation: 0 },
      size: { width: 96, height: 48 },
      style: { fill: "#dbeafe", stroke: "#1d4ed8", stroke_width: 2, opacity: 0.75 },
      content: { type: "empty" },
      children: []
    }
  ]
};

describe("node artifact exports", () => {
  test("renders selected frame SVG with nested child layers", () => {
    const svg = svgForNode(nestedFrame);

    expect(svg).toContain('data-node-id="frame-1"');
    expect(svg).toContain('data-node-id="text-1"');
    expect(svg).toContain('data-node-name="Nested headline"');
    expect(svg).toContain('transform="translate(24 32)"');
    expect(svg).toContain(">Nested headline</text>");
    expect(svg).toContain('data-node-id="rectangle-1"');
    expect(svg).toContain('data-node-name="Nested swatch"');
    expect(svg).toContain('fill="#dbeafe"');
    expect(svg).toContain('stroke="#1d4ed8"');
    expect(svg).toContain('opacity="0.75"');
  });

  test("renders selected frame PDF with nested child layer drawing commands", () => {
    const pdf = pdfForNode(nestedFrame);

    expect(pdf).toContain("%PDF-");
    expect(pdf).toContain("/Title (Frame)");
    expect(pdf).toContain("/Subject (frame-1)");
    expect(pdf).toContain("(Nested headline) Tj");
    expect(pdf).toContain("0.859 0.918 0.996 rg");
    expect(pdf).toContain("24 28 96 48 re");
  });
});
