import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

test("installable PWA manifest references real icons and offline shell assets", async () => {
  const manifest = JSON.parse(await readFile("public/manifest.webmanifest", "utf8")) as {
    start_url: string;
    display: string;
    icons: { src: string; sizes: string; type: string; purpose: string }[];
  };
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));

  for (const icon of manifest.icons) {
    assert.equal(icon.type, "image/png");
    const file = `public${icon.src}`;
    const [bytes, metadata] = await Promise.all([readFile(file), stat(file)]);
    assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.ok(metadata.size > 500);
  }

  const serviceWorker = await readFile("public/sw.js", "utf8");
  assert.match(serviceWorker, /\/offline\.html/);
  assert.match(serviceWorker, /\/icon-192\.png/);
  assert.match(serviceWorker, /\/icon-512\.png/);
});
