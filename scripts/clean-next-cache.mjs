import { existsSync, lstatSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

const workspace = resolve(process.cwd());
const cache = resolve(workspace, ".next");

if (dirname(cache) !== workspace) {
  throw new Error(`Refusing to clean an unexpected cache path: ${cache}`);
}

if (!existsSync(cache)) {
  console.log(`Next.js cache is already clean: ${cache}`);
  process.exit(0);
}

if (lstatSync(cache).isSymbolicLink()) {
  throw new Error(`Refusing to remove a symbolic-link cache path: ${cache}`);
}

rmSync(cache, { recursive: true, force: true });
console.log(`Removed generated Next.js cache: ${cache}`);
