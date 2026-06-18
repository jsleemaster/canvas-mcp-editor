import { describe, expect, test } from "vitest";
import {
  createProject,
  fetchProjects,
  setProjectSharing,
  updateProject,
  type ProjectManifest
} from "./project-api";

const project: ProjectManifest = {
  schemaVersion: 1,
  projectId: "project-web",
  name: "웹 프로젝트",
  createdAt: "2026-06-17T00:00:00.000Z",
  updatedAt: "2026-06-17T00:00:00.000Z",
  currentDocumentId: "document-web",
  documents: [
    {
      documentId: "document-web",
      name: "웹 문서",
      createdAt: "2026-06-17T00:00:00.000Z",
      updatedAt: "2026-06-17T00:00:00.000Z"
    }
  ],
  sharing: { mode: "private" }
};

describe("project api", () => {
  test("fetches project list payloads", async () => {
    const fetcher = async () => new Response(JSON.stringify({ projects: [project] }), { status: 200 });

    await expect(fetchProjects(fetcher as typeof fetch)).resolves.toEqual([project]);
  });

  test("creates, renames, and shares projects", async () => {
    const requests: Array<{ url: string; body: unknown }> = [];
    const fetcher = async (url: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null });
      return new Response(JSON.stringify({ project }), { status: 200 });
    };

    await createProject({ name: "새 프로젝트" }, fetcher as typeof fetch);
    await updateProject("project-web", { name: "리네임" }, fetcher as typeof fetch);
    await setProjectSharing("project-web", { mode: "team", teamId: "team-web" }, fetcher as typeof fetch);

    expect(requests).toEqual([
      { url: "http://127.0.0.1:4317/projects", body: { name: "새 프로젝트" } },
      { url: "http://127.0.0.1:4317/projects/project-web", body: { name: "리네임" } },
      {
        url: "http://127.0.0.1:4317/projects/project-web/sharing",
        body: { mode: "team", teamId: "team-web" }
      }
    ]);
  });
});
