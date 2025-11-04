"use client";

import { useState } from "react";
import './animations.css';

interface RetryHandlerProps {
  onRetry: () => Promise<void> | void;
  error?: string;
  maxRetries?: number;
  children?: React.ReactNode;
  className?: string;
}

export default function RetryHandler({ 
  onRetry, 
  error, 
  maxRetries = 3, 
  children,
  className = '' 
}: RetryHandlerProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      setRetryCount(0); // Reset on success
    } catch (err) {
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  };

  const canRetry = retryCount < maxRetries;

  return (
    <div className={`space-y-4 ${className}`}>
      {children}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 progressive-fade-in">
          <div className="flex items-start gap-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Something went wrong
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
              
              {canRetry && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors smooth-transition"
                  >
                    {isRetrying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <span>🔄</span>
                        Try Again
                      </>
                    )}
                  </button>
                  
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {retryCount > 0 && `Attempt ${retryCount}/${maxRetries}`}
                  </span>
                </div>
              )}
              
              {!canRetry && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  Maximum retry attempts reached. Please refresh the page or try again later.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}