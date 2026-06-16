import Fastify from "fastify";
import { FileStorage } from "./storage.js";

export function createHttpServer(storage = new FileStorage()) {
  const server = Fastify({ logger: true });

  server.addHook("onRequest", async (_request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
  });

  server.get("/health", async () => ({ ok: true }));

  server.get("/files", async () => {
    return { files: await storage.listFiles() };
  });

  server.get<{ Params: { fileId: string } }>("/files/:fileId", async (request) => {
    return { file: await storage.readFile(request.params.fileId) };
  });

  return server;
}
