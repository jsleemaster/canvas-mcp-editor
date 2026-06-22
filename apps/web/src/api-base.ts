type ApiRuntimeEnv = {
  readonly DEV?: boolean;
  readonly VITE_API_BASE_URL?: string;
};

const LOCAL_API_BASE_URL = "http://127.0.0.1:4317";

export function resolveApiBaseUrl(env: ApiRuntimeEnv): string {
  const configuredBaseUrl = env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  return env.DEV ? LOCAL_API_BASE_URL : "";
}

const runtimeEnv = import.meta.env as ApiRuntimeEnv;
export const API_BASE_URL = resolveApiBaseUrl(runtimeEnv);

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
