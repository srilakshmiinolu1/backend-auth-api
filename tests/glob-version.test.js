/**
 * Guards the pins of the glob dependency.
 *
 * GHSA-5j98-mcp5-4vw2 is a command-injection issue in the glob CLI. The
 * remediation is the version pin, so the behaviour under test is the glob
 * requirement stored in every dependency manifest in the repository and the
 * version resolved in the lockfile.
 *
 * Uses the Node built-in test runner, no dependencies are added:
 *   node --test tests/
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const FIXED_VERSION = "10.5.0";
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

/** Compares two `major.minor.patch` versions, returning -1, 0 or 1. */
function compareVersions(a, b) {
  const parts = (v) => String(v).split(".").map((n) => parseInt(n, 10) || 0);
  const left = parts(a);
  const right = parts(b);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] > right[i] ? 1 : -1;
  }
  return 0;
}

/**
 * Returns the lowest version a simple semver range can select, or null when the
 * range does not start with a concrete version (`*`, `latest`, a URL, ...).
 */
function lowerBound(spec) {
  const match = /^(?:\^|~|>=|=|v)?\s*(\d+)\.(\d+)\.(\d+)/.exec(
    String(spec).trim()
  );
  return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
}

function findPackageManifests(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === ".opencode-xdg") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findPackageManifests(full, found);
    } else if (entry.name === "package.json") {
      found.push(full);
    }
  }
  return found;
}

test("no dependency manifest pins glob below the GHSA-5j98-mcp5-4vw2 fix", () => {
  const violations = [];

  for (const file of findPackageManifests(ROOT)) {
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
      violations.push(`${path.relative(ROOT, file)} is not valid JSON: ${error.message}`);
      continue;
    }

    for (const field of DEPENDENCY_FIELDS) {
      const spec = manifest[field] && manifest[field].glob;
      if (spec === undefined) continue;
      const lower = lowerBound(spec);
      if (lower === null || compareVersions(lower, FIXED_VERSION) < 0) {
        violations.push(
          `${path.relative(ROOT, file)} ${field}.glob is ${JSON.stringify(spec)}`
        );
      }
    }
  }

  assert.deepStrictEqual(
    violations,
    [],
    `glob must not resolve below ${FIXED_VERSION}: ${violations.join(", ")}`
  );
});

test("the lockfile does not resolve glob below the GHSA-5j98-mcp5-4vw2 fix", () => {
  const lockfile = JSON.parse(
    fs.readFileSync(path.join(ROOT, "package-lock.json"), "utf8")
  );
  const violations = [];

  for (const [key, entry] of Object.entries(lockfile.packages || {})) {
    if (key !== "node_modules/glob" && !key.endsWith("/node_modules/glob")) {
      continue;
    }
    if (
      typeof entry.version === "string" &&
      compareVersions(entry.version, FIXED_VERSION) < 0
    ) {
      violations.push(`${key} is ${entry.version}`);
    }
  }

  assert.deepStrictEqual(
    violations,
    [],
    `glob must not resolve below ${FIXED_VERSION}: ${violations.join(", ")}`
  );
});