import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createReplaySnapshot } from './cemetery.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const files = ['index.html', 'app.js', 'demo-director.mjs', 'styles.css'];
const cemeterySource = path.join(root, 'data', 'cemetery.json');

const cemetery = JSON.parse(await readFile(cemeterySource, 'utf8'));

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'data'), { recursive: true });
await Promise.all(files.map((file) => copyFile(path.join(root, file), path.join(dist, file))));
const replay = createReplaySnapshot(cemetery);
await writeFile(path.join(dist, 'data', 'cemetery.json'), `${JSON.stringify(replay, null, 2)}\n`, 'utf8');
console.log(`Built ${files.length + 1} files in dist/.`);
