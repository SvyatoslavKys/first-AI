import { build } from "esbuild";

const result = await build({
  entryPoints: ["test/locales.test.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  logLevel: "silent"
});
const source = result.outputFiles[0].text;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;

await import(moduleUrl);
