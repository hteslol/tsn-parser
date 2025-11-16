# TSON Parser

[![npm version](https://badge.fury.io/js/tsn-parser.svg)](https://badge.fury.io/js/tsn-parser)
[![CI](https://github.com/hteslol/tsn-parser/workflows/CI/badge.svg)](https://github.com/hteslol/tsn-parser/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript Notation (TSON) - A JSON alternative that uses TypeScript syntax for cleaner, more readable data representation.

## What is TSON?

TSON allows you to write data using TypeScript syntax instead of JSON, making it more readable and maintainable:

**JSON:**
```json
{
  "name": "John Doe",
  "age": 30,
  "active": true,
  "tags": ["developer", "typescript"]
}
```

**TSON:**
```typescript
{
  name: "John Doe", // Comments supported!
  age: 30,
  active: true,
  tags: ["developer", "typescript"], // Trailing commas allowed
  /* Block comments too */
}
```

## Installation

```bash
npm install tsn-parser
```

## CLI Usage

```bash
# Parse TSON file to JSON
npx tsn-parser parse config.tsn

# Validate TSON syntax
npx tsn-parser validate data.tsn

# Convert JSON to TSON
npx tsn-parser convert package.json
```

## Usage

### Parsing TSON to JavaScript Objects

```typescript
import { parse } from 'tsn-parser';

const tsonString = `{
  name: "Alice",
  age: 25,
  skills: ["JavaScript", "TypeScript", "React"],
  config: {
    theme: "dark",
    notifications: true
  }
}`;

const data = parse(tsonString);
console.log(data.name); // "Alice"
```

### Converting Objects to TSON

```typescript
import { stringify } from 'tsn-parser';

const obj = {
  name: "Bob",
  age: 28,
  hobbies: ["reading", "coding"]
};

const tsonString = stringify(obj);
console.log(tsonString);
// Output:
// {
//   name: "Bob"
//   age: 28
//   hobbies: ["reading", "coding"]
// }
```

### Type Safety

TSON parser supports TypeScript generics for type-safe parsing:

```typescript
interface User {
  name: string;
  age: number;
  active: boolean;
}

const user = parse<User>(`{
  name: "Charlie",
  age: 32,
  active: true
}`);

// user is now typed as User
```

## API Reference

### `parse<T>(tsn: string, options?: ParseOptions): T | ParseResult<T>`

Parses a TSON string into a JavaScript object with enhanced error handling.

- **Parameters:**
  - `tsn`: The TSON string to parse
  - `options`: Optional configuration
    - `schema`: JSON Schema for validation
    - `sourceMap`: Generate source map information
- **Returns:** The parsed JavaScript object or ParseResult with source map
- **Type Parameter:** `T` - Optional type for the return value
- **Throws:** `TSONError` with line/column information on parse errors

### `stringify(obj: any, options?: StringifyOptions): string`

Converts a JavaScript object to TSON format with advanced formatting options.

- **Parameters:**
  - `obj`: The object to convert
  - `options`: Optional configuration
    - `preserveFunctions`: Keep function expressions in output
    - `minify`: Generate compact output without whitespace
    - `sourceMap`: Generate source map information
- **Returns:** The TSON string representation

### `validate(tsn: string, schema?: object): { valid: boolean; error?: string }`

Validates TSON syntax and optionally against a JSON Schema.

- **Parameters:**
  - `tsn`: The TSON string to validate
  - `schema`: Optional JSON Schema for validation
- **Returns:** Validation result with error details

### `validateDetailed(tsn: string, schema?: object): DetailedValidationResult`

Provides detailed validation with line/column error information.

- **Parameters:**
  - `tsn`: The TSON string to validate
  - `schema`: Optional JSON Schema for validation
- **Returns:** Detailed validation result with position information

### `createParseStream<T>(): Transform`

Creates a streaming parser for large TSON files.

- **Returns:** A Transform stream that parses TSON objects
- **Type Parameter:** `T` - Optional type for parsed objects

## Features

- ✅ Clean TypeScript-like syntax
- ✅ Comments support (`//` and `/* */`)
- ✅ Trailing commas allowed
- ✅ Template literals with backticks
- ✅ Function expressions (optional)
- ✅ Type-safe parsing with generics
- ✅ Bidirectional conversion (parse/stringify)
- ✅ Enhanced error messages with line/column numbers
- ✅ JSON Schema validation support
- ✅ Minification for compact output
- ✅ Source map generation
- ✅ Syntax validation
- ✅ CLI tool for file processing
- ✅ Transform caching for better performance
- ✅ Streaming support for large files
- ✅ Optimized string processing
- ✅ No external runtime dependencies (uses esbuild for parsing)

## Examples

### Advanced Features

```typescript
// Enhanced parsing with schema validation
const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number", minimum: 0 }
  },
  required: ["name", "age"]
};

const data = parse(`{
  // User configuration
  name: "Alice",
  age: 25,
  settings: {
    theme: "dark",
    notifications: true, // trailing comma OK
  }
}`, { schema, sourceMap: true });

// Minified output
const compact = stringify({
  name: "Bob",
  config: { enabled: true }
}, { minify: true });
// Output: {name:"Bob",config:{enabled:true}}

// Enhanced error handling
try {
  parse(`{ invalid: syntax here }`);
} catch (error) {
  if (error instanceof TSONError) {
    console.log(`Error at line ${error.line}, column ${error.column}`);
  }
}

// Detailed validation
const validation = validateDetailed(`{ name: 123 }`, schema);
if (!validation.valid) {
  validation.errors.forEach(err => {
    console.log(`${err.message} at line ${err.line}`);
  });
}

// Function preservation
const withFunctions = stringify({
  name: "test",
  handler: () => console.log("hello")
}, { preserveFunctions: true });
```
```

### Configuration Files

TSON is perfect for configuration files that need to be human-readable:

```typescript
// config.tsn
{
  database: {
    host: "localhost",
    port: 5432,
    name: "myapp"
  },
  cache: {
    enabled: true,
    ttl: 3600
  },
  features: ["auth", "logging", "metrics"]
}
```

### Streaming Large Files

```typescript
import { createParseStream } from 'tsn-parser';
import { createReadStream } from 'fs';

const parseStream = createParseStream<{ id: number; name: string }>();

createReadStream('large-data.tsn')
  .pipe(parseStream)
  .on('data', (obj) => {
    console.log('Parsed object:', obj);
  });
```

## Why TSON?

1. **Readability**: No quotes around property names
2. **Familiarity**: Uses TypeScript syntax developers already know
3. **Maintainability**: Easier to read and edit than JSON
4. **Type Safety**: Optional TypeScript integration
5. **Compatibility**: Converts seamlessly to/from JavaScript objects

## License

MIT

## VS Code Extension

Install the TSON Language Support extension for syntax highlighting:

```bash
cd vscode-extension
npm install -g vsce
vsce package
code --install-extension tson-language-support-0.1.0.vsix
```

## Online Playground

Try TSON online at: `file://path/to/playground/index.html`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### v1.5.0
- Added enhanced error messages with line/column numbers
- Added JSON Schema validation support
- Added minification option for compact output
- Added source map generation
- Added detailed validation with position tracking
- Enhanced TSONError class with position information

### v1.4.0
- Added VS Code extension for .tsn files
- Added online playground/demo
- Added semantic versioning with changesets
- Enhanced developer tooling

### v1.3.0
- Added CLI tool (`npx tsn-parser`)
- Added GitHub Actions CI/CD
- Added repository info and badges
- Enhanced package metadata

### v1.2.0
- Added comments support (`//` and `/* */`)
- Added trailing commas support
- Added template literals support
- Added function expressions with `preserveFunctions` option
- Added `validate()` function

### v1.1.0
- Added transform caching for better performance
- Added streaming support with `createParseStream()`
- Optimized `stringify()` with single-pass algorithm

### v1.0.0
- Initial release with basic parse/stringify functionality