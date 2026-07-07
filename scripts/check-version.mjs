import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function readCargoPackageVersion(cargoToml) {
  const packageSection = cargoToml.match(
    /^\[package\]\s*$([\s\S]*?)(?=^\[|$\s*(?![\s\S]))/m,
  );
  const version = packageSection?.[1].match(/^version\s*=\s*"([^"]+)"\s*$/m);
  if (!version) {
    throw new Error("Could not read package.version from src-tauri/Cargo.toml");
  }
  return version[1];
}

export async function readVersions(rootDir) {
  const [packageJson, cargoToml, tauriConfig] = await Promise.all([
    readFile(resolve(rootDir, "package.json"), "utf8"),
    readFile(resolve(rootDir, "src-tauri/Cargo.toml"), "utf8"),
    readFile(resolve(rootDir, "src-tauri/tauri.conf.json"), "utf8"),
  ]);

  return {
    packageVersion: JSON.parse(packageJson).version,
    cargoVersion: readCargoPackageVersion(cargoToml),
    tauriVersion: JSON.parse(tauriConfig).version,
  };
}

export function validateVersions(versions, tag) {
  const entries = Object.entries(versions);
  const canonicalVersion = versions.packageVersion;
  const mismatches = entries.filter(([, version]) => version !== canonicalVersion);

  if (!canonicalVersion || mismatches.length > 0) {
    const summary = entries.map(([name, version]) => `${name}=${version}`).join(", ");
    throw new Error(`Version mismatch: ${summary}`);
  }

  if (tag) {
    if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
      throw new Error(`Invalid release tag: ${tag}`);
    }
    if (tag.slice(1) !== canonicalVersion) {
      throw new Error(
        `Release tag ${tag} does not match application version ${canonicalVersion}`,
      );
    }
  }

  return canonicalVersion;
}

async function main() {
  const versions = await readVersions(process.cwd());
  const version = validateVersions(versions, process.env.RELEASE_TAG);
  console.log(`Version ${version} is consistent.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
