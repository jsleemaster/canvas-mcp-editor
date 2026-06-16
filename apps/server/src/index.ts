import { createHttpServer } from "./http.js";

const port = Number(process.env.PORT ?? 4317);
const host = process.env.HOST ?? "127.0.0.1";
const server = createHttpServer();

await server.listen({ host, port });
