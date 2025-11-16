// src/index.ts
import { transformSync } from 'esbuild';
import { Transform } from 'stream';

// Cache for esbuild transforms
const transformCache = new Map<string, string>();

// Preprocess TSON to handle comments
function preprocessTSON(tsn: string): string {
  return tsn
    .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
    .replace(/\/\/.*$/gm, ''); // Line comments
}

export function parse<T = any>(tsn: string): T {
  const preprocessed = preprocessTSON(tsn);
  
  if (transformCache.has(preprocessed)) {
    const cachedCode = transformCache.get(preprocessed)!;
    const fn = new Function('exports', cachedCode);
    const exports: any = {};
    fn(exports);
    return exports.default;
  }

  const wrapped = `export default ${preprocessed}`;
  const result = transformSync(wrapped, { 
    loader: 'ts', 
    format: 'cjs',
    target: 'es2020'
  });
  
  transformCache.set(preprocessed, result.code);
  
  const fn = new Function('exports', result.code);
  const exports: any = {};
  fn(exports);
  return exports.default;
}

export function stringify(obj: any, options: { preserveFunctions?: boolean } = {}): string {
  const { preserveFunctions = false } = options;
  
  function replacer(key: string, value: any): any {
    if (typeof value === 'function' && preserveFunctions) {
      return `__FUNCTION__${value.toString()}__FUNCTION__`;
    }
    return value;
  }
  
  let json = JSON.stringify(obj, replacer, 2);
  
  if (preserveFunctions) {
    json = json.replace(/"__FUNCTION__(.*?)__FUNCTION__"/g, '$1');
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

export function createParseStream<T = any>(): Transform {
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

export function validate(tsn: string): { valid: boolean; error?: string } {
  try {
    parse(tsn);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Clear cache periodically
setInterval(() => {
  if (transformCache.size > 1000) {
    transformCache.clear();
  }
}, 60000);