import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const dir = mkdtempSync(join(tmpdir(), "yazio-auth-second-401-"));
const cache = join(dir, "token.json");
process.env.YAZIO_TOKEN_PATH = cache;
process.env.YAZIO_USERNAME = "test@example.com";
process.env.YAZIO_PASSWORD = "test-password";
delete process.env.YAZIO_ACCESS_TOKEN;

writeFileSync(cache, JSON.stringify({
  token_type: "Bearer",
  access_token: "old-token",
  refresh_token: "",
  expires_in: 3600,
  expires_at: Date.now() + 3_600_000,
}));

const { getClient } = await import("../src/yazio-client.ts");

test("a second 401 stops after one fresh login and identifies an API rejection", async () => {
  const originalFetch = globalThis.fetch;
  let logins = 0;
  let reads = 0;
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    if (path === "/v15/oauth/token") {
      logins++;
      return Response.json({ token_type: "Bearer", access_token: "new-token", refresh_token: "", expires_in: 3600 });
    }
    if (path === "/v15/user/widgets/daily-summary") {
      reads++;
      return new Response("", { status: 401, statusText: "Unauthorized" });
    }
    throw new Error(`Unexpected request: ${path}`);
  };

  try {
    await assert.rejects(getClient().user.getDailySummary(), /freshly issued token/);
    assert.equal(logins, 1);
    assert.equal(reads, 2);
  } finally {
    globalThis.fetch = originalFetch;
    rmSync(dir, { recursive: true, force: true });
  }
});
