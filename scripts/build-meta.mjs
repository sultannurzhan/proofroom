import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
let commit = 'uncommitted';
try {
  commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {}
writeFileSync(
  'dist/build-meta.json',
  JSON.stringify({ app: 'Proofroom', commit }, null, 2) + '\n',
);
