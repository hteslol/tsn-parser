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

### `parse<T>(tsn: string): T`

Parses a TSON string into a JavaScript object.

- **Parameters:**
  - `tsn`: The TSON string to parse
- **Returns:** The parsed JavaScript object
- **Type Parameter:** `T` - Optional type for the return value

### `stringify(obj: any, options?: { preserveFunctions?: boolean }): string`

Converts a JavaScript object to TSON format.

- **Parameters:**
  - `obj`: The object to convert
  - `options`: Optional configuration
    - `preserveFunctions`: Keep function expressions in output
- **Returns:** The TSON string representation

### `validate(tsn: string): { valid: boolean; error?: string }`

Validates TSON syntax without parsing.

- **Parameters:**
  - `tsn`: The TSON string to validate
- **Returns:** Validation result with error details

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
- ✅ Syntax validation
- ✅ Transform caching for better performance
- ✅ Streaming support for large files
- ✅ Optimized string processing
- ✅ No external runtime dependencies (uses esbuild for parsing)

## Examples

### Advanced Features

```typescript
// Comments and trailing commas
const data = parse(`{
  // User configuration
  users: [
    {
      id: 1,
      name: "Admin User",
      permissions: ["read", "write", "delete"], // trailing comma OK
    },
    /* Another user */
    {
      id: 2,
      name: \`Regular User\`, // template literals
      permissions: ["read"],
    },
  ],
  /* Settings block */
  settings: {
    maxUsers: 100,
    validator: (user) => user.id > 0, // functions supported
  },
}`);

// Function preservation
const withFunctions = stringify({
  name: "test",
  handler: () => console.log("hello")
}, { preserveFunctions: true });

// Validation
const result = validate(`{ name: "valid" }`);
if (!result.valid) {
  console.error(result.error);
}```
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.