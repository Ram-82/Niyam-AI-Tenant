export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);
  if (err.stack && process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors,
    });
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    error: true,
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
}
