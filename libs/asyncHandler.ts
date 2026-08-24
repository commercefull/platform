/**
 * Wraps an async route handler so that rejected promises are forwarded
 * to Express's error middleware via next(err).
 *
 * This eliminates the need for hand-rolled try/catch blocks in controllers.
 *
 * @example
 *   router.get('/products/:id', asyncHandler(async (req, res) => {
 *     const product = await getProductUseCase.execute(req.params.id);
 *     res.json(product);
 *   }));
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asyncHandler<T extends (...args: any[]) => any>(fn: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (req: any, res: any, next: any) => {
    try {
      return await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  }) as T;
}
