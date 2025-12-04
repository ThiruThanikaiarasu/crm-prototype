const { logger } = require('../utils/logger.util')

function responseTimeLogger(req, res, next) {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const durationNs = end - start
    const durationMs = Number(durationNs) / 1_000_000

    logger.info({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: Number(durationMs.toFixed(2))
    }, 'HTTP request completed')
  })

  next()
}

module.exports = responseTimeLogger
