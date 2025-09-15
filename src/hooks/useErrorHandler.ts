import { useCallback } from 'react';
import { 
  globalErrorHandler, 
  AppError, 
  ErrorType, 
  ErrorSeverity,
  handleNetworkError,
  handleAuthError,
  handleValidationError,
  handlePermissionError
} from '@/lib/errorHandler';
import { toast } from '@/components/ui/use-toast';

// Hook for handling errors in components
export const useErrorHandler = () => {
  // Generic error handler
  const handleError = useCallback((error: Error | AppError, showToast = true) => {
    globalErrorHandler.handleError(error, { showToast });
  }, []);

  // Specific error handlers
  const handleNetworkErrorWithToast = useCallback((message: string, context?: Record<string, any>) => {
    handleNetworkError(message, context);
  }, []);

  const handleAuthErrorWithToast = useCallback((message: string, context?: Record<string, any>) => {
    handleAuthError(message, context);
  }, []);

  const handleValidationErrorWithToast = useCallback((message: string, context?: Record<string, any>) => {
    handleValidationError(message, context);
  }, []);

  const handlePermissionErrorWithToast = useCallback((message: string, context?: Record<string, any>) => {
    handlePermissionError(message, context);
  }, []);

  // Async operation wrapper with error handling
  const withErrorHandling = useCallback(<T>(
    asyncFn: () => Promise<T>,
    options?: {
      onError?: (error: Error) => void;
      showToast?: boolean;
      fallbackMessage?: string;
    }
  ) => {
    return async (): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        
        if (options?.onError) {
          options.onError(error as Error);
        } else {
          handleError(error as Error, options?.showToast ?? true);
        }
        
        return null;
      }
    };
  }, [handleError]);

  // Supabase error handler
  const handleSupabaseError = useCallback((error: any, operation: string) => {
    let errorType = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let message = error?.message || 'Database operation failed';

    // Categorize Supabase errors
    if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
      errorType = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
      message = 'Authentication expired. Please sign in again.';
    } else if (error?.code === 'PGRST116') {
      errorType = ErrorType.PERMISSION;
      severity = ErrorSeverity.MEDIUM;
      message = 'You don\'t have permission to perform this action.';
    } else if (error?.code?.startsWith('23')) {
      errorType = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
      message = 'Invalid data provided. Please check your input.';
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      errorType = ErrorType.NETWORK;
      severity = ErrorSeverity.MEDIUM;
      message = 'Network error. Please check your connection.';
    }

    const appError = new AppError(
      message,
      errorType,
      severity,
      error?.code,
      { operation, originalError: error }
    );

    handleError(appError);
  }, [handleError]);

  // Form validation error handler
  const handleFormErrors = useCallback((errors: Record<string, any>) => {
    const errorMessages = Object.entries(errors)
      .map(([field, error]) => `${field}: ${error.message || error}`)
      .join(', ');

    const appError = new AppError(
      `Validation failed: ${errorMessages}`,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      'FORM_VALIDATION',
      { errors }
    );

    handleError(appError);
  }, [handleError]);

  // API error handler
  const handleApiError = useCallback((error: any, endpoint: string) => {
    let errorType = ErrorType.SERVER;
    let severity = ErrorSeverity.MEDIUM;
    let message = 'Server error occurred';

    if (error?.status) {
      switch (Math.floor(error.status / 100)) {
        case 4:
          if (error.status === 401) {
            errorType = ErrorType.AUTHENTICATION;
            severity = ErrorSeverity.HIGH;
            message = 'Authentication required';
          } else if (error.status === 403) {
            errorType = ErrorType.PERMISSION;
            message = 'Access forbidden';
          } else if (error.status === 404) {
            errorType = ErrorType.NOT_FOUND;
            severity = ErrorSeverity.LOW;
            message = 'Resource not found';
          } else {
            errorType = ErrorType.CLIENT;
            message = 'Invalid request';
          }
          break;
        case 5:
          errorType = ErrorType.SERVER;
          severity = ErrorSeverity.HIGH;
          message = 'Server error occurred';
          break;
        default:
          message = error?.message || 'API request failed';
      }
    }

    const appError = new AppError(
      message,
      errorType,
      severity,
      error?.status?.toString(),
      { endpoint, originalError: error }
    );

    handleError(appError);
  }, [handleError]);

  // Success toast helper
  const showSuccess = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'default',
    });
  }, []);

  // Warning toast helper
  const showWarning = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'destructive',
    });
  }, []);

  return {
    handleError,
    handleNetworkError: handleNetworkErrorWithToast,
    handleAuthError: handleAuthErrorWithToast,
    handleValidationError: handleValidationErrorWithToast,
    handlePermissionError: handlePermissionErrorWithToast,
    handleSupabaseError,
    handleFormErrors,
    handleApiError,
    withErrorHandling,
    showSuccess,
    showWarning,
  };
};

// Hook for error recovery
export const useErrorRecovery = () => {
  const { handleError } = useErrorHandler();

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T | null> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          handleError(lastError);
          return null;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    return null;
  }, [handleError]);

  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000
  ): Promise<T | null> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          handleError(lastError);
          return null;
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
          maxDelay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return null;
  }, [handleError]);

  return {
    retry,
    retryWithBackoff,
  };
};

export default useErrorHandler;
