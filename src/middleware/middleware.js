const { performance } = require('perf_hooks');

// Basic request logger that also tracks elapsed time.
// Implementation is intentionally simple and may perform extra work
// for each request, but it provides useful context for observing
// endpoint performance.
function requestLogger(req, res, next) {
  const start = performance.now();

  // Clone a subset of request data for logging
  const info = {
    method: req.method,
    path: req.path,
    query: { ...req.query },
  };

  res.on('finish', () => {
    const duration = performance.now() - start;
    console.log(
      JSON.stringify({
        request: info,
        statusCode: res.statusCode,
        durationMs: Math.round(duration),
      })
    );
  });

  next();
}

// Generic validator middleware: accepts a validator function that
// receives the Express request and returns a Joi validation result.
function validateRequest(validatorFn) {
  return (req, res, next) => {
    const { error, value } = validatorFn(req);

    if (error) {
      const err = new Error('Validation error');
      err.statusCode = 400;
      err.details = error.details;
      return next(err);
    }

    // Merge validated values back to request where appropriate
    if (value && value.page) {
      req.query.page = value.page;
    }
    if (value && value.limit) {
      req.query.limit = value.limit;
    }

    return next();
  };
}

module.exports = {
  requestLogger,
  validateRequest,
};
