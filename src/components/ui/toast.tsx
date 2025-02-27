// src/components/ui/toast.tsx
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "./use-toast";

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {children}
      <div className="fixed top-0 right-0 z-50 flex flex-col items-end p-4 space-y-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            action={toast.action}
            onClose={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </>
  );
};

const Toast = ({
  title,
  description,
  variant = "default",
  action,
  onClose,
}: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  onClose: () => void;
}) => {
  return (
    <div
      className={cn(
        "w-full max-w-md overflow-hidden rounded-lg border shadow-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5",
        {
          "bg-[var(--background)] border-[var(--primary)]/20 text-[var(--foreground)] ring-[var(--primary)]/10":
            variant === "default",
          "bg-red-50 dark:bg-red-900/20 border-red-500/20 text-red-900 dark:text-red-100 ring-red-500/10":
            variant === "destructive",
        }
      )}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="ml-3 flex-1">
            <p
              className={cn("text-sm font-medium", {
                "text-[var(--foreground)]": variant === "default",
                "text-red-900 dark:text-red-100": variant === "destructive",
              })}
            >
              {title}
            </p>
            {description && (
              <p
                className={cn("mt-1 text-sm", {
                  "text-[var(--foreground)]/80": variant === "default",
                  "text-red-800 dark:text-red-200/80": variant === "destructive",
                })}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 dark:border-gray-700">
        {action && (
          <div className="flex items-center px-3">{action}</div>
        )}
        <div className="flex">
          <button
            onClick={onClose}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500",
              {
                "hover:bg-gray-100 dark:hover:bg-gray-800": variant === "default",
                "hover:bg-red-100 dark:hover:bg-red-800": variant === "destructive",
              }
            )}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = "ToastAction";

export { ToastProvider, Toast, ToastAction };