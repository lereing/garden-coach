"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

type ToastInput = {
  message: string;
  undoLabel?: string;
  onUndo?: () => void | Promise<void>;
  durationMs?: number;
};

type ToastInstance = ToastInput & { id: string };

type ToastContextValue = {
  show: (toast: ToastInput) => void;
  dismiss: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be called inside <ToastProvider>");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastInstance | null>(null);
  const timerRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const show = useCallback<ToastContextValue["show"]>(
    (input) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      setToast({ ...input, id });
      timerRef.current = window.setTimeout(
        () => setToast(null),
        input.durationMs ?? 5000,
      );
    },
    [],
  );

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const ctx = useMemo<ToastContextValue>(
    () => ({ show, dismiss }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastViewport toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toast,
  onDismiss,
}: {
  toast: ToastInstance | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4",
        "bottom-[max(env(safe-area-inset-bottom),1rem)] sm:bottom-6",
      )}
    >
      <div
        role="status"
        aria-live="polite"
        key={toast.id}
        className={cn(
          "pointer-events-auto fade-in-soft flex w-full max-w-md items-center gap-3",
          "rounded-2xl bg-foreground px-4 py-3 text-background shadow-lg",
        )}
      >
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        {toast.onUndo && (
          <button
            type="button"
            onClick={async () => {
              const handler = toast.onUndo;
              onDismiss();
              if (handler) await handler();
            }}
            className="rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide uppercase text-background underline-offset-2 transition hover:bg-background/10"
          >
            {toast.undoLabel ?? "Undo"}
          </button>
        )}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="grid h-7 w-7 place-items-center rounded-full text-background/70 transition hover:bg-background/10 hover:text-background"
        >
          ×
        </button>
      </div>
    </div>
  );
}
