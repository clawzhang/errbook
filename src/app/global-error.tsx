'use client'

import { useEffect } from 'react'
import { log } from '@/lib/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    log.error('全局错误边界捕获错误', error, {
      digest: error.digest,
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">应用崩溃了</h2>
          <button onClick={reset}>重新加载</button>
        </div>
      </body>
    </html>
  )
}
