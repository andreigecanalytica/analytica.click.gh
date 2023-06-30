import { build } from 'esbuild';
import fs from 'fs';
import { Generator } from 'npm-dts';

async function run() {
  const r = await Promise.all([
    build({
      entryPoints: ['src/index.ts'],
      bundle: true,

      logLevel: 'debug',
      define: {
        'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
      },
      outdir: 'dist',
      platform: 'node',
      metafile: true,
      minify: process.env.NODE_ENV === 'development' ? false : true,
    }),
    new Generator({
      entry: 'types',
      output: 'dist/index.d.ts',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logLevel: 'verbose' as any,
      force: true,
    }).generate(),
  ]);

  const { metafile } = r[0];
  fs.writeFileSync('./dist/esbuild.json', JSON.stringify(metafile, null, 2));
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
