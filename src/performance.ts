// src/performance.ts
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { parse, ParseOptions } from './index.js';

// Memory pool for object reuse
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  acquire(): T {
    return this.pool.pop() || this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// Incremental parser state
interface ParseState {
  content: string;
  lastHash: string;
  lastResult: any;
  lastModified: number;
}

// Incremental parsing cache
const parseStateCache = new Map<string, ParseState>();

// Simple hash function for content
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Incremental parsing - only parse if content changed
export function parseIncremental<T = any>(
  content: string, 
  key: string, 
  options: ParseOptions = {}
): T {
  const hash = simpleHash(content);
  const cached = parseStateCache.get(key);
  
  if (cached && cached.lastHash === hash) {
    return cached.lastResult;
  }
  
  const result = parse<T>(content, options) as T;
  
  parseStateCache.set(key, {
    content,
    lastHash: hash,
    lastResult: result,
    lastModified: Date.now()
  });
  
  // Clean old entries
  if (parseStateCache.size > 1000) {
    const cutoff = Date.now() - 300000; // 5 minutes
    parseStateCache.forEach((v, k) => {
      if (v.lastModified < cutoff) {
        parseStateCache.delete(k);
      }
    });
  }
  
  return result;
}

// Worker thread parser
export function parseInWorker<T = any>(
  content: string, 
  options: ParseOptions = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { content, options }
    });
    
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

// Parallel parsing for multiple files
export async function parseParallel<T = any>(
  files: Array<{ content: string; options?: ParseOptions }>,
  maxWorkers = 4
): Promise<T[]> {
  const results: T[] = new Array(files.length);
  const workers: Promise<void>[] = [];
  
  for (let i = 0; i < files.length; i += maxWorkers) {
    const batch = files.slice(i, i + maxWorkers);
    const batchPromises = batch.map(async (file, batchIndex) => {
      const globalIndex = i + batchIndex;
      try {
        results[globalIndex] = await parseInWorker<T>(file.content, file.options);
      } catch (error) {
        throw new Error(`Failed to parse file at index ${globalIndex}: ${error}`);
      }
    });
    
    workers.push(...batchPromises);
  }
  
  await Promise.all(workers);
  return results;
}

// Memory-optimized string builder
class StringBuilder {
  private chunks: string[] = [];
  private length = 0;

  append(str: string): void {
    this.chunks.push(str);
    this.length += str.length;
  }

  toString(): string {
    const result = this.chunks.join('');
    this.clear();
    return result;
  }

  clear(): void {
    this.chunks.length = 0;
    this.length = 0;
  }

  getLength(): number {
    return this.length;
  }
}

// Memory-optimized stringify
export function stringifyOptimized(obj: any, options: any = {}): string {
  const builder = new StringBuilder();
  const { minify = false } = options;
  const indent = minify ? '' : '  ';
  const newline = minify ? '' : '\n';
  
  function stringifyValue(value: any, depth = 0): void {
    const currentIndent = minify ? '' : indent.repeat(depth);
    const nextIndent = minify ? '' : indent.repeat(depth + 1);
    
    if (value === null) {
      builder.append('null');
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      builder.append(String(value));
    } else if (typeof value === 'string') {
      builder.append(`"${value}"`);
    } else if (Array.isArray(value)) {
      builder.append('[');
      if (value.length > 0) {
        builder.append(newline);
        for (let i = 0; i < value.length; i++) {
          builder.append(nextIndent);
          stringifyValue(value[i], depth + 1);
          if (i < value.length - 1) builder.append(',');
          builder.append(newline);
        }
        builder.append(currentIndent);
      }
      builder.append(']');
    } else if (typeof value === 'object') {
      const keys = Object.keys(value);
      builder.append('{');
      if (keys.length > 0) {
        builder.append(newline);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          builder.append(nextIndent);
          builder.append(`${key}: `);
          stringifyValue(value[key], depth + 1);
          if (i < keys.length - 1) builder.append(',');
          builder.append(newline);
        }
        builder.append(currentIndent);
      }
      builder.append('}');
    }
  }
  
  stringifyValue(obj);
  return builder.toString();
}

// Worker thread handler
if (!isMainThread && parentPort) {
  const { content, options } = workerData;
  try {
    const result = parse(content, options);
    parentPort.postMessage(result);
  } catch (error) {
    parentPort.postMessage({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}