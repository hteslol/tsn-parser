# TSON Parser

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
  name: "John Doe",
  age: 30,
  active: true,
  tags: ["developer", "typescript"]
}
```

## Installation

```bash
npm install tsn-parser
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

### `stringify(obj: any): string`

Converts a JavaScript object to TSON format.

- **Parameters:**
  - `obj`: The object to convert
- **Returns:** The TSON string representation

## Features

- ✅ Clean TypeScript-like syntax
- ✅ Type-safe parsing with generics
- ✅ Bidirectional conversion (parse/stringify)
- ✅ Lightweight and fast
- ✅ No external runtime dependencies (uses esbuild for parsing)

## Examples

### Complex Data Structures

```typescript
const complexData = parse(`{
  users: [
    {
      id: 1,
      name: "Admin User",
      permissions: ["read", "write", "delete"]
    },
    {
      id: 2,
      name: "Regular User",
      permissions: ["read"]
    }
  ],
  settings: {
    maxUsers: 100,
    features: {
      darkMode: true,
      notifications: false
    }
  }
}`);
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