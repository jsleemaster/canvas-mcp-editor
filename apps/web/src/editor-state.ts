import type { RendererDocument, RendererNode } from "@canvas-mcp-editor/renderer";

export interface EditorSelection {
  nodeId: string | null;
}

export interface EditorViewport {
  scale: number;
  x: number;
  y: number;
}

export interface EditorHistory {
  past: EditorCommand[];
  future: EditorCommand[];
}

export interface EditorState {
  document: RendererDocument;
  selection: EditorSelection;
  viewport: EditorViewport;
  history: EditorHistory;
}

export type GeometryPatch = Partial<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type EditorCommand =
  | {
      type: "update_node_geometry";
      nodeId: string;
      patch: GeometryPatch;
    }
  | {
      type: "set_fill";
      nodeId: string;
      fill: string;
    }
  | {
      type: "update_text";
      nodeId: string;
      value: string;
    }
  | {
      type: "create_node";
      parentId: string;
      node: RendererNode;
    }
  | {
      type: "delete_node";
      parentId: string;
      node: RendererNode;
    }
  | {
      type: "create_component";
      nodeId: string;
      componentId: string;
      name: string;
    }
  | {
      type: "delete_component";
      nodeId: string;
      componentId: string;
      previousNode: RendererNode;
    }
  | {
      type: "create_component_instance";
      parentId: string;
      definitionId: string;
      instanceId: string;
      x: number;
      y: number;
    }
  | {
      type: "detach_instance";
      nodeId: string;
      previousNode?: RendererNode;
    };

interface CommandResult {
  document: RendererDocument;
  inverse: EditorCommand | null;
  selectedNodeId?: string | null;
}

const MIN_NODE_SIZE = 1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

export function createEditorState(document: RendererDocument): EditorState {
  return {
    document,
    selection: { nodeId: null },
    viewport: { scale: 1, x: 0, y: 0 },
    history: { past: [], future: [] }
  };
}

