import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { readVersions, validateVersions } from "./check-version.mjs";

async function createFixture({
  packageVersion = "0.1.0",
  cargoVersion = "0.1.0",
  tauriVersion = "0.1.0",
} = {}) {
  const root = await mkdtemp(join(tmpdir(), "agentpalette-version-"));
  await mkdir(join(root, "src-tauri"));
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ name: "agentpalette", version: packageVersion }),
  );
  await writeFile(
    join(root, "src-tauri", "Cargo.toml"),
    `[package]\nname = "agent_palette"\nversion = "${cargoVersion}"\n`,
  );
  await writeFile(
    join(root, "src-tauri", "tauri.conf.json"),
    JSON.stringify({ productName: "AgentPalette", version: tauriVersion }),
  );
  return root;
}

test("reads the three application versions", async (context) => {
  const root = await createFixture();
  context.after(() => rm(root, { recursive: true, force: true }));

  assert.deepEqual(await readVersions(root), {
    packageVersion: "0.1.0",
    cargoVersion: "0.1.0",
    tauriVersion: "0.1.0",
  });
});

test("accepts consistent versions and a matching release tag", () => {
  const versions = {
    packageVersion: "0.1.0",
    cargoVersion: "0.1.0",
    tauriVersion: "0.1.0",
  };

  assert.equal(validateVersions(versions), "0.1.0");
  assert.equal(validateVersions(versions, "v0.1.0"), "0.1.0");
});

test("rejects a manifest version mismatch", () => {
  assert.throws(
    () =>
      validateVersions({
        packageVersion: "0.1.0",
        cargoVersion: "0.1.1",
        tauriVersion: "0.1.0",
      }),
    /Version mismatch/,
  );
});

test("rejects a release tag that does not match the manifests", () => {
  assert.throws(
    () =>
      validateVersions(
        {
          packageVersion: "0.1.0",
          cargoVersion: "0.1.0",
          tauriVersion: "0.1.0",
        },
        "v0.2.0",
      ),
    /does not match application version/,
  );
});
