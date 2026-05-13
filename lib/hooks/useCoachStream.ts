"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_METADATA,
  type ChatMessageInput,
  type CoachMetadata,
  type StreamEvent,
  type ToolName,
} from "@/lib/coach/types";
import type { CoachFeedback } from "@/lib/types/database";

// ---------------------------------------------------------------------
// Turn shape — what the conversation renders against.
// ---------------------------------------------------------------------

export type UserTurn = {
  id: string;
  role: "user";
  content: string;
};

export type AssistantTurn = {
  id: string;
  role: "assistant";
  content: string;
  sessionId: string | null;
  toolsUsed: ToolName[];
  metadata: CoachMetadata;
  feedback: CoachFeedback | null;
  /** "streaming" while we're actively reading SSE; "thinking" when */
  /** more than `THINKING_AFTER_MS` has passed with no text yet. */
  status: "streaming" | "thinking" | "complete" | "error";
  /** Tools currently being executed (set by tool_start, cleared by tool_complete). */
  activeTools: ToolName[];
  errorMessage?: string;
  /** When the assistant turn first appeared client-side. Used to delay feedback icons. */
  startedAt: number;
  /** Set when the user has confirmed the action prompt (friction surface). */
  actionConfirmed?: boolean;
};

export type Turn = UserTurn | AssistantTurn;

// ---------------------------------------------------------------------
// Initial state — usually built from the last 24h of coach_sessions on
// the server and passed into the hook as `initialTurns`.
// ---------------------------------------------------------------------

const THINKING_AFTER_MS = 2000;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

type UseCoachStreamOptions = {
  initialTurns?: Turn[];
};

