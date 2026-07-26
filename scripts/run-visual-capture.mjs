import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const serverUrl = "http://127.0.0.1:3108";
const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const playwrightCli = fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url));
const testArgs = process.argv.slice(2);

const server = spawn(
  process.execPath,
  [nextCli, "start", "-p", "3108"],
  { cwd: root, stdio: "inherit" },
);

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Visual-review server exited before becoming ready (${server.exitCode}).`);
    }
    try {
      const response = await fetch(serverUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Visual-review server did not become ready within 120 seconds.");
}

async function stopServer() {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([
    once(server, "exit"),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
}

let exitCode = 1;
try {
  await waitForServer();
  const runner = spawn(
    process.execPath,
    [playwrightCli, "test", "--config=playwright.visual.config.ts", ...testArgs],
    { cwd: root, stdio: "inherit" },
  );
  const [code] = await once(runner, "exit");
  exitCode = typeof code === "number" ? code : 1;
} finally {
  await stopServer();
}

process.exitCode = exitCode;
