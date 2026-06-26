import type { RendererDocument } from "@layo/renderer";
import { apiUrl } from "./api-base";

export function parseDocumentPayload(payload: unknown): RendererDocument {
  if (!payload || typeof payload !== "object" || !("file" in payload)) {
    throw new Error("문서 응답에 파일이 없습니다");
  }

  return (payload as { file: RendererDocument }).file;
}

export async function exportDesignTokensDtcg(fileId: string, fetcher: typeof fetch = fetch): Promise<unknown> {
  const response = await fetcher(apiUrl(`/files/${fileId}/tokens/dtcg`));
  const payload = await readDocumentJson(response);
  return (payload as { tokens: unknown }).tokens;
}

export async function importDesignTokensDtcg(
  fileId: string,
  tokens: unknown,
  fetcher: typeof fetch = fetch
): Promise<RendererDocument> {
  const response = await fetcher(apiUrl(`/files/${fileId}/tokens/dtcg`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokens)
  });
  return parseDocumentPayload(await readDocumentJson(response));
}

async function readDocumentJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`문서 요청 실패: ${response.status} ${response.statusText}`.trim());
  }
  return response.json();
}
