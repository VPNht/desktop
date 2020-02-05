/* eslint-env node */
import babel from "rollup-plugin-babel";
import json from "@rollup/plugin-json";

const plugins = [babel(), json()];
const output = [];

const input = "src/index.js";

output.push(
  { file: "index.js", format: "cjs", sourcemap: true },
  { file: "index.es.js", format: "es", sourcemap: true }
);

export default {
  input,
  plugins,
  output,
  external: [
    "request",
    "request-promise-native",
    "fs",
    "path",
    "events",
    "os",
    "child_process",
    "request-progress",
    "ws"
  ]
};
