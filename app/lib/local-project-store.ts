import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSeedProject, isDemoProject, type DemoProject } from "./project-types";

const dataDirectory = path.join(process.cwd(), ".local-data");
const projectPath = path.join(dataDirectory, "senimscope-demo.json");
let writeQueue: Promise<void> = Promise.resolve();

async function writeAtomically(project: DemoProject) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryPath = `${projectPath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(project, null, 2), { encoding: "utf8", flag: "wx" });
  await rename(temporaryPath, projectPath);
}

export async function loadProject(): Promise<DemoProject> {
  try {
    const file = await readFile(projectPath, "utf8");
    const parsed: unknown = JSON.parse(file);
    if (isDemoProject(parsed)) return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const seed = createSeedProject();
  await saveProject(seed);
  return seed;
}

export function saveProject(project: DemoProject): Promise<void> {
  const nextWrite = writeQueue.then(() => writeAtomically(project));
  writeQueue = nextWrite.catch(() => undefined);
  return nextWrite;
}
