import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 does not catch rejected promises from async handlers (the request
// would hang). Wrap every async handler so rejections reach the error handler.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// Terminal error handler (must take 4 args to be treated as error middleware).
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const e = err as { type?: string; code?: string };
  if (e?.type === 'entity.too.large') {
    res.status(413).json({ error: 'request body too large' });
    return;
  }
  console.error('unhandled error', err);
  res.status(500).json({ error: 'internal error', detail: String((err as { message?: string })?.message ?? err) });
}