export function findNodeById(document: RendererDocument, nodeId: string): RendererNode | null {
  for (const page of document.pages) {
    for (const node of page.children) {
      const found = findInNode(node, nodeId);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

export function getNodeAbsolutePosition(
  document: RendererDocument,
  nodeId: string
): { x: number; y: number } | null {
  for (const page of document.pages) {
    for (const node of page.children) {
      const found = absolutePositionInNode(node, nodeId, { x: 0, y: 0 });
      if (found) {
        return found;
      }
    }
  }

  return null;
}

export function executeEditorCommand(state: EditorState, command: EditorCommand): EditorState {
  const result = applyCommand(state.document, command);
  if (!result.inverse) {
    return state;
  }

  return {
    ...state,
    document: result.document,
    selection: {
      nodeId: result.selectedNodeId === undefined ? state.selection.nodeId : result.selectedNodeId
    },
    history: {
      past: [...state.history.past, result.inverse],
      future: []
    }
  };
}

export function undo(state: EditorState): EditorState {
  const inverse = state.history.past.at(-1);
  if (!inverse) {
    return state;
  }

  const result = applyCommand(state.document, inverse);
  if (!result.inverse) {
    return state;
  }

  return {
    ...state,
    document: result.document,
    selection: {
      nodeId:
        state.selection.nodeId && findNodeById(result.document, state.selection.nodeId)
          ? state.selection.nodeId
          : null
    },
    history: {
      past: state.history.past.slice(0, -1),
      future: [result.inverse, ...state.history.future]
    }
  };
}

export function redo(state: EditorState): EditorState {
  const command = state.history.future[0];
  if (!command) {
    return state;
  }

  const result = applyCommand(state.document, command);
  if (!result.inverse) {
    return state;
  }

  return {
    ...state,
    document: result.document,
    selection: {
      nodeId: result.selectedNodeId === undefined ? state.selection.nodeId : result.selectedNodeId
    },
    history: {
      past: [...state.history.past, result.inverse],
      future: state.history.future.slice(1)
    }
  };
}

export function setSelection(state: EditorState, nodeId: string | null): EditorState {
  return {
    ...state,
    selection: {
      nodeId: nodeId && findNodeById(state.document, nodeId) ? nodeId : null
    }
  };
}

export function setViewport(state: EditorState, patch: Partial<EditorViewport>): EditorState {
  return {
    ...state,
    viewport: {
      scale: clamp(patch.scale ?? state.viewport.scale, MIN_ZOOM, MAX_ZOOM),
      x: patch.x ?? state.viewport.x,
      y: patch.y ?? state.viewport.y
    }
  };
}

export function panViewport(state: EditorState, delta: Pick<EditorViewport, "x" | "y">): EditorState {
  return setViewport(state, {
    x: state.viewport.x + delta.x,
    y: state.viewport.y + delta.y
  });
}

export function zoomViewport(state: EditorState, delta: number): EditorState {
  return setViewport(state, {
    scale: state.viewport.scale + delta
  });
}

export function createRectangleNode(sequence: number): RendererNode {
  return {
    id: `rectangle-${sequence}`,
    kind: "rectangle",
    name: `Rectangle ${sequence}`,
    transform: { x: 180, y: 140, rotation: 0 },
    size: { width: 160, height: 96 },
    style: { fill: "#e0f2fe", stroke: "#0284c7", stroke_width: 1, opacity: 1 },
    content: { type: "empty" },
    children: []
  };
}

export function createTextNode(sequence: number): RendererNode {
  return {
    id: `text-${sequence}`,
    kind: "text",
    name: `Text ${sequence}`,
    transform: { x: 220, y: 180, rotation: 0 },
    size: { width: 220, height: 44 },
    style: { fill: "#111827", stroke: null, stroke_width: 0, opacity: 1 },
    content: {
      type: "text",
      value: "New text",
      font_size: 24,
      font_family: "Inter"
    },
    children: []
  };
}

function applyCommand(document: RendererDocument, command: EditorCommand): CommandResult {
  const next = structuredClone(document);

  switch (command.type) {
    case "update_node_geometry": {
      const node = findNodeById(next, command.nodeId);
      if (!node) {
        return { document, inverse: null };
      }

      const inverse: EditorCommand = {
        type: "update_node_geometry",
        nodeId: command.nodeId,
        patch: {
          x: node.transform.x,
          y: node.transform.y,
          width: node.size.width,
          height: node.size.height
        }
      };

      node.transform = {
        ...node.transform,
        x: command.patch.x ?? node.transform.x,
        y: command.patch.y ?? node.transform.y
      };
      node.size = {
        width: clampSize(command.patch.width ?? node.size.width),
        height: clampSize(command.patch.height ?? node.size.height)
      };

      return { document: next, inverse };
    }
    case "set_fill": {
      const node = findNodeById(next, command.nodeId);
      if (!node) {
        return { document, inverse: null };
      }

      const inverse: EditorCommand = {
        type: "set_fill",
        nodeId: command.nodeId,
        fill: node.style.fill
      };
      node.style = { ...node.style, fill: command.fill };

      return { document: next, inverse };
    }
    case "update_text": {
      const node = findNodeById(next, command.nodeId);
      if (!node || node.content.type !== "text") {
        return { document, inverse: null };
      }

      const inverse: EditorCommand = {
        type: "update_text",
        nodeId: command.nodeId,
        value: node.content.value
      };
      node.content = { ...node.content, value: command.value };

      return { document: next, inverse };
    }
    case "create_node": {
      const parent = findParentChildren(next, command.parentId);
      if (!parent) {
        return { document, inverse: null };
      }

      const node = structuredClone(command.node);
      parent.children.push(node);

      return {
        document: next,
        inverse: { type: "delete_node", parentId: command.parentId, node },
        selectedNodeId: node.id
      };
    }
    case "delete_node": {
      const parent = findParentChildren(next, command.parentId);
      if (!parent) {
        return { document, inverse: null };
      }

      const index = parent.children.findIndex((node) => node.id === command.node.id);
      if (index === -1) {
        return { document, inverse: null };
      }

      const [node] = parent.children.splice(index, 1);

      return {
        document: next,
        inverse: { type: "create_node", parentId: command.parentId, node },
        selectedNodeId: null
      };
    }
    case "create_component": {
      const node = findNodeById(next, command.nodeId);
      if (!node) {
        return { document, inverse: null };
      }

      const previousNode = structuredClone(node);
      node.kind = "component";
      node.component_instance = null;
      next.components = next.components ?? [];
      next.components.push({
        id: command.componentId,
        name: command.name,
        source_node: structuredClone(node),
        variants: [{ id: "default", name: "Default", properties: [] }]
      });

      return {
        document: next,
        inverse: {
          type: "delete_component",
          nodeId: command.nodeId,
          componentId: command.componentId,
          previousNode
        },
        selectedNodeId: command.nodeId
      };
    }
    case "delete_component": {
      replaceNodeById(next, command.nodeId, structuredClone(command.previousNode));
      next.components = (next.components ?? []).filter((component) => component.id !== command.componentId);

      return {
        document: next,
        inverse: {
          type: "create_component",
          nodeId: command.nodeId,
          componentId: command.componentId,
          name: command.previousNode.name
        },
        selectedNodeId: command.nodeId
      };
    }
    case "create_component_instance": {
      const parent = findParentChildren(next, command.parentId);
      const definition = (next.components ?? []).find(
        (component) => component.id === command.definitionId
      );
      if (!parent || !definition) {
        return { document, inverse: null };
      }

      const node = structuredClone(definition.source_node);
      renameInstanceTree(node, command.instanceId);
      node.id = command.instanceId;
      node.kind = "component_instance";
      node.name = `${definition.name} Instance`;
      node.transform = { ...node.transform, x: command.x, y: command.y };
      node.component_instance = {
        definition_id: command.definitionId,
        overrides: [],
        detached: false
      };
      parent.children.push(node);

      return {
        document: next,
        inverse: { type: "delete_node", parentId: command.parentId, node },
        selectedNodeId: node.id
      };
    }
    case "detach_instance": {
      const node = findNodeById(next, command.nodeId);
      if (!node || !node.component_instance) {
        return { document, inverse: null };
      }

      const previousNode = command.previousNode ?? structuredClone(node);
      node.kind = "frame";
      node.component_instance = null;

      return {
        document: next,
        inverse: { type: "detach_instance", nodeId: command.nodeId, previousNode },
        selectedNodeId: command.nodeId
      };
    }
  }
}

function findInNode(node: RendererNode, nodeId: string): RendererNode | null {
  if (node.id === nodeId) {
    return node;
  }

  for (const child of node.children) {
    const found = findInNode(child, nodeId);
    if (found) {
      return found;
    }
  }

  return null;
}

function absolutePositionInNode(
  node: RendererNode,
  nodeId: string,
  parent: { x: number; y: number }
): { x: number; y: number } | null {
  const current = {
    x: parent.x + node.transform.x,
    y: parent.y + node.transform.y
  };

  if (node.id === nodeId) {
    return current;
  }

  for (const child of node.children) {
    const found = absolutePositionInNode(child, nodeId, current);
    if (found) {
      return found;
    }
  }

  return null;
}

function findParentChildren(
  document: RendererDocument,
  parentId: string
): { children: RendererNode[] } | null {
  const page = document.pages.find((candidate) => candidate.id === parentId);
  if (page) {
    return page;
  }

  const node = findNodeById(document, parentId);
  return node ? { children: node.children } : null;
}

function replaceNodeById(document: RendererDocument, nodeId: string, replacement: RendererNode): boolean {
  for (const page of document.pages) {
    const index = page.children.findIndex((node) => node.id === nodeId);
    if (index !== -1) {
      page.children[index] = replacement;
      return true;
    }

    for (const node of page.children) {
      if (replaceInNode(node, nodeId, replacement)) {
        return true;
      }
    }
  }

  return false;
}

function replaceInNode(node: RendererNode, nodeId: string, replacement: RendererNode): boolean {
  const index = node.children.findIndex((child) => child.id === nodeId);
  if (index !== -1) {
    node.children[index] = replacement;
    return true;
  }

  for (const child of node.children) {
    if (replaceInNode(child, nodeId, replacement)) {
      return true;
    }
  }

  return false;
}

function renameInstanceTree(node: RendererNode, instanceId: string) {
  for (const child of node.children) {
    child.id = `${instanceId}__${child.id}`;
    renameInstanceTree(child, instanceId);
  }
}

function clampSize(value: number): number {
  return Math.max(MIN_NODE_SIZE, value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
