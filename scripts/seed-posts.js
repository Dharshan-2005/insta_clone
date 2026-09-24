const { spawnSync } = require('child_process');
const path = require('path');

const npm = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npm, ['ts-node', 'prisma/seed.ts'], {
  cwd: path.resolve(__dirname, '../services/post-service'),
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