export function useCoachStream({ initialTurns = [] }: UseCoachStreamOptions = {}) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const thinkingTimerRef = useRef<number | null>(null);
  const turnsRef = useRef<Turn[]>(turns);
  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  // Cancel any in-flight stream on unmount so we don't leak a fetch.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (thinkingTimerRef.current !== null) {
        window.clearTimeout(thinkingTimerRef.current);
      }
    };
  }, []);

  const updateAssistant = useCallback(
    (id: string, patch: (turn: AssistantTurn) => AssistantTurn) => {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id && t.role === "assistant" ? patch(t) : t,
        ),
      );
    },
    [],
  );

  const send = useCallback(
    async (message: string) => {
      const text = message.trim();
      if (!text || isStreaming) return;

      // History sent up the wire is just the prior turns as flat strings.
      const history: ChatMessageInput[] = turns.map((t) => ({
        role: t.role,
        content: t.role === "assistant" ? t.content : t.content,
      }));

      const userId = newId();
      const assistantId = newId();
      const startedAt = Date.now();

      setTurns((prev) => [
        ...prev,
        { id: userId, role: "user", content: text },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          sessionId: null,
          toolsUsed: [],
          metadata: DEFAULT_METADATA,
          feedback: null,
          status: "streaming",
          activeTools: [],
          startedAt,
        },
      ]);
      setIsStreaming(true);
      setError(null);

      // "Thinking" pill if no text in the first 2s (tools-only phase).
      if (thinkingTimerRef.current !== null) {
        window.clearTimeout(thinkingTimerRef.current);
      }
      thinkingTimerRef.current = window.setTimeout(() => {
        updateAssistant(assistantId, (t) =>
          t.status === "streaming" && !t.content
            ? { ...t, status: "thinking" }
            : t,
        );
      }, THINKING_AFTER_MS);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/coach/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: text, history }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const errBody = await res.json().catch(() => ({}));
          const message =
            typeof errBody.message === "string"
              ? errBody.message
              : "Coach is unavailable right now.";
          updateAssistant(assistantId, (t) => ({
            ...t,
            status: "error",
            errorMessage: message,
          }));
          setError(message);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const onEvent = (evt: StreamEvent) => {
          if (evt.type === "text") {
            // First text delta cancels the "thinking" timer.
            if (thinkingTimerRef.current !== null) {
              window.clearTimeout(thinkingTimerRef.current);
              thinkingTimerRef.current = null;
            }
            updateAssistant(assistantId, (t) => ({
              ...t,
              content: t.content + evt.delta,
              status: "streaming",
            }));
          } else if (evt.type === "tool_start") {
            updateAssistant(assistantId, (t) => ({
              ...t,
              activeTools: t.activeTools.includes(evt.name)
                ? t.activeTools
                : [...t.activeTools, evt.name],
              toolsUsed: t.toolsUsed.includes(evt.name)
                ? t.toolsUsed
                : [...t.toolsUsed, evt.name],
            }));
          } else if (evt.type === "tool_complete") {
            updateAssistant(assistantId, (t) => ({
              ...t,
              activeTools: t.activeTools.filter((n) => n !== evt.name),
            }));
          } else if (evt.type === "metadata") {
            updateAssistant(assistantId, (t) => ({
              ...t,
              metadata: evt.metadata,
            }));
          } else if (evt.type === "done") {
            updateAssistant(assistantId, (t) => ({
              ...t,
              sessionId: evt.session_id || null,
              toolsUsed: evt.tools_used,
              status: "complete",
              activeTools: [],
            }));
          } else if (evt.type === "error") {
            updateAssistant(assistantId, (t) => ({
              ...t,
              status: "error",
              errorMessage: evt.message,
            }));
            setError(evt.message);
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE messages are separated by blank lines.
          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const block = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            let dataLine = "";
            for (const line of block.split("\n")) {
              if (line.startsWith("data:")) dataLine = line.slice(5).trim();
            }
            if (!dataLine) continue;
            try {
              onEvent(JSON.parse(dataLine) as StreamEvent);
            } catch {
              // Malformed line — server should never emit one, ignore.
            }
          }
        }

        // If the stream closed without a `done` event, finalize anyway.
        updateAssistant(assistantId, (t) =>
          t.status === "streaming" || t.status === "thinking"
            ? { ...t, status: "complete" }
            : t,
        );
      } catch (err) {
        if (
          err instanceof DOMException &&
          (err.name === "AbortError" || err.name === "AbortError")
        ) {
          // Aborted on unmount; ignore.
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Network error reaching the coach.";
        updateAssistant(assistantId, (t) => ({
          ...t,
          status: "error",
          errorMessage: message,
        }));
        setError(message);
      } finally {
        if (thinkingTimerRef.current !== null) {
          window.clearTimeout(thinkingTimerRef.current);
          thinkingTimerRef.current = null;
        }
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, turns, updateAssistant],
  );

  const recordFeedback = useCallback(
    async (turnId: string, feedback: CoachFeedback) => {
      const turn = turnsRef.current.find(
        (t): t is AssistantTurn => t.id === turnId && t.role === "assistant",
      );
      if (!turn?.sessionId) return;

      // Optimistic: highlight the picked icon immediately.
      updateAssistant(turnId, (t) => ({ ...t, feedback }));

      try {
        const res = await fetch("/api/coach/feedback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            session_id: turn.sessionId,
            feedback,
          }),
        });
        if (!res.ok) {
          // Roll back if the server rejected.
          updateAssistant(turnId, (t) => ({ ...t, feedback: null }));
        }
      } catch {
        updateAssistant(turnId, (t) => ({ ...t, feedback: null }));
      }
    },
    [updateAssistant],
  );

  const confirmAction = useCallback(
    async (turnId: string, actionType: string = "unspecified") => {
      const turn = turnsRef.current.find(
        (t): t is AssistantTurn => t.id === turnId && t.role === "assistant",
      );
      const sessionId = turn?.sessionId ?? null;
      if (!sessionId) return;

      // Optimistic flip so the friction button disappears.
      updateAssistant(turnId, (t) => ({ ...t, actionConfirmed: true }));

      try {
        await fetch("/api/coach/action", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            action_type: actionType,
          }),
        });
      } catch {
        // Best-effort: leave the optimistic state and let the user
        // try again from a follow-up message.
      }
    },
    [updateAssistant],
  );

  const dismissAction = useCallback(
    (turnId: string) => {
      updateAssistant(turnId, (t) => ({ ...t, actionConfirmed: false }));
    },
    [updateAssistant],
  );

  return {
    turns,
    isStreaming,
    error,
    send,
    recordFeedback,
    confirmAction,
    dismissAction,
  };
}
