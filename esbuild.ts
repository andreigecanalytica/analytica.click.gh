import { build } from 'esbuild';

async function run() {
  await Promise.all([
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
  ]);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
