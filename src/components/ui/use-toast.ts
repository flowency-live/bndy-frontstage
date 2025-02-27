// src/components/ui/use-toast.ts
import { useState, useEffect, useRef } from "react";

export type ToastVariant = "default" | "destructive";

export interface ToastProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = props.duration || 5000;
    
    setToasts((prev) => [...prev, { ...props, id }]);
    
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimeoutsRef.current.delete(id);
    }, duration);
    
    toastTimeoutsRef.current.set(id, timeout);
    
    return id;
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    
    if (toastTimeoutsRef.current.has(id)) {
      clearTimeout(toastTimeoutsRef.current.get(id)!);
      toastTimeoutsRef.current.delete(id);
    }
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}

export interface ToastActionElement {
  altText: string;
  onClick: () => void;
  children?: React.ReactNode;
}

export type ToastAction = React.ReactElement<ToastActionElement>;