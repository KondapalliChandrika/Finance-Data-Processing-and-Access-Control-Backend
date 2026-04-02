/**
 * Global error handler middleware.
 * Catches any error passed to next(err) and returns a consistent JSON response.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
    console.error('[ERROR]', err.message);

    // Validation errors from express-validator passed manually
    if (err.status && err.errors) {
        return res.status(err.status).json({
            success: false,
            message: err.message || 'Validation failed',
            errors: err.errors,
        });
    }

    // PostgreSQL unique constraint violation
    if (err.code === '23505') {
        return res.status(409).json({ success: false, message: 'A record with that value already exists.' });
    }

    // PostgreSQL foreign key violation
    if (err.code === '23503') {
        return res.status(400).json({ success: false, message: 'Referenced resource does not exist.' });
    }

    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error',
    });
}

module.exports = errorHandler;
