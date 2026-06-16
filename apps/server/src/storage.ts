import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { sampleDocument } from "./sample-document.js";

export interface StoredFileSummary {
  id: string;
  name: string;
  path: string;
  modifiedAt: string;
}

export class FileStorage {
  constructor(private readonly rootDir = path.join(process.cwd(), ".canvas-mcp-editor")) {}

  private get filesDir() {
    return path.join(this.rootDir, "files");
  }

  async ensureSeedFile() {
    await mkdir(this.filesDir, { recursive: true });
    const filePath = path.join(this.filesDir, `${sampleDocument.id}.json`);

    try {
      await stat(filePath);
    } catch {
      await writeFile(filePath, `${JSON.stringify(sampleDocument, null, 2)}\n`, "utf8");
    }
  }

  async listFiles(): Promise<StoredFileSummary[]> {
    await this.ensureSeedFile();
    const entries = await readdir(this.filesDir);
    const files = entries.filter((entry) => entry.endsWith(".json"));

    return Promise.all(
      files.map(async (entry) => {
        const filePath = path.join(this.filesDir, entry);
        const raw = await readFile(filePath, "utf8");
        const document = JSON.parse(raw) as { id: string; name: string };
        const info = await stat(filePath);

        return {
          id: document.id,
          name: document.name,
          path: filePath,
          modifiedAt: info.mtime.toISOString()
        };
      })
    );
  }

  async readFile(fileId: string): Promise<unknown> {
    await this.ensureSeedFile();
    const safeFileId = fileId.replace(/[^a-zA-Z0-9_-]/g, "");
    const filePath = path.join(this.filesDir, `${safeFileId}.json`);
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  }
}
