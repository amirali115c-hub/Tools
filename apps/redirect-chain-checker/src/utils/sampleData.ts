import { Hop, ChainAnalysis } from '../types';
import { analyzeChain } from './chainAnalyzer';

export const SAMPLE_HOPS: Hop[] = [
  {
    id: 'sample-hop-1',
    stepNumber: 1,
    url: 'http://example-store.com/product/123',
    statusCode: 301,
    statusText: 'Moved Permanently',
    redirectType: '301 Permanent',
    responseTimeMs: 120,
    headers: {
      'Location': 'https://www.example-store.com/products/123/',
      'Server': 'nginx/1.22.1',
      'Cache-Control': 'max-age=3600',
    },
    note: 'Initial HTTP entry point redirecting to HTTPS www domain',
  },
  {
    id: 'sample-hop-2',
    stepNumber: 2,
    url: 'https://www.example-store.com/products/123/',
    statusCode: 302,
    statusText: 'Found',
    redirectType: '302 Found',
    responseTimeMs: 180,
    headers: {
      'Location': 'http://example-store.com/checkout/legacy-item',
      'Set-Cookie': 'session_id=xyz789; Path=/',
    },
    note: 'Temporary redirect causing a protocol downgrade back to unencrypted HTTP',
  },
  {
    id: 'sample-hop-3',
    stepNumber: 3,
    url: 'http://example-store.com/checkout/legacy-item',
    statusCode: 301,
    statusText: 'Moved Permanently',
    redirectType: '301 Permanent',
    responseTimeMs: 95,
    headers: {
      'Location': 'https://example-store.com/cart/item-123',
    },
    note: 'Legacy route permanent redirect to modern store cart',
  },
  {
    id: 'sample-hop-4',
    stepNumber: 4,
    url: 'https://example-store.com/cart/item-123',
    statusCode: 200,
    statusText: 'OK',
    redirectType: '200 OK',
    responseTimeMs: 140,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Encoding': 'gzip',
      'X-Frame-Options': 'SAMEORIGIN',
    },
    note: 'Final landing page endpoint',
  },
];

export const SAMPLE_CURL_RAW = `HTTP/1.1 301 Moved Permanently
Server: nginx/1.22.1
Date: Mon, 03 Aug 2026 12:00:00 GMT
Content-Type: text/html
Content-Length: 178
Connection: keep-alive
Location: https://www.example-store.com/products/123/

HTTP/2 302 Found
date: Mon, 03 Aug 2026 12:00:01 GMT
content-type: text/html
location: http://example-store.com/checkout/legacy-item
set-cookie: session_id=xyz789; Path=/

HTTP/1.1 301 Moved Permanently
Date: Mon, 03 Aug 2026 12:00:02 GMT
Location: https://example-store.com/cart/item-123

HTTP/2 200 OK
date: Mon, 03 Aug 2026 12:00:03 GMT
content-type: text/html; charset=utf-8
content-encoding: gzip
x-frame-options: SAMEORIGIN
`;

export const SAMPLE_BULK_URLS = [
  'http://example-store.com/product/123',
  'https://httpbin.org/redirect-to?url=https%3A%2F%2Fhttpbin.org%2Fget&status_code=301',
  'http://www.google.com',
  'http://github.com',
  'http://httpbin.org/relative-redirect/2',
];

export const PRELOADED_SAMPLE_CHAIN: ChainAnalysis = analyzeChain(
  SAMPLE_HOPS,
  'manual',
  'Sample E-Commerce Migration Redirect Chain',
  'https://example-store.com/cart/item-123',
  SAMPLE_CURL_RAW
);
