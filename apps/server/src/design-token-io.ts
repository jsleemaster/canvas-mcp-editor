import type { DesignToken } from "./storage.js";

type JsonRecord = Record<string, unknown>;

const DTCG_TOKEN_SET = "global";

export function exportColorTokensToDtcg(tokens: DesignToken[]): JsonRecord {
  const root: JsonRecord = {
    $metadata: {
      tokenSetOrder: [DTCG_TOKEN_SET],
      activeThemes: []
    },
    [DTCG_TOKEN_SET]: {}
  };
  const tokenSet = root[DTCG_TOKEN_SET] as JsonRecord;

  for (const token of tokens) {
    if (token.type !== "color" || !token.value.trim()) {
      continue;
    }

    const path = tokenNamePath(token);
    let cursor = tokenSet;
    for (const segment of path.slice(0, -1)) {
      const existing = cursor[segment];
      if (!isRecord(existing) || "$value" in existing) {
        cursor[segment] = {};
      }
      cursor = cursor[segment] as JsonRecord;
    }
    cursor[path[path.length - 1]] = {
      $type: "color",
      $value: token.value
    };
  }

  return root;
}

export function importColorTokensFromDtcg(input: unknown): DesignToken[] {
  if (!isRecord(input)) {
    throw new Error("DTCG token document must be an object");
  }

  const tokens: DesignToken[] = [];
  const seenIds = new Map<string, number>();
  const tokenSetRoots = Object.entries(input)
    .filter(([key, value]) => !key.startsWith("$") && isRecord(value))
    .map(([, value]) => value as JsonRecord);
  const roots = tokenSetRoots.length ? tokenSetRoots : [input];

  for (const root of roots) {
    collectColorTokens(root, [], inheritedTokenType(root), tokens, seenIds);
  }

  return tokens;
}

function collectColorTokens(
  node: JsonRecord,
  path: string[],
  inheritedType: string | null,
  tokens: DesignToken[],
  seenIds: Map<string, number>
) {
  const ownType = inheritedTokenType(node) ?? inheritedType;
  if ("$value" in node) {
    const value = node.$value;
    if (ownType === "color" && typeof value === "string" && value.trim() && path.length) {
      const baseId = slugifyTokenPath(path);
      const seenCount = seenIds.get(baseId) ?? 0;
      seenIds.set(baseId, seenCount + 1);
      tokens.push({
        id: seenCount === 0 ? baseId : `${baseId}-${seenCount + 1}`,
        name: path.join(" / "),
        type: "color",
        value
      });
    }
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$") || !isRecord(value)) {
      continue;
    }
    collectColorTokens(value, [...path, key], ownType, tokens, seenIds);
  }
}

function inheritedTokenType(node: JsonRecord): string | null {
  return typeof node.$type === "string" ? node.$type : null;
}

function tokenNamePath(token: DesignToken): string[] {
  const segments = token.name
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length) {
    return segments;
  }
  return [token.id || "Token"];
}

function slugifyTokenPath(path: string[]): string {
  const slug = path
    .join("-")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return `color-${slug || "token"}`;
}

function isRecord(input: unknown): input is JsonRecord {
  return Boolean(input && typeof input === "object" && !Array.isArray(input));
}
