/**
 * Guards the pin of the body-parser dependency.
 *
 * GHSA-27r3-jxmh-p828: body-parser >= 2.0.0 and < 2.4.0 leaves the decompression
 * stream it pipes a `Content-Encoding` request body into without an error listener,
 * so trailing bytes after a valid compressed frame are re-thrown as an uncaught
 * exception and kill the process (default `express.json()` middleware, no auth or
 * matching route required). The remediation is the version pin, so the behaviour
 * under test here is the version this repository resolves.
 *
 * Uses the Node built-in test runner, no dependencies are added:
 *   node --test tests/
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const lockfile = JSON.parse(
  fs.readFileSync(path.join(ROOT, "package-lock.json"), "utf8")
);
const packages = lockfile.packages;

/** First release patched for GHSA-27r3-jxmh-p828. */
const FIXED_VERSION = "2.4.0";
/** Advisory vulnerable range: >= 2.0.0 < 2.4.0 */
const VULNERABLE_FROM = "2.0.0";

const LOCK_KEY = "node_modules/body-parser";
const bodyParser = packages[LOCK_KEY];

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
 * `^major.minor.patch` means `>= major.minor.patch < (major+1).0.0`, which is the
 * only range style this dependency tree uses for body-parser and its deps.
 */
function satisfiesCaret(version, range) {
  const match = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
  assert.ok(match, `unsupported range in the lockfile: ${range}`);
  const major = Number(match[1]);
  const lower = `${match[1]}.${match[2]}.${match[3]}`;
  return (
    compareVersions(version, lower) >= 0 &&
    compareVersions(version, `${major + 1}.0.0`) < 0
  );
}

function isVulnerable(version) {
  return (
    compareVersions(version, VULNERABLE_FROM) >= 0 &&
    compareVersions(version, FIXED_VERSION) < 0
  );
}

test("the resolved body-parser is not in the GHSA-27r3-jxmh-p828 range", () => {
  assert.ok(bodyParser, `${LOCK_KEY} is missing from package-lock.json`);
  assert.ok(
    compareVersions(bodyParser.version, FIXED_VERSION) >= 0,
    `body-parser ${bodyParser.version} must resolve to >= ${FIXED_VERSION}`
  );
  assert.strictEqual(
    isVulnerable(bodyParser.version),
    false,
    `body-parser ${bodyParser.version} is affected: >=${VULNERABLE_FROM} <${FIXED_VERSION}`
  );
});

test("the pinned body-parser entry is the matching published release", () => {
  assert.strictEqual(
    bodyParser.resolved,
    `https://registry.npmjs.org/body-parser/-/body-parser-${bodyParser.version}.tgz`
  );
  assert.match(
    bodyParser.integrity,
    /^sha512-[A-Za-z0-9+/=]+$/,
    "the body-parser pin needs the integrity hash of the release"
  );
});

test("every dependency of the pinned body-parser resolves in the lockfile", () => {
  for (const [name, range] of Object.entries(bodyParser.dependencies || {})) {
    const candidates = [`${LOCK_KEY}/node_modules/${name}`, `node_modules/${name}`];
    const found = candidates
      .map((key) => packages[key])
      .filter((entry) => entry && typeof entry.version === "string")
      .find((entry) => satisfiesCaret(entry.version, range));
    const present = candidates.map((key) => {
      const entry = packages[key];
      return key + "=" + (entry ? entry.version : "absent");
    });
    assert.ok(
      found,
      `body-parser ${bodyParser.version} needs ${name}@${range}, the lockfile has ${present.join(", ")}`
    );
  }
});

test("the bump stays compatible with the express version the app runs", () => {
  const express = packages["node_modules/express"];
  assert.ok(express, "express is missing from package-lock.json");
  const wanted = express.dependencies["body-parser"];
  assert.ok(
    satisfiesCaret(bodyParser.version, wanted),
    `body-parser ${bodyParser.version} does not satisfy express@${express.version}'s ${wanted}`
  );
});
