import { Span, Trace, SpanStatus } from '../definitions';
import { getRandomInt } from './mathUtils';

const SERVICES = [
  'frontend-proxy',
  'api-gateway',
  'auth-service',
  'payment-service',
  'inventory-service',
  'db-primary',
  'db-replica',
  'cache-redis',
  'notification-worker'
];

/**
 * Generates a unique ID for traces and spans
 */
export function generateId(length: number = 16): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Recursive function to generate a span and its children
 */
function createSpan(
  traceId: string,
  parentId: string | undefined,
  currentDepth: number,
  startTime: number,
  maxDepth: number
): Span[] {
  // Base duration for this operation
  const duration = getRandomInt(10, 500);
  const endTime = startTime + duration;
  
  // Pick a service. Root is usually frontend/gateway.
  // We simulate a simple flow where depth 0 is frontend, depth 1 is api/auth, etc.
  let serviceName = SERVICES[getRandomInt(0, SERVICES.length - 1)];
  
  if (currentDepth === 0) serviceName = 'frontend-proxy';
  else if (currentDepth === 1) serviceName = 'api-gateway';
  
  // 5% chance of error
  const status: SpanStatus = Math.random() < 0.05 ? 'error' : 'ok';

  const span: Span = {
    traceId,
    spanId: generateId(),
    parentId,
    serviceName,
    operationName: `GET /${serviceName.split('-')[0]}`,
    startTime,
    duration,
    status,
    depth: currentDepth,
    children: [] // This is just for UI hierarchy if needed, but flat list is used for Gantt
  };

  const allSpans: Span[] = [span];

  // Recursively create children if we haven't hit max depth
  // and if the span didn't error immediately (optional logic, but realistic)
  if (currentDepth < maxDepth) {
    const numChildren = getRandomInt(0, 3);
    
    // Distribute children within the parent's duration
    // A simplified model: children run sequentially or somewhat in parallel
    // We'll stagger them slightly
    let currentChildTime = startTime + getRandomInt(1, 20); // slight delay for network
    
    for (let i = 0; i < numChildren; i++) {
      // Ensure child fits in parent
      if (currentChildTime >= endTime) break;

      // Children duration needs to be somewhat constrained to parent, 
      // but the recursive call handles its own duration. 
      // In a real strict model, parent duration = self + children.
      // Here we generated parent duration first (async model), so children just happen "during" it.
      
      const childSpans = createSpan(
        traceId,
        span.spanId,
        currentDepth + 1,
        currentChildTime,
        maxDepth
      );
      
      allSpans.push(...childSpans);
      
      // Advance time for next sibling (sequential calls assumption for simplicity)
      // or just random offset for parallel
      currentChildTime += getRandomInt(10, 50); 
    }
  }

  return allSpans;
}

/**
 * Generates a full trace with a tree of spans
 */
export function generateTrace(rootStartTime: number): Trace {
  const traceId = generateId();
  const maxDepth = getRandomInt(2, 6); // Random depth between 2 and 6
  
  const spans = createSpan(traceId, undefined, 0, rootStartTime, maxDepth);
  
  // Calculate aggregate stats
  const rootSpan = spans.find(s => !s.parentId);
  const totalDuration = rootSpan ? rootSpan.duration : 0;
  const errorCount = spans.filter(s => s.status === 'error').length;
  
  // Sort spans by start time for easier rendering
  spans.sort((a, b) => a.startTime - b.startTime);

  return {
    traceId,
    spans,
    totalDuration,
    startTime: rootStartTime,
    rootServiceName: rootSpan?.serviceName || 'unknown',
    errorCount
  };
}

/**
 * Batch generator for lists of traces
 */
export function generateTraceList(count: number, timeWindowStart: number, timeWindowEnd: number): Trace[] {
  const traces: Trace[] = [];
  const range = timeWindowEnd - timeWindowStart;
  
  for (let i = 0; i < count; i++) {
    // Random start time within window
    const startTime = timeWindowStart + Math.floor(Math.random() * range);
    traces.push(generateTrace(startTime));
  }
  
  // Sort by start time desc (newest first)
  return traces.sort((a, b) => b.startTime - a.startTime);
}
