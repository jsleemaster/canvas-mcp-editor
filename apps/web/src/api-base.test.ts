import { describe, expect, test } from "vitest";
import { apiUrl, resolveApiBaseUrl } from "./api-base";

describe("api base url", () => {
  test("uses the local API server during dev by default", () => {
    expect(resolveApiBaseUrl({ DEV: true })).toBe("http://127.0.0.1:4317");
  });

  test("uses same-origin requests for production builds by default", () => {
    expect(resolveApiBaseUrl({ DEV: false })).toBe("");
  });

  test("uses an explicit API base URL without trailing slashes", () => {
    expect(
      resolveApiBaseUrl({
        DEV: false,
        VITE_API_BASE_URL: "https://canvas-api.example.com///"
      })
    ).toBe("https://canvas-api.example.com");
  });

  test("builds normalized API paths", () => {
    expect(apiUrl("/projects")).toMatch(/\/projects$/);
    expect(apiUrl("projects")).toMatch(/\/projects$/);
  });
});
