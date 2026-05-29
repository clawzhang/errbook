import { toast } from 'sonner'
import { log } from '@/lib/logger'

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 统一的 API 请求函数
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      const error = new ApiError(
        data.error?.message || '请求失败',
        data.error?.code || 'UNKNOWN_ERROR',
        response.status
      )

      // 记录错误
      log.error('API 请求失败', error, {
        url,
        method: options.method || 'GET',
        statusCode: response.status,
      })

      throw error
    }

    return data
  } catch (error) {
    // 网络错误
    if (error instanceof TypeError) {
      const networkError = new ApiError(
        '网络连接失败，请检查网络设置',
        'NETWORK_ERROR',
        0
      )
      log.error('网络错误', networkError, { url })
      throw networkError
    }

    throw error
  }
}

/**
 * 带 Toast 提示的 API 请求
 */
export async function apiRequestWithToast<T>(
  url: string,
  options: RequestInit = {},
  successMessage?: string
): Promise<T> {
  try {
    const data = await apiRequest<T>(url, options)

    if (successMessage) {
      toast.success(successMessage)
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      // 根据错误类型显示不同提示
      switch (error.code) {
        case 'AUTHENTICATION_ERROR':
          toast.error('请先登录')
          // 跳转到登录页
          window.location.href = '/login'
          break
        case 'AUTHORIZATION_ERROR':
          toast.error('权限不足')
          break
        case 'VALIDATION_ERROR':
          toast.error(error.message)
          break
        case 'NOT_FOUND':
          toast.error(error.message)
          break
        case 'NETWORK_ERROR':
          toast.error('网络连接失败，请检查网络设置')
          break
        default:
          toast.error(error.message || '操作失败，请稍后重试')
      }
    } else {
      toast.error('未知错误，请稍后重试')
    }

    throw error
  }
}
