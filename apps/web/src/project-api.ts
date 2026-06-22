import { apiUrl } from "./api-base";

export interface ProjectDocumentSummary {
  documentId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectSharing =
  | { mode: "private" }
  | { mode: "team"; teamId: string };

export interface ProjectManifest {
  schemaVersion: 1;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentDocumentId: string;
  documents: ProjectDocumentSummary[];
  sharing: ProjectSharing;
}

export async function fetchProjects(fetcher: typeof fetch = fetch): Promise<ProjectManifest[]> {
  const response = await fetcher(apiUrl("/projects"));
  const payload = await readJson(response);
  return (payload as { projects: ProjectManifest[] }).projects;
}

export async function createProject(
  input: { name?: string; projectId?: string; documentId?: string; documentName?: string },
  fetcher: typeof fetch = fetch
): Promise<ProjectManifest> {
  return writeProject(apiUrl("/projects"), "POST", input, fetcher);
}

export async function updateProject(
  projectId: string,
  input: { name?: string; currentDocumentId?: string },
  fetcher: typeof fetch = fetch
): Promise<ProjectManifest> {
  return writeProject(apiUrl(`/projects/${projectId}`), "PATCH", input, fetcher);
}

export async function duplicateProject(
  projectId: string,
  input: { projectId?: string; name?: string; documentIdPrefix?: string },
  fetcher: typeof fetch = fetch
): Promise<ProjectManifest> {
  return writeProject(apiUrl(`/projects/${projectId}/duplicate`), "POST", input, fetcher);
}

export async function setProjectSharing(
  projectId: string,
  sharing: ProjectSharing,
  fetcher: typeof fetch = fetch
): Promise<ProjectManifest> {
  return writeProject(apiUrl(`/projects/${projectId}/sharing`), "PATCH", sharing, fetcher);
}

export async function deleteProject(
  projectId: string,
  fetcher: typeof fetch = fetch
): Promise<ProjectManifest> {
  return writeProject(apiUrl(`/projects/${projectId}`), "DELETE", undefined, fetcher);
}

async function writeProject(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body: unknown,
  fetcher: typeof fetch
): Promise<ProjectManifest> {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const response = await fetcher(url, init);
  const payload = await readJson(response);
  return (payload as { project: ProjectManifest }).project;
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`프로젝트 요청 실패: ${response.status} ${response.statusText}`.trim());
  }
  return response.json();
}
