'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { log } from '@/lib/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到日志系统
    log.error('React 错误边界捕获错误', error, {
      digest: error.digest,
      componentStack: error.stack,
    })
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">出错了</h2>
        <p className="text-muted-foreground mb-6">
          {process.env.NODE_ENV === 'development'
            ? error.message
            : '应用遇到了一个错误，请稍后重试'}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>重试</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  )
}
