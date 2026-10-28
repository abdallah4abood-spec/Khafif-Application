export type AppErrorKind = 'offline' | 'timeout' | 'not_found' | 'validation' | 'server' | 'unknown';
export type AppError = { kind: AppErrorKind; message?: string };

function statusOf(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    const e = error as { status?: unknown; statusCode?: unknown };
    if (typeof e.status === 'number') return e.status;
    if (typeof e.statusCode === 'number') return e.statusCode;
  }
  return undefined;
}

/**
 * Maps SDK / fetch / HTTP errors to the small union the UI understands.
 * `message` is kept for dev logs only — never render raw server text to users.
 */
export function toAppError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : undefined;
  const status = statusOf(error);

  if (status !== undefined) {
    if (status === 404) return { kind: 'not_found', message };
    if (status === 408 || status === 504) return { kind: 'timeout', message };
    if (status >= 400 && status < 500) return { kind: 'validation', message };
    if (status >= 500) return { kind: 'server', message };
  }
  if (error instanceof Error) {
    if (error.name === 'AbortError' || /timeout|timed out/i.test(error.message))
      return { kind: 'timeout', message };
    if (error instanceof TypeError || /network request failed|failed to fetch/i.test(error.message)) {
      return { kind: 'offline', message };
    }
  }
  return { kind: 'unknown', message };
}

/** TanStack Query retry policy: up to 2 retries, never for 4xx (docs/04). */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = statusOf(error);
  if (status !== undefined && status >= 400 && status < 500) return false;
  return failureCount < 2;
}
