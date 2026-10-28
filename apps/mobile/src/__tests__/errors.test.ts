import { shouldRetry, toAppError } from '@/api/errors';

describe('toAppError', () => {
  it.each([
    [{ status: 404 }, 'not_found'],
    [{ status: 408 }, 'timeout'],
    [{ status: 400 }, 'validation'],
    [{ status: 422 }, 'validation'],
    [{ status: 500 }, 'server'],
    [{ statusCode: 503 }, 'server'],
  ])('maps %j to %s', (input, kind) => {
    expect(toAppError(input).kind).toBe(kind);
  });

  it('maps a fetch TypeError to offline', () => {
    expect(toAppError(new TypeError('Network request failed')).kind).toBe('offline');
  });

  it('maps an AbortError to timeout', () => {
    const e = new Error('aborted');
    e.name = 'AbortError';
    expect(toAppError(e).kind).toBe('timeout');
  });

  it('falls back to unknown', () => {
    expect(toAppError('boom').kind).toBe('unknown');
    expect(toAppError(undefined).kind).toBe('unknown');
  });
});

describe('shouldRetry', () => {
  it('retries network/5xx errors at most twice', () => {
    expect(shouldRetry(0, { status: 500 })).toBe(true);
    expect(shouldRetry(1, new TypeError('x'))).toBe(true);
    expect(shouldRetry(2, { status: 500 })).toBe(false);
  });

  it('never retries 4xx', () => {
    expect(shouldRetry(0, { status: 404 })).toBe(false);
    expect(shouldRetry(0, { status: 422 })).toBe(false);
  });
});
