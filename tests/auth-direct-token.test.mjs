import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const dir = mkdtempSync(join(tmpdir(), "yazio-auth-direct-"));
process.env.YAZIO_TOKEN_PATH = join(dir, "token.json");
process.env.YAZIO_ACCESS_TOKEN = "rejected-token";
delete process.env.YAZIO_USERNAME;
delete process.env.YAZIO_PASSWORD;

const { authorizedFetch } = await import("../src/yazio-client.ts");

test("a rejected token-only session gives an actionable error without repeating writes", async () => {
  const originalFetch = globalThis.fetch;
  let writes = 0;
  globalThis.fetch = async () => {
    writes++;
    return new Response("", { status: 401, statusText: "Unauthorized" });
  };

  try {
    await assert.rejects(
      authorizedFetch("/user/consumed-items", { method: "POST", body: "{}" }),
      /Replace it or configure YAZIO_USERNAME/
    );
    assert.equal(writes, 1);
  } finally {
    globalThis.fetch = originalFetch;
    rmSync(dir, { recursive: true, force: true });
  }
});
