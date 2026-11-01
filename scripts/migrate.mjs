// Applies database migrations during the build. Neon suspends idle databases and the first
// connection has to wake them, which can take longer than Prisma's 5-second default. Give the
// connection more time, and retry a couple of times if the database still can't be reached.
import { spawnSync } from "node:child_process";

const ATTEMPTS = 3;
const WAIT_MS = 10_000;

// Add a longer connect timeout to the migration URL unless one is already set.
for (const key of ["DATABASE_URL_UNPOOLED", "DATABASE_URL"]) {
  const value = process.env[key];
  if (!value || /[?&]connect_timeout=/.test(value)) continue;
  process.env[key] = `${value}${value.includes("?") ? "&" : "?"}connect_timeout=30`;
}

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { encoding: "utf8", env: process.env });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.status === 0) process.exit(0);

  const unreachable = /P1001|P1002|Can't reach database server/.test(`${result.stdout}${result.stderr}`);
  if (!unreachable || attempt === ATTEMPTS) process.exit(result.status ?? 1);
  console.log(`Database not reachable yet (attempt ${attempt}/${ATTEMPTS}); it may be waking up. Retrying in ${WAIT_MS / 1000}s…`);
  await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
}
