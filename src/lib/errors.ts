/**
 * 应用错误基类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 验证错误（400）
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, context)
  }
}

/**
 * 认证错误（401）
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '未授权访问') {
    super(message, 'AUTHENTICATION_ERROR', 401, true)
  }
}

/**
 * 授权错误（403）
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 'AUTHORIZATION_ERROR', 403, true)
  }
}

/**
 * 资源不存在错误（404）
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}不存在`, 'NOT_FOUND', 404, true)
  }
}

/**
 * 冲突错误（409）
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, true, context)
  }
}

/**
 * 外部服务错误（502）
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: unknown) {
    super(
      `外部服务 ${service} 调用失败`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      true,
      { service, originalError }
    )
  }
}

/**
 * 格式化错误响应
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          context: error.context,
        }),
      },
    }
  }

  // 未知错误
  return {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (error instanceof Error ? error.message : String(error))
        : '服务器内部错误',
    },
  }
}
