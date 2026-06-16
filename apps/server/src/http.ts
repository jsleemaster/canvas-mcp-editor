import Fastify from "fastify";
import { FileStorage, type DesignNode, type GeometryPatch } from "./storage.js";

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

  server.patch<{ Params: { fileId: string; nodeId: string }; Body: GeometryPatch }>(
    "/files/:fileId/nodes/:nodeId/geometry",
    async (request) => {
      return {
        node: await storage.updateNodeGeometry(
          request.params.fileId,
          request.params.nodeId,
          request.body
        )
      };
    }
  );

  server.patch<{ Params: { fileId: string; nodeId: string }; Body: { fill: string } }>(
    "/files/:fileId/nodes/:nodeId/fill",
    async (request) => {
      return {
        node: await storage.setNodeFill(
          request.params.fileId,
          request.params.nodeId,
          request.body.fill
        )
      };
    }
  );

  server.patch<{ Params: { fileId: string; nodeId: string }; Body: { value: string } }>(
    "/files/:fileId/nodes/:nodeId/text",
    async (request) => {
      return {
        node: await storage.updateText(
          request.params.fileId,
          request.params.nodeId,
          request.body.value
        )
      };
    }
  );

  server.post<{ Params: { fileId: string }; Body: { parentId: string; node: DesignNode } }>(
    "/files/:fileId/nodes",
    async (request) => {
      return {
        node: await storage.createNode(
          request.params.fileId,
          request.body.parentId,
          request.body.node
        )
      };
    }
  );

  server.get<{ Params: { fileId: string } }>("/files/:fileId/components", async (request) => {
    return { components: await storage.listComponents(request.params.fileId) };
  });

  server.post<{
    Params: { fileId: string };
    Body: { nodeId: string; componentId: string; name: string };
  }>("/files/:fileId/components", async (request) => {
    return {
      component: await storage.createComponent(request.params.fileId, request.body.nodeId, {
        componentId: request.body.componentId,
        name: request.body.name
      })
    };
  });

  server.post<{
    Params: { fileId: string };
    Body: { parentId: string; definitionId: string; instanceId: string; x: number; y: number };
  }>("/files/:fileId/component-instances", async (request) => {
    return {
      node: await storage.createComponentInstance(request.params.fileId, request.body)
    };
  });

  server.post<{ Params: { fileId: string; nodeId: string } }>(
    "/files/:fileId/nodes/:nodeId/detach",
    async (request) => {
      return {
        node: await storage.detachInstance(request.params.fileId, request.params.nodeId)
      };
    }
  );

  return server;
}
