import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

export default {
  input: 'src/functions/feed.js',
  output: {
    file: 'functions/feed.js',
    format: 'cjs',
    exports: 'named'
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json()
  ]
}
