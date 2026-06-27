import type { RendererNode } from "@layo/renderer";

function formatNumber(value: number) {
  const rounded = Math.round(value * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, "").replace(/\.$/, "");
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function svgOpacityAttribute(opacity: number) {
  return opacity < 1 ? ` opacity="${formatNumber(Math.max(0, Math.min(1, opacity)))}"` : "";
}

function svgNodeTransform(node: RendererNode) {
  const translate = `translate(${formatNumber(node.transform.x)} ${formatNumber(node.transform.y)})`;
  const rotation = node.transform.rotation ? ` rotate(${formatNumber(node.transform.rotation)})` : "";
  return `${translate}${rotation}`;
}

function svgNodeAttributes(node: RendererNode) {
  return `data-node-id="${escapeSvgText(node.id)}" data-node-name="${escapeSvgText(node.name)}" data-node-kind="${node.kind}"`;
}

function svgSelfForNode(node: RendererNode) {
  const width = Math.max(1, Math.round(node.size.width));
  const height = Math.max(1, Math.round(node.size.height));
  const fill = escapeSvgText(node.style.fill);
  const opacity = svgOpacityAttribute(node.style.opacity);

  if (node.content.type === "text") {
    const fontSize = Math.max(1, Math.round(node.content.font_size));
    return `<text ${svgNodeAttributes(node)} x="0" y="${fontSize}" fill="${fill}" font-family="${escapeSvgText(
      node.content.font_family
    )}" font-size="${fontSize}"${opacity}>${escapeSvgText(node.content.value)}</text>`;
  }

  if (node.kind === "group") {
    return null;
  }

  const assetAttribute = node.content.type === "image" ? ` data-image-asset-id="${escapeSvgText(node.content.asset_id)}"` : "";
  return `<rect ${svgNodeAttributes(node)}${assetAttribute} x="0" y="0" width="${width}" height="${height}" rx="0" fill="${fill}" stroke="${
    node.style.stroke ? escapeSvgText(node.style.stroke) : "none"
  }" stroke-width="${Math.max(0, Math.round(node.style.stroke_width))}"${opacity} />`;
}

function indent(line: string, depth: number) {
  return `${"  ".repeat(depth)}${line}`;
}

function svgLinesForNode(node: RendererNode, depth: number, isRoot = false): string[] {
  const lines: string[] = [];
  if (!isRoot) {
    lines.push(indent(`<g ${svgNodeAttributes(node)} transform="${svgNodeTransform(node)}">`, depth));
  }

  const self = svgSelfForNode(node);
  if (self) {
    lines.push(indent(self, isRoot ? depth : depth + 1));
  }

  for (const child of node.children) {
    lines.push(...svgLinesForNode(child, isRoot ? depth : depth + 1));
  }

  if (!isRoot) {
    lines.push(indent("</g>", depth));
  }
  return lines;
}

export function svgForNode(node: RendererNode) {
  const width = Math.max(1, Math.round(node.size.width));
  const height = Math.max(1, Math.round(node.size.height));
  const nodeId = escapeSvgText(node.id);
  const nodeName = escapeSvgText(node.name);
  const title = `<title>${nodeName}</title>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-node-id="${nodeId}" data-node-name="${nodeName}" role="img" aria-label="${nodeName}">`,
    `  ${title}`,
    ...svgLinesForNode(node, 1, true),
    "</svg>",
    ""
  ].join("\n");
}

function pdfEscapeString(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)").replaceAll("\r", " ").replaceAll("\n", " ");
}

function pdfColorOperands(fill: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(fill.trim());
  if (!match) {
    return "0 0 0";
  }
  const hex = match[1];
  return [0, 2, 4]
    .map((index) => {
      const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
      return formatNumber(Number(channel.toFixed(3)));
    })
    .join(" ");
}

function pdfRectCommands(node: RendererNode, pageHeight: number, x: number, y: number) {
  const width = Math.max(1, Math.round(node.size.width));
  const height = Math.max(1, Math.round(node.size.height));
  const pdfY = pageHeight - y - height;
  const commands = ["q", `${pdfColorOperands(node.style.fill)} rg`, `${formatNumber(x)} ${formatNumber(pdfY)} ${width} ${height} re`, "f", "Q"];

  if (node.style.stroke && node.style.stroke_width > 0) {
    commands.push(
      "q",
      `${pdfColorOperands(node.style.stroke)} RG`,
      `${formatNumber(Math.max(0, node.style.stroke_width))} w`,
      `${formatNumber(x)} ${formatNumber(pdfY)} ${width} ${height} re`,
      "S",
      "Q"
    );
  }

  return commands;
}

function pdfTextCommands(node: RendererNode, pageHeight: number, x: number, y: number) {
  if (node.content.type !== "text") {
    return [];
  }

  const fontSize = Math.max(1, Math.round(node.content.font_size));
  const pdfY = pageHeight - y - fontSize;
  return [
    "BT",
    `/F1 ${fontSize} Tf`,
    `${pdfColorOperands(node.style.fill)} rg`,
    `${formatNumber(x)} ${formatNumber(Math.max(0, pdfY))} Td`,
    `(${pdfEscapeString(node.content.value)}) Tj`,
    "ET"
  ];
}

function pdfCommandsForNode(node: RendererNode, pageHeight: number, originX: number, originY: number, isRoot = false): string[] {
  const x = isRoot ? originX : originX + node.transform.x;
  const y = isRoot ? originY : originY + node.transform.y;
  const commands =
    node.content.type === "text"
      ? pdfTextCommands(node, pageHeight, x, y)
      : node.kind === "group"
        ? []
        : pdfRectCommands(node, pageHeight, x, y);

  for (const child of node.children) {
    commands.push(...pdfCommandsForNode(child, pageHeight, x, y));
  }

  return commands;
}

export function pdfForNode(node: RendererNode) {
  const encoder = new TextEncoder();
  const width = Math.max(1, Math.round(node.size.width));
  const height = Math.max(1, Math.round(node.size.height));
  const escapedName = pdfEscapeString(node.name);
  const escapedNodeId = pdfEscapeString(node.id);
  const content = [...pdfCommandsForNode(node, height, 0, 0, true), ""].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream`,
    `<< /Title (${escapedName}) /Subject (${escapedNodeId}) /Creator (Layo) >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  let pdf = "%PDF-1.4\n% Layo selected layer export\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = encoder.encode(pdf).length;
  const xrefRows = ["0000000000 65535 f ", ...offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n `)];
  pdf += [
    "xref",
    `0 ${objects.length + 1}`,
    ...xrefRows,
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R /Info 5 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
    ""
  ].join("\n");
  return pdf;
}
