// Downloads all exercise images into public/exercise-images so the app doesn't
// depend on GitHub for images. Afterwards set
// NEXT_PUBLIC_EXERCISE_IMAGE_BASE="/exercise-images" and rebuild.
import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import exercises from "../data/exercises.json" with { type: "json" };

const SOURCE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
const OUT = join(import.meta.dirname, "..", "public", "exercise-images");
const paths = exercises.flatMap((e) => e.images);

let done = 0;
async function fetchOne(path) {
  const file = join(OUT, path);
  try { await access(file); done++; return; } catch {}
  const res = await fetch(`${SOURCE}/${path}`);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  if (++done % 100 === 0) console.log(`${done}/${paths.length}`);
}

const queue = [...paths];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) await fetchOne(queue.shift()).catch((e) => console.error(e.message));
}));
console.log(`Done: ${done}/${paths.length} images in public/exercise-images`);
