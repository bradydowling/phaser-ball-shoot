import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import url from '@rollup/plugin-url';
import alias from '@rollup/plugin-alias';
import strip from '@rollup/plugin-strip';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife', // suitable for <script> tags
    sourcemap: !production,
  },
  plugins: [
    resolve(),
    commonjs(),
    alias({
      entries: {
        phaser: './node_modules/phaser/src/phaser',
      },
    }),
    url({
      include: '**/assets/**/*',
      fileName: '[name].[hash][extname]',
      limit: 0,
    }),
    production && strip(),
    production && terser(), // minify, but only in production
  ],
};
