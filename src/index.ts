// src/index.ts
import { transformSync } from 'esbuild';
import { Readable, Transform } from 'stream';

// Cache for esbuild transforms
const transformCache = new Map<string, string>();

export function parse<T = any>(tsn: string): T {
  // Check cache first
  if (transformCache.has(tsn)) {
    const cachedCode = transformCache.get(tsn)!;
    const fn = new Function('exports', cachedCode);
    const exports: any = {};
    fn(exports);
    return exports.default;
  }

  const wrapped = `export default ${tsn}`;
  const result = transformSync(wrapped, { loader: 'ts', format: 'cjs' });
  
  // Cache the result
  transformCache.set(tsn, result.code);
  
  const fn = new Function('exports', result.code);
  const exports: any = {};
  fn(exports);
  return exports.default;
}

// Optimized stringify with single pass
export function stringify(obj: any): string {
  const json = JSON.stringify(obj, null, 2);
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
        // Start of property name - skip quote
        inString = true;
        continue;
      } else if (inString && json[i + 1] === ':') {
        // End of property name - skip quote
        inString = false;
        continue;
      }
    }
    
    if (char === ',' && nextChar === '\n') {
      // Skip comma before newline
      continue;
    }
    
    result += char;
  }
  
  return result;
}

// Streaming parser for large files
export function createParseStream<T = any>(): Transform {
  let buffer = '';
  
  return new Transform({
    objectMode: true,
    transform(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
      buffer += chunk.toString();
      
      // Try to parse complete objects
      let braceCount = 0;
      let start = 0;
      
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === '{') braceCount++;
        if (buffer[i] === '}') braceCount--;
        
        if (braceCount === 0 && i > start) {
          const objectStr = buffer.slice(start, i + 1);
          try {
            const parsed = parse<T>(objectStr);
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
          const parsed = parse<T>(buffer);
          this.push(parsed);
        } catch (error) {
          this.emit('error', error);
        }
      }
      callback();
    }
  });
}

// Clear cache when it gets too large
setInterval(() => {
  if (transformCache.size > 1000) {
    transformCache.clear();
  }
}, 60000);

