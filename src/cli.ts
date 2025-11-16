#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify, validate } from './index.js';

const args = process.argv.slice(2);
const command = args[0];
const file = args[1];

if (!command) {
  console.log(`
TSON Parser CLI

Usage:
  npx tsn-parser parse <file.tsn>     Parse TSON file to JSON
  npx tsn-parser validate <file.tsn>  Validate TSON syntax
  npx tsn-parser convert <file.json>  Convert JSON to TSON

Examples:
  npx tsn-parser parse config.tsn
  npx tsn-parser validate data.tsn
  npx tsn-parser convert package.json
`);
  process.exit(0);
}

if (!file) {
  console.error('Error: File path required');
  process.exit(1);
}

try {
  const content = readFileSync(file, 'utf8');

  switch (command) {
    case 'parse':
      const parsed = parse(content);
      console.log(JSON.stringify(parsed, null, 2));
      break;

    case 'validate':
      const result = validate(content);
      if (result.valid) {
        console.log('✅ Valid TSON syntax');
      } else {
        console.error('❌ Invalid TSON syntax:', result.error);
        process.exit(1);
      }
      break;

    case 'convert':
      const json = JSON.parse(content);
      const tson = stringify(json);
      const outFile = file.replace(/\.json$/, '.tsn');
      writeFileSync(outFile, tson);
      console.log(`✅ Converted to ${outFile}`);
      break;

    default:
      console.error('Unknown command:', command);
      process.exit(1);
  }
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : error);
  process.exit(1);
}