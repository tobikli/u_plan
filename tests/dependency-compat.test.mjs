import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const minimatch = require("minimatch");

test("patched glob matching supports legacy and named lint plugin APIs", () => {
  assert.equal(minimatch("src/app.tsx", "**/*.tsx"), true);
  assert.equal(minimatch("src/app.ts", "**/*.tsx"), false);
  assert.equal(minimatch.minimatch("src/app.tsx", "**/*.tsx"), true);
  assert.equal(new minimatch.Minimatch("**/*.tsx").match("src/app.tsx"), true);
  assert.deepEqual(minimatch.match(["a.ts", "b.js"], "*.ts"), ["a.ts"]);
  assert.equal(minimatch.makeRe("*.ts").test("a.ts"), true);
});

test("lint consumers resolve the patched implementation through the override", () => {
  for (const pkg of ["eslint", "eslint-plugin-react", "eslint-plugin-import", "@typescript-eslint/typescript-estree"]) {
    const consumer = createRequire(require.resolve(pkg));
    assert.equal(consumer("minimatch").Minimatch, minimatch.Minimatch, pkg);
  }
});
