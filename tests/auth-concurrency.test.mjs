import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const dir = mkdtempSync(join(tmpdir(), "yazio-auth-concurrency-"));
process.env.YAZIO_TOKEN_PATH = join(dir, "token.json");
process.env.YAZIO_USERNAME = "test@example.com";
process.env.YAZIO_PASSWORD = "test-password";
delete process.env.YAZIO_ACCESS_TOKEN;

// A stale cache in the package's millisecond format must be ignored.
writeFileSync(process.env.YAZIO_TOKEN_PATH, JSON.stringify({
  token_type: "Bearer",
  access_token: "expired-token",
  refresh_token: "",
  expires_in: 3600,
  expires_at: Date.now() - 1000,
}));

const { getClient } = await import("../src/yazio-client.ts");

test("parallel reads share one login and do not use an expired cached token", async () => {
  const originalFetch = globalThis.fetch;
  let logins = 0;
  let reads = 0;
  globalThis.fetch = async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === "/v15/oauth/token") {
      logins++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return Response.json({ token_type: "Bearer", access_token: "new-token", refresh_token: "", expires_in: 3600 });
    }
    if (path === "/v15/user/widgets/daily-summary") {
      reads++;
      assert.equal(new Headers(init.headers).get("Authorization"), "Bearer new-token");
      return Response.json({ ok: true });
    }
    throw new Error(`Unexpected request: ${path}`);
  };

  try {
    const client = getClient();
    await Promise.all(Array.from({ length: 7 }, () => client.user.getDailySummary()));
    assert.equal(logins, 1);
    assert.equal(reads, 7);
  } finally {
    globalThis.fetch = originalFetch;
    rmSync(dir, { recursive: true, force: true });
  }
});
