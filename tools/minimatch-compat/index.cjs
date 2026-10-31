/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS adapter for ESLint plugins. */
// Older ESLint plugins call the CommonJS export directly; newer consumers use
// named exports. Delegate both APIs to the patched upstream implementation.
const upstream = require("minimatch-patched");
module.exports = Object.assign(upstream.minimatch, upstream);
// eslint-plugin-import uses makeRe() only for its .test(path) method. v11
// removed regex generation; retain that interface using its bounded matcher.
module.exports.makeRe = (pattern, options) => {
  const matcher = new upstream.Minimatch(pattern, options);
  return { test: (path) => matcher.match(path) };
};
