import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Primary coach model — used for the chat loop. Opus 4.7 has the best
// reasoning for grounding advice in the user's specific context; the
// extra token cost over Sonnet is acceptable while we tune behavior.
export const COACH_MODEL = "claude-opus-4-7";

// Cheaper model for ancillary calls (summarization, classifiers, etc).
// Currently unused at runtime; kept here so future paths can opt in.
export const COACH_MODEL_FAST = "claude-sonnet-4-5";
