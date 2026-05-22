import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["./node_modules/vite/bin/vite.js", "build", "--mode", "devvit"], {
  stdio: "inherit",
  env: {
    ...process.env,
    BUILD_TARGET: "server"
  }
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
