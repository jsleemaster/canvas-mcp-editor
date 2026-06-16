import { z } from "zod";

export interface TeamMember {
  userId: string;
  displayName: string;
  color: string;
}

export interface TeamDocumentSummary {
  documentId: string;
  name: string;
  updatedAt: string;
}

export type TeamSyncConfig =
  | {
      mode: "local";
      roomPrefix: string;
    }
  | {
      mode: "websocket";
      roomPrefix: string;
      relayUrl: string;
      token?: string;
    };

export interface TeamPermissions {
  canEdit: boolean;
  canInvite: boolean;
}

export interface TeamManifest {
  schemaVersion: 1;
  teamId: string;
  name: string;
  createdAt: string;
  currentUserId: string;
  members: TeamMember[];
  documents: TeamDocumentSummary[];
  sync: TeamSyncConfig;
  permissions: TeamPermissions;
}

export interface CreateTeamManifestInput {
  name: string;
  currentUser: TeamMember;
  teamId?: string;
  createdAt?: string;
  documents?: TeamDocumentSummary[];
  sync?: Partial<TeamSyncConfig> & { mode: TeamSyncConfig["mode"] };
  permissions?: Partial<TeamPermissions>;
}

const teamMemberSchema = z.object({
  userId: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  color: z.string().trim().min(1)
});

const teamDocumentSummarySchema = z.object({
  documentId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1)
});

const teamSyncConfigSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("local"),
    roomPrefix: z.string().trim().min(1)
  }),
  z.object({
    mode: z.literal("websocket"),
    roomPrefix: z.string().trim().min(1),
    relayUrl: z.string().trim().min(1),
    token: z.string().trim().min(1).optional()
  })
]);

const teamManifestSchema = z.object({
  schemaVersion: z.literal(1),
  teamId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  currentUserId: z.string().trim().min(1),
  members: z.array(teamMemberSchema).min(1),
  documents: z.array(teamDocumentSummarySchema),
  sync: teamSyncConfigSchema,
  permissions: z.object({
    canEdit: z.boolean(),
    canInvite: z.boolean()
  })
});

const DEFAULT_ROOM_PREFIX = "canvas-mcp-editor";

export function createTeamManifest(input: CreateTeamManifestInput): TeamManifest {
  const name = input.name.trim();
  if (!name) {
    throw new Error("team name is required");
  }

  const sync = normalizeSyncConfig(input.sync);
  const team: TeamManifest = {
    schemaVersion: 1,
    teamId: input.teamId ?? createId("team"),
    name,
    createdAt: input.createdAt ?? new Date().toISOString(),
    currentUserId: input.currentUser.userId,
    members: [input.currentUser],
    documents: input.documents ?? [],
    sync,
    permissions: {
      canEdit: input.permissions?.canEdit ?? true,
      canInvite: input.permissions?.canInvite ?? true
    }
  };

  return parseTeamManifest(team);
}

export function parseTeamManifest(input: unknown): TeamManifest {
  const parsed = teamManifestSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.path.join(".") || issue.message);
    throw new Error(`invalid team manifest: ${issues.join(", ")}`);
  }

  return parsed.data;
}

function normalizeSyncConfig(input: CreateTeamManifestInput["sync"]): TeamSyncConfig {
  if (!input || input.mode === "local") {
    return {
      mode: "local",
      roomPrefix: input?.roomPrefix ?? DEFAULT_ROOM_PREFIX
    };
  }

  if (!input.relayUrl) {
    throw new Error("relayUrl is required for websocket sync");
  }

  return {
    mode: "websocket",
    roomPrefix: input.roomPrefix ?? DEFAULT_ROOM_PREFIX,
    relayUrl: input.relayUrl,
    token: input.token
  };
}

function createId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}
