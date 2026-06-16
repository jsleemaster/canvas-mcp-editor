import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { FileStorage } from "./storage.js";

interface DesignNode {
  id: string;
  children?: DesignNode[];
}

interface DesignPage {
  children?: DesignNode[];
}

interface DesignFile {
  id: string;
  name: string;
  pages: DesignPage[];
}

function countNodes(nodes: DesignNode[] = []): number {
  return nodes.reduce((total, node) => total + 1 + countNodes(node.children), 0);
}

export function createMcpServer(storage = new FileStorage()) {
  const server = new McpServer({
    name: "canvas-mcp-editor",
    version: "0.1.0"
  });

  server.registerTool(
    "list_files",
    {
      description: "List local Canvas MCP Editor design files available to inspect.",
      inputSchema: {}
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await storage.listFiles(), null, 2)
        }
      ]
    })
  );

  server.registerTool(
    "get_file_metadata",
    {
      description: "Get page and node counts for a local design file.",
      inputSchema: {
        fileId: z.string().describe("Design file id returned by list_files")
      }
    },
    async ({ fileId }) => {
      const file = (await storage.readFile(fileId)) as DesignFile;
      const nodeCount = file.pages.reduce((total, page) => total + countNodes(page.children), 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: file.id,
                name: file.name,
                pageCount: file.pages.length,
                nodeCount
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_design_context",
    {
      description: "Return the raw document JSON for a design file so an agent can inspect pages and nodes.",
      inputSchema: {
        fileId: z.string().describe("Design file id returned by list_files")
      }
    },
    async ({ fileId }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await storage.readFile(fileId), null, 2)
        }
      ]
    })
  );

  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
