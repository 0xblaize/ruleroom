import { spawnSync } from "node:child_process";

const steps = [
  [process.execPath, ["./node_modules/typescript/bin/tsc", "--noEmit"], process.env],
  [process.execPath, ["./node_modules/vite/bin/vite.js", "build", "--mode", "devvit"], process.env],
  [
    process.execPath,
    ["./node_modules/vite/bin/vite.js", "build", "--mode", "devvit"],
    { ...process.env, BUILD_TARGET: "server" }
  ]
];

for (const [command, args, env] of steps) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
