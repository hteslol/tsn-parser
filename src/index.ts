// src/index.ts
import { transformSync } from 'esbuild';
import { Transform } from 'stream';
import Ajv from 'ajv';

// Cache for esbuild transforms
const transformCache = new Map<string, any>();

// Error with position information
export class TSONError extends Error {
  constructor(
    message: string,
    public line?: number,
    public column?: number,
    public position?: number
  ) {
    super(message);
    this.name = 'TSONError';
  }
}

// Source map entry
export interface SourceMapEntry {
  original: { line: number; column: number };
  generated: { line: number; column: number };
}

// Parse options
export interface ParseOptions {
  schema?: object;
  sourceMap?: boolean;
}

// Stringify options
export interface StringifyOptions {
  preserveFunctions?: boolean;
  minify?: boolean;
  sourceMap?: boolean;
}

// Parse result with source map
export interface ParseResult<T> {
  data: T;
  sourceMap?: SourceMapEntry[];
}

// Get line and column from position
function getLineColumn(text: string, position: number): { line: number; column: number } {
  const lines = text.substring(0, position).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

// Enhanced error recovery with position tracking
function createDetailedError(originalError: Error, tsn: string, position?: number): TSONError {
  let line: number | undefined;
  let column: number | undefined;
  
  if (position !== undefined) {
    const pos = getLineColumn(tsn, position);
    line = pos.line;
    column = pos.column;
  }
  
  const message = `Parse error: ${originalError.message}${line ? ` at line ${line}, column ${column}` : ''}`;
  return new TSONError(message, line, column, position);
}

// Preprocess TSON to handle comments and track positions
function preprocessTSON(tsn: string, trackPositions = false): { 
  processed: string; 
  sourceMap?: SourceMapEntry[] 
} {
  let processed = tsn;
  const sourceMap: SourceMapEntry[] = [];
  let offset = 0;

  // Remove block comments
  processed = processed.replace(/\/\*[\s\S]*?\*\//g, (match, matchOffset) => {
    if (trackPositions) {
      const originalPos = getLineColumn(tsn, matchOffset);
      const generatedPos = getLineColumn(processed, matchOffset - offset);
      sourceMap.push({ original: originalPos, generated: generatedPos });
    }
    offset += match.length;
    return ' '.repeat(match.length); // Preserve positions
  });

  // Remove line comments
  processed = processed.replace(/\/\/.*$/gm, (match, matchOffset) => {
    if (trackPositions) {
      const originalPos = getLineColumn(tsn, matchOffset);
      const generatedPos = getLineColumn(processed, matchOffset - offset);
      sourceMap.push({ original: originalPos, generated: generatedPos });
    }
    return ' '.repeat(match.length); // Preserve positions
  });

  return { processed, sourceMap: trackPositions ? sourceMap : undefined };
}

// Clear cache when it gets too large
function clearCacheIfNeeded() {
  if (transformCache.size > 1000) {
    transformCache.clear();
  }
}

export function parse<T = any>(tsn: string, options: ParseOptions = {}): T | ParseResult<T> {
  const { schema, sourceMap = false } = options;
  const { processed, sourceMap: sourceMapEntries } = preprocessTSON(tsn, sourceMap);
  
  if (transformCache.has(processed)) {
    const result = transformCache.get(processed)! as T;
    
    // Schema validation
    if (schema) {
      const ajv = new Ajv();
      const validate = ajv.compile(schema);
      if (!validate(result)) {
        throw new TSONError(`Schema validation failed: ${ajv.errorsText(validate.errors)}`);
      }
    }
    
    return sourceMap ? { data: result, sourceMap: sourceMapEntries } : result;
  }

  try {
    // Simple eval approach for basic TSON
    const result = eval(`(${processed})`);
    transformCache.set(processed, result);
    clearCacheIfNeeded();
    
    // Schema validation
    if (schema) {
      const ajv = new Ajv();
      const validate = ajv.compile(schema);
      if (!validate(result)) {
        throw new TSONError(`Schema validation failed: ${ajv.errorsText(validate.errors)}`);
      }
    }
    
    return sourceMap ? { data: result, sourceMap: sourceMapEntries } : result;
  } catch (error) {
    // Enhanced error with position
    if (error instanceof Error) {
      throw createDetailedError(error, tsn);
    }
    throw error;
  }
}

export function stringify(obj: any, options: StringifyOptions = {}): string {
  const { preserveFunctions = false, minify = false, sourceMap = false } = options;
  
  function replacer(key: string, value: any): any {
    if (typeof value === 'function' && preserveFunctions) {
      return `__FUNCTION__${value.toString()}__FUNCTION__`;
    }
    return value;
  }
  
  let json = JSON.stringify(obj, replacer, minify ? 0 : 2);
  
  if (preserveFunctions) {
    json = json.replace(/"__FUNCTION__(.*?)__FUNCTION__"/g, '$1');
  }
  
  if (minify) {
    return json.replace(/"([^"]+)":/g, '$1:');
  }
  
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    const nextChar = json[i + 1];
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      result += char;
      continue;
    }
    
    if (char === '"') {
      if (!inString && nextChar && /[a-zA-Z_$]/.test(nextChar)) {
        inString = true;
        continue;
      } else if (inString && json[i + 1] === ':') {
        inString = false;
        continue;
      }
    }
    
    if (char === ',' && nextChar === '\n') {
      continue;
    }
    
    result += char;
  }
  
  return result;
}

// Re-export performance functions
export { parseIncremental, parseInWorker, parseParallel, stringifyOptimized } from './performance.js';

export function createParseStream<T = any>(options: ParseOptions = {}): Transform {
  let buffer = '';
  
  return new Transform({
    objectMode: true,
    transform(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
      buffer += chunk.toString();
      
      let braceCount = 0;
      let start = 0;
      
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === '{') braceCount++;
        if (buffer[i] === '}') braceCount--;
        
        if (braceCount === 0 && i > start) {
          const objectStr = buffer.slice(start, i + 1);
          try {
            const parsed = parse<T>(objectStr, options);
            this.push(parsed);
            start = i + 1;
          } catch (error) {
            // Continue accumulating
          }
        }
      }
      
      buffer = buffer.slice(start);
      callback();
    },
    
    flush(callback: (error?: Error | null) => void) {
      if (buffer.trim()) {
        try {
          const parsed = parse<T>(buffer, options);
          this.push(parsed);
        } catch (error) {
          this.emit('error', error);
        }
      }
      callback();
    }
  });
}

export function validate(tsn: string, schema?: object): { valid: boolean; error?: string } {
  try {
    const result = parse(tsn, { schema });
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof TSONError ? error.message : 'Unknown error' 
    };
  }
}

// Enhanced validation with detailed results
export function validateDetailed(tsn: string, schema?: object): {
  valid: boolean;
  errors: Array<{
    message: string;
    line?: number;
    column?: number;
    position?: number;
  }>;
} {
  try {
    parse(tsn, { schema });
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof TSONError) {
      return {
        valid: false,
        errors: [{
          message: error.message,
          line: error.line,
          column: error.column,
          position: error.position
        }]
      };
    }
    return {
      valid: false,
      errors: [{ message: 'Unknown error' }]
    };
  }
}