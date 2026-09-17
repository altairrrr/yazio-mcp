import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const dir = mkdtempSync(join(tmpdir(), "yazio-auth-401-"));
const cache = join(dir, "token.json");
process.env.YAZIO_TOKEN_PATH = cache;
process.env.YAZIO_USERNAME = "test@example.com";
process.env.YAZIO_PASSWORD = "test-password";
delete process.env.YAZIO_ACCESS_TOKEN;

writeFileSync(cache, JSON.stringify({
  token_type: "Bearer",
  access_token: "revoked-token",
  refresh_token: "",
  expires_in: 3600,
  expires_at: Date.now() + 3_600_000,
}));

const { getClient, authorizedFetch } = await import("../src/yazio-client.ts");

test("a 401 on a library request renews the token and retries only that request", async () => {
  const originalFetch = globalThis.fetch;
  let logins = 0;
  let summaries = 0;
  globalThis.fetch = async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === "/v15/oauth/token") {
      logins++;
      return Response.json({ token_type: "Bearer", access_token: `fresh-token-${logins}`, refresh_token: "", expires_in: 3600 });
    }
    if (path === "/v15/user/widgets/daily-summary") {
      summaries++;
      const auth = new Headers(init.headers).get("Authorization");
      return auth === "Bearer revoked-token"
        ? new Response("", { status: 401, statusText: "Unauthorized" })
        : Response.json({ ok: true, auth });
    }
    if (path === "/v15/recipes/example") {
      const auth = new Headers(init.headers).get("Authorization");
      return auth === "Bearer fresh-token-1"
        ? new Response("", { status: 401, statusText: "Unauthorized" })
        : Response.json({ auth });
    }
    throw new Error(`Unexpected request: ${path}`);
  };

  try {
    const client = getClient();
    const summary = await client.user.getDailySummary({ date: new Date("2026-09-16") });
    assert.equal(summary.auth, "Bearer fresh-token-1");
    assert.equal(logins, 1);
    assert.equal(summaries, 2);

    // The direct-fetch path must recover independently if that token is revoked.
    const recipe = await (await authorizedFetch("/recipes/example")).json();
    assert.equal(recipe.auth, "Bearer fresh-token-2");
    assert.equal(logins, 2);
    assert.equal(readFileSync(cache, "utf8").includes("fresh-token-2"), true);
  } finally {
    globalThis.fetch = originalFetch;
    rmSync(dir, { recursive: true, force: true });
  }
});
