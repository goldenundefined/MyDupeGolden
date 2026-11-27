import test from "node:test";
import assert from "node:assert/strict";

test("health endpoint responds and categories include all requested types", async () => {
  const { spawn } = await import("node:child_process");
  const port = 3217;
  const child = spawn(process.execPath, ["src/server.js"], {
    env: { ...process.env, PORT: String(port), DATABASE_FILE: "./data/test.sqlite" },
    stdio: "ignore"
  });
  try {
    let response;
    for (let i = 0; i < 30; i++) {
      try { response = await fetch(`http://127.0.0.1:${port}/api/health`); break; }
      catch { await new Promise(r => setTimeout(r, 150)); }
    }
    assert.ok(response, "server should start");
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    const categories = await (await fetch(`http://127.0.0.1:${port}/api/categories`)).json();
    for (const category of ["furniture","fashion","handbags","shoes","accessories","home décor"]) {
      assert.ok(categories.categories.includes(category));
    }
  } finally { child.kill("SIGTERM"); }
});

test("search validates URLs and filters", async () => {
  const { spawn } = await import("node:child_process");
  const port = 3218;
  const child = spawn(process.execPath, ["src/server.js"], {
    env: { ...process.env, PORT: String(port), DATABASE_FILE: "./data/test-validation.sqlite" },
    stdio: "ignore"
  });
  try {
    await new Promise(r => setTimeout(r, 800));
    const bad = await fetch(`http://127.0.0.1:${port}/api/search`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-url", category: "furniture", minSavings: 20 })
    });
    assert.equal(bad.status, 400);
  } finally { child.kill("SIGTERM"); }
});
