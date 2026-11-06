const delegateReady = 'INFO: Created TensorFlow Lite XNNPACK delegate for CPU.';
let pendingInitializations = 0;
let restore: (() => void) | null = null;

/** Emscripten captures console.error during module creation for native stderr.
 * Route this one known informational line correctly, including later inference.
 * Preserve all other messages, especially real XNNPACK and WebGL failures.
 */
export async function withMediaPipeLogging<T>(initialize: () => Promise<T>): Promise<T> {
  if (pendingInitializations === 0) {
    const originalError = console.error;
    const routeError = (...args: unknown[]) => {
      if (args.length === 1 && typeof args[0] === 'string' && args[0].trim() === delegateReady) {
        console.info(args[0]);
      } else {
        originalError.apply(console, args);
      }
    };
    console.error = routeError;
    restore = () => {
      if (console.error === routeError) console.error = originalError;
    };
  }
  pendingInitializations++;
  try {
    return await initialize();
  } finally {
    pendingInitializations--;
    if (pendingInitializations === 0) {
      restore?.();
      restore = null;
    }
  }
}
