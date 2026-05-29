import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'
import { auth } from '@/lib/auth'
import { log } from '@/lib/logger'
import { AppError, AuthenticationError, AuthorizationError, ValidationError, formatErrorResponse } from '@/lib/errors'

type ApiHandler<T = unknown> = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<T>

interface ApiHandlerOptions {
  requireAuth?: boolean
  requireAdmin?: boolean
  bodySchema?: ZodSchema
}

/**
 * API 路由统一错误处理中间件
 */
export function withApiHandler<T>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {}
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()

    try {
      // 1. 认证检查
      if (options.requireAuth) {
        const session = await auth()
        if (!session?.user?.id) {
          throw new AuthenticationError()
        }

        // 管理员权限检查
        if (options.requireAdmin && session.user.role !== 'ADMIN') {
          throw new AuthorizationError('需要管理员权限')
        }

        // 将用户信息注入到 request 中
        ;(request as any).user = session.user
      }

      // 2. 请求体验证
      if (options.bodySchema && request.method !== 'GET') {
        try {
          const body = await request.json()
          const validated = options.bodySchema.parse(body)
          ;(request as any).validatedBody = validated
        } catch (error) {
          throw new ValidationError('请求参数验证失败', { error })
        }
      }

      // 3. 执行业务逻辑
      const result = await handler(request, context)

      // 4. 记录成功日志
      const duration = Date.now() - startTime
      log.info('API 请求成功', {
        requestId,
        method: request.method,
        url: request.url,
        duration,
        userId: (request as any).user?.id,
      })

      return NextResponse.json(result)

    } catch (error) {
      // 5. 错误处理
      const duration = Date.now() - startTime

      // 记录错误日志
      log.error('API 请求失败', error, {
        requestId,
        method: request.method,
        url: request.url,
        duration,
        userId: (request as any).user?.id,
      })

      // 返回错误响应
      const statusCode = error instanceof AppError ? error.statusCode : 500
      return NextResponse.json(
        formatErrorResponse(error),
        { status: statusCode }
      )
    }
  }
}
