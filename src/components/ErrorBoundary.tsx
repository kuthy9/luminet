import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Bug, Terminal, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { devErrorHandler } from '@/utils/developmentErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  timestamp: Date;
  userAgent: string;
  url: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: '',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for debugging
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      errorId,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Enhanced logging for development
    const errorDetails = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: this.state.timestamp,
      url: this.state.url,
      userAgent: this.state.userAgent,
      props: this.props
    };

    // Detailed console logging
    console.group(`🚨 ErrorBoundary: ${this.state.errorId}`);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Full Error Details:', errorDetails);
    console.groupEnd();

    // Store error info in sessionStorage for debugging
    if (process.env.NODE_ENV === 'development') {
      try {
        const errorHistory = JSON.parse(sessionStorage.getItem('error_history') || '[]');
        errorHistory.push(errorDetails);
        // Keep only last 10 errors
        sessionStorage.setItem('error_history', JSON.stringify(errorHistory.slice(-10)));
      } catch (e) {
        console.warn('Could not store error in sessionStorage:', e);
      }
    }
    
    this.setState({
      error,
      errorInfo,
    });

    // Integrate with development error handler (with safety check)
    try {
      if (process.env.NODE_ENV === 'development') {
        devErrorHandler.handleReactError(error, errorInfo);
      }
    } catch (handlerError) {
      console.warn('Error handler failed:', handlerError);
    }

    // Call optional error handler callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry
      // Sentry.captureException(error, { 
      //   contexts: { 
      //     react: { componentStack: errorInfo.componentStack },
      //     errorBoundary: errorDetails
      //   } 
      // });
    }
  }

  handleRetry = (): void => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: '',
      timestamp: new Date()
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  copyErrorToClipboard = async (): Promise<void> => {
    const errorReport = this.generateErrorReport();
    try {
      await navigator.clipboard.writeText(errorReport);
      console.log('Error report copied to clipboard');
    } catch (err) {
      console.error('Failed to copy error report:', err);
    }
  };

  generateErrorReport = (): string => {
    const { error, errorInfo, errorId, timestamp, url, userAgent } = this.state;
    
    return `
=== ERROR REPORT ===
Error ID: ${errorId}
Timestamp: ${timestamp.toISOString()}
URL: ${url}
User Agent: ${userAgent}

=== ERROR DETAILS ===
Message: ${error?.message || 'Unknown error'}

=== STACK TRACE ===
${error?.stack || 'No stack trace available'}

=== COMPONENT STACK ===
${errorInfo?.componentStack || 'No component stack available'}

=== REACT STATE ===
${JSON.stringify(this.state, null, 2)}
========================
    `.trim();
  };

  clearErrorHistory = (): void => {
    sessionStorage.removeItem('error_history');
    if (process.env.NODE_ENV === 'development') {
      devErrorHandler.clearErrorHistory();
    }
    console.log('Error history cleared');
  };

  showGlobalErrorSummary = (): void => {
    if (process.env.NODE_ENV === 'development') {
      devErrorHandler.printErrorSummary();
    }
  };

  exportGlobalErrors = (): void => {
    if (process.env.NODE_ENV === 'development') {
      const report = devErrorHandler.exportErrorReport();
      console.log('Global Error Report:', report);
      try {
        navigator.clipboard.writeText(report);
        console.log('Global error report copied to clipboard');
      } catch (err) {
        console.error('Failed to copy global error report:', err);
      }
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback UI is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';
      const { error, errorInfo, errorId, timestamp, url } = this.state;

      return (
        <div className="min-h-screen bg-gray-50 px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      Application Error
                      {isDevelopment && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          <Bug className="w-3 h-3 mr-1" />
                          Development Mode
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">
                      Error ID: <code className="text-sm bg-gray-100 px-2 py-1 rounded">{errorId}</code>
                    </p>
                    <p className="text-sm text-gray-500">
                      {timestamp.toLocaleString()} • {url}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Actions */}
            <Card className="mb-6">
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={this.handleRetry} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  <Button onClick={this.handleGoHome}>
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                  {isDevelopment && (
                    <>
                      <Button onClick={this.copyErrorToClipboard} variant="outline">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Error Report
                      </Button>
                      <Button onClick={this.clearErrorHistory} variant="outline" size="sm">
                        <Terminal className="w-4 h-4 mr-2" />
                        Clear Error History
                      </Button>
                      <Button onClick={this.showGlobalErrorSummary} variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Show Error Summary
                      </Button>
                      <Button onClick={this.exportGlobalErrors} variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        Export Global Errors
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Development Debug Panel */}
            {isDevelopment && error && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Debug Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="error" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="error">Error Details</TabsTrigger>
                      <TabsTrigger value="stack">Stack Trace</TabsTrigger>
                      <TabsTrigger value="component">Component Stack</TabsTrigger>
                      <TabsTrigger value="context">Context</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="error" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Error Message</h4>
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <code className="text-red-800 text-sm">{error.message}</code>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Error Type</h4>
                          <Badge variant="outline">{error.name}</Badge>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="stack">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">JavaScript Stack Trace</h4>
                        <div className="bg-gray-900 text-gray-100 rounded-md p-4 overflow-auto">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {error.stack || 'No stack trace available'}
                          </pre>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="component">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">React Component Stack</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 overflow-auto">
                          <pre className="text-xs whitespace-pre-wrap text-blue-800 font-mono">
                            {errorInfo?.componentStack || 'No component stack available'}
                          </pre>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="context" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Browser Info</h4>
                          <div className="bg-gray-50 rounded-md p-3 text-xs space-y-1">
                            <div><strong>URL:</strong> {url}</div>
                            <div><strong>User Agent:</strong> {this.state.userAgent}</div>
                            <div><strong>Timestamp:</strong> {timestamp.toISOString()}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Component Props</h4>
                          <div className="bg-gray-50 rounded-md p-3 overflow-auto">
                            <pre className="text-xs text-gray-700">
                              {JSON.stringify(this.props, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Production Error */}
            {!isDevelopment && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-600 mb-4">
                    We apologize for the inconvenience. An unexpected error has occurred and has been reported to our team.
                  </p>
                  <p className="text-sm text-gray-500">
                    Please try refreshing the page or contact support if the problem persists.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 高阶组件版本，用于包装其他组件
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Enhanced Hook for error handling in function components
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: ErrorInfo, context?: string) => {
    const errorId = `HOOK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Enhanced logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔥 useErrorHandler${context ? ` (${context})` : ''}: ${errorId}`);
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      if (errorInfo) {
        console.error('Error Info:', errorInfo);
      }
      console.error('Context:', context || 'No context provided');
      console.groupEnd();

      // Integrate with development error handler
      devErrorHandler.handleReactError(error, errorInfo || {});
    }
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
      // Example: Sentry.captureException(error, { extra: { errorInfo, context } });
    }
  }, []);
}

// 异步错误处理 Hook
export function useAsyncError() {
  const [, setError] = React.useState();
  
  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    []
  );
}
