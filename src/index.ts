// src/index.ts
import { transformSync } from 'esbuild';

export function parse<T = any>(tsn: string): T {
  const wrapped = `export default ${tsn}`;
  const result = transformSync(wrapped, { loader: 'ts', format: 'cjs' });
  const fn = new Function('exports', result.code);
  const exports: any = {};
  fn(exports);
  return exports.default;
}

export function stringify(obj: any): string {
  return JSON.stringify(obj, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/,\n/g, '\n');
}

