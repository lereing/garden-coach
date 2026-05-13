"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type CoachInputProps = {
  onSubmit: (message: string) => void;
  suggestions: string[];
  disabled?: boolean;
  placeholder?: string;
};

export type CoachInputHandle = {
  focus: () => void;
};

export const CoachInput = forwardRef<CoachInputHandle, CoachInputProps>(
  function CoachInput(
    { onSubmit, suggestions, disabled, placeholder },
    ref,
  ) {
    const [value, setValue] = useState("");
    const taRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => taRef.current?.focus(),
    }));

    function submit(text: string) {
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      onSubmit(trimmed);
      setValue("");
      // Reset textarea height after sending.
      requestAnimationFrame(() => {
        if (taRef.current) taRef.current.style.height = "auto";
      });
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      submit(value);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit(value);
      }
    }

    function autosize() {
      const el = taRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }

    return (
      <div
        className="sticky bottom-0 z-30 -mx-4 border-t border-border/60 bg-background/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:bg-background/90 sm:shadow-lg"
      >
        {suggestions.length > 0 && (
          <ul className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestions.map((s) => (
              <li key={s} className="shrink-0">
                <button
                  type="button"
                  onClick={() => submit(s)}
                  disabled={disabled}
                  className="whitespace-nowrap rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition hover:border-foreground/40 hover:text-foreground disabled:opacity-60"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <label htmlFor="coach-input" className="sr-only">
            Ask the coach
          </label>
          <textarea
            id="coach-input"
            ref={taRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autosize();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Ask anything about your garden…"}
            rows={1}
            disabled={disabled}
            className="min-h-[48px] w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-foreground/30 disabled:opacity-60"
          />
          <Button
            type="submit"
            disabled={disabled || !value.trim()}
            className="h-12 shrink-0 rounded-full px-4"
            aria-label="Send"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    );
  },
);
