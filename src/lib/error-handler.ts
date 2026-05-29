import { toast } from "sonner";

/**
 * 处理 API 请求错误并显示 toast
 */
export function handleApiError(error: unknown, defaultMessage: string = "操作失败") {
  // 在客户端记录错误
  if (typeof window !== "undefined") {
    console.error("API 请求失败", error);
  }

  if (error instanceof Error) {
    toast.error(error.message || defaultMessage);
  } else {
    toast.error(defaultMessage);
  }
}

/**
 * 包装异步操作，自动处理错误和 loading 状态
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    errorMessage?: string;
    successMessage?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
  } = {}
): Promise<T | null> {
  try {
    const result = await operation();

    if (options.successMessage) {
      toast.success(options.successMessage);
    }

    if (options.onSuccess) {
      options.onSuccess(result);
    }

    return result;
  } catch (error) {
    if (typeof window !== "undefined") {
      console.error("操作失败", error);
    }

    if (options.onError) {
      options.onError(error);
    } else {
      const message = options.errorMessage || "操作失败";
      if (error instanceof Error) {
        toast.error(error.message || message);
      } else {
        toast.error(message);
      }
    }

    return null;
  }
}

/**
 * 用于 React 组件的错误处理 hook
 */
export function useErrorHandler() {
  return {
    handleError: handleApiError,
    withErrorHandling,
  };
}
