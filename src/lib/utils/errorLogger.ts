interface ErrorLogEntry {
  timestamp: string;
  error: string;
  stack?: string;
  userAgent: string;
  url: string;
  userId?: string;
  artistId?: string;
  component?: string;
  level: 'error' | 'warning' | 'info';
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(
    error: Error | string, 
    context?: {
      artistId?: string;
      component?: string;
      level?: 'error' | 'warning' | 'info';
      userId?: string;
    }
  ) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      level: context?.level || 'error',
      ...context
    };

    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`[${entry.level.toUpperCase()}] ${entry.component || 'Unknown Component'}`);
      console.error('Error:', entry.error);
      if (entry.stack) {
        console.error('Stack:', entry.stack);
      }
    }

    // In production, you might want to send to an error tracking service
    if (process.env.NODE_ENV === 'production' && entry.level === 'error') {
      this.sendToErrorService(entry);
    }
  }

  private async sendToErrorService(entry: ErrorLogEntry) {
    try {
      // Example: Send to your error tracking service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (error) {
      console.error('Failed to send error to tracking service:', error);
    }
  }

  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  getLogsByComponent(component: string): ErrorLogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  getLogsByArtist(artistId: string): ErrorLogEntry[] {
    return this.logs.filter(log => log.artistId === artistId);
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Convenience functions
export const logError = (error: Error | string, context?: Parameters<typeof errorLogger.log>[1]) => {
  errorLogger.log(error, { ...context, level: 'error' });
};

export const logWarning = (error: Error | string, context?: Parameters<typeof errorLogger.log>[1]) => {
  errorLogger.log(error, { ...context, level: 'warning' });
};

export const logInfo = (error: Error | string, context?: Parameters<typeof errorLogger.log>[1]) => {
  errorLogger.log(error, { ...context, level: 'info' });
};