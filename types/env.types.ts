/**
 * R2 bucket interface for TypeScript
 */
export interface R2Bucket {
  put: (key: string, value: ArrayBuffer | ReadableStream | string, options?: R2PutOptions) => Promise<R2Object>;
  get: (key: string) => Promise<R2Object | null>;
  delete: (key: string) => Promise<void>;
  list: (options?: R2ListOptions) => Promise<R2Objects>;
}

export interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: R2HttpMetadata;
  customMetadata?: Record<string, string>;
  range?: R2Range;
  body: ReadableStream;
  writeHttpMetadata: (headers: Headers) => void;
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

export interface R2PutOptions {
  httpMetadata?: R2HttpMetadata;
  customMetadata?: Record<string, string>;
  md5?: ArrayBuffer;
  sha1?: ArrayBuffer;
  sha256?: ArrayBuffer;
  onlyIf?: R2Conditional;
}

export interface R2HttpMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

export interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
  include?: string[];
}

export interface R2Conditional {
  etagMatches?: string;
  etagDoesNotMatch?: string;
  uploadedBefore?: Date;
  uploadedAfter?: Date;
  secondsGranularity?: boolean;
}

export interface R2Range {
  offset: number;
  length: number;
}

/**
 * Environment interface for Cloudflare Worker
 */
export interface Env {
  PROFILE_IMAGES: R2Bucket;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  // Add other bindings as needed
} 