import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const prefix = (process.env.NEXT_PUBLIC_ASSET_PREFIX ?? '').replace(/^\/+|\/+$/g, '');
const output = 'dist/client';

if (prefix) {
  const nestedAssets = join(output, prefix, '_next');
  const publicAssets = join(output, '_next');
  await rm(publicAssets, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await rename(nestedAssets, publicAssets);
  await rm(join(output, prefix), { recursive: true, force: true });
}

await writeFile(join(output, '.nojekyll'), '');
