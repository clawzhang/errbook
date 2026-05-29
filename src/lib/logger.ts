import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

// 结构化日志工具
export const log = {
  info: (message: string, context?: Record<string, unknown>) => {
    logger.info({ ...context }, message)
  },

  error: (message: string, error: unknown, context?: Record<string, unknown>) => {
    logger.error({
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    }, message)
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    logger.warn({ ...context }, message)
  },

  debug: (message: string, context?: Record<string, unknown>) => {
    logger.debug({ ...context }, message)
  },
}

export default logger
