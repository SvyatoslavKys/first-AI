import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "first-ai-consumer-"));
const temporaryNpmCache = path.join(temporaryRoot, ".npm-cache");

function run(command, args, cwd = repositoryRoot, capture = false) {
  return execFileSync(command, args, {
    cwd,
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit"
  });
}

function linkDependency(name) {
  const source = path.join(repositoryRoot, "node_modules", ...name.split("/"));
  const destination = path.join(temporaryRoot, "node_modules", ...name.split("/"));

  if (!existsSync(source)) {
    throw new Error(`Missing local dependency ${name}. Run npm install first.`);
  }

  if (existsSync(destination)) return;
  mkdirSync(path.dirname(destination), { recursive: true });
  symlinkSync(source, destination, "junction");
}

try {
  console.log("Building the publishable React package...");
  run("npm", ["run", "build:widget"]);

  console.log("Creating an npm archive...");
  const packOutput = run(
    "npm",
    [
      "pack",
      "--workspace",
      "@first-ai/assistant-react",
      "--pack-destination",
      temporaryRoot,
      "--cache",
      temporaryNpmCache
    ],
    repositoryRoot,
    true
  );
  const archiveName = packOutput.trim().split(/\r?\n/).at(-1);
  if (!archiveName) throw new Error("npm pack did not return an archive name.");
  const archivePath = path.join(temporaryRoot, archiveName);

  writeFileSync(
    path.join(temporaryRoot, "package.json"),
    JSON.stringify({ name: "first-ai-external-consumer", private: true }, null, 2)
  );

  console.log("Installing the archive outside npm workspaces...");
  run(
    "npm",
    [
      "install",
      archivePath,
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      "--legacy-peer-deps",
      "--cache",
      temporaryNpmCache
    ],
    temporaryRoot
  );

  ["react", "react-dom", "@types/react", "@types/react-dom"].forEach(linkDependency);

  writeFileSync(
    path.join(temporaryRoot, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        useDefineForClassFields: true,
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "Bundler",
        allowImportingTsExtensions: false,
        allowArbitraryExtensions: true,
        strict: true,
        noEmit: true,
        jsx: "react-jsx",
        skipLibCheck: true
      },
      include: ["consumer.tsx"]
    }, null, 2)
  );

  writeFileSync(
    path.join(temporaryRoot, "consumer.tsx"),
    `import { AiAssistant } from "@first-ai/assistant-react";
import "@first-ai/assistant-react/styles.css";
import type {
  AssistantColorScheme,
  AssistantEvent,
  AssistantProjectData
} from "@first-ai/assistant-react";

const project: AssistantProjectData = {
  schemaVersion: 1,
  id: "consumer-test",
  name: "Consumer test",
  type: "website",
  description: "An isolated package consumer.",
  purpose: "Verify the public package contract.",
  capabilities: [],
  goals: [],
  services: [],
  faq: [],
  pages: [],
  contacts: []
};

const colors: AssistantColorScheme = {
  light: { primary: "#615fe8" },
  dark: { primary: "#8b88ff", surfaceSolid: "#11162a" }
};

export function ConsumerAssistant() {
  return (
    <AiAssistant
      siteId={project.id}
      project={project}
      transport={async () => "External consumer response"}
      locale="uk"
      theme="auto"
      colors={colors}
      launcherIcon={<span aria-hidden="true">AI</span>}
      showLanguageSelector={false}
      eventDelivery={{ type: "backend", endpoint: "/assistant-events" }}
      onEvent={(event: AssistantEvent) => console.log(event.type)}
    />
  );
}
`
  );

  console.log("Type-checking a standalone JSX integration...");
  run(
    path.join(repositoryRoot, "node_modules", ".bin", "tsc"),
    ["--project", path.join(temporaryRoot, "tsconfig.json")],
    temporaryRoot
  );

  const installedPackage = path.join(
    temporaryRoot,
    "node_modules",
    "@first-ai",
    "assistant-react"
  );
  const requiredFiles = [
    "dist/index.js",
    "dist/index.d.ts",
    "dist/styles.css",
    "project.schema.json",
    "README.md"
  ];

  for (const requiredFile of requiredFiles) {
    if (!existsSync(path.join(installedPackage, requiredFile))) {
      throw new Error(`Published package is missing ${requiredFile}.`);
    }
  }

  JSON.parse(readFileSync(path.join(installedPackage, "project.schema.json"), "utf8"));
  const publicModule = await import(
    pathToFileURL(path.join(installedPackage, "dist", "index.js")).href
  );
  if (typeof publicModule.AiAssistant !== "function") {
    throw new Error("AiAssistant is not exported by the installed package.");
  }

  console.log("External consumer smoke test passed.");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
