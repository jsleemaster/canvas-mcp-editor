import { z } from "zod";

export interface CollaborationPresence {
  userId: string;
  displayName: string;
  color: string;
  selectedNodeId: string | null;
  cursor: { x: number; y: number } | null;
  activeTool: string | null;
}

const presenceSchema = z.object({
  userId: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  color: z.string().trim().min(1),
  selectedNodeId: z.string().nullable().default(null),
  cursor: z
    .object({
      x: z.number(),
      y: z.number()
    })
    .nullable()
    .default(null),
  activeTool: z.string().nullable().default(null)
});

export function createPresenceState(input: Partial<CollaborationPresence>): CollaborationPresence {
  return presenceSchema.parse({
    selectedNodeId: null,
    cursor: null,
    activeTool: null,
    ...input
  });
}

export function summarizeAwarenessStates(states: unknown[]): CollaborationPresence[] {
  return states.flatMap((state) => {
    const parsed = presenceSchema.safeParse(state);
    return parsed.success ? [parsed.data] : [];
  });
}
