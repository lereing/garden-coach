// Direct invocation of the coach tool-use loop, bypassing HTTP/SSE
// for diagnostics. Seeds a small set of plantings/logs for the user
// if none exist, then runs the four canonical scenarios from the
// build spec and prints each tool call + final response.
//
// Run:  pnpm test-coach [user-email]
// Defaults to lereing@hey.com (the dev account).

import Anthropic from "@anthropic-ai/sdk";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { anthropic, COACH_MODEL } from "@/lib/coach/client";
import { buildSystemPrompt } from "@/lib/coach/prompts";
import { executeCoachTool, TOOL_SPECS } from "@/lib/coach/tools";
import type { Database } from "@/lib/types/database";

const USER_EMAIL = process.argv[2] ?? "lereing@hey.com";

const SCENARIOS = [
  "What should I plant in the next two weeks?",
  "Should I water my tomatoes today?",
  "Why did my basil keep dying?",
  "What's a good companion for my peppers?",
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Set ANTHROPIC_API_KEY (use --env-file=.env.local).",
    );
  }

  const sb = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userId = await resolveUserId(sb, USER_EMAIL);
  console.log(`User: ${USER_EMAIL} (${userId})\n`);

  await seedScenarioData(sb, userId);

  for (let i = 0; i < SCENARIOS.length; i++) {
    const prompt = SCENARIOS[i];
    console.log("=".repeat(72));
    console.log(`SCENARIO ${i + 1}: ${prompt}`);
    console.log("=".repeat(72));
    await runScenario(sb, userId, prompt);
    console.log();
  }
}

async function resolveUserId(
  sb: SupabaseClient<Database>,
  email: string,
): Promise<string> {
  // auth.admin.listUsers iterates the auth schema directly.
  const { data, error } = await sb.auth.admin.listUsers();
  if (error) throw error;
  const u = data.users.find((u) => u.email === email);
  if (!u) throw new Error(`No user found with email ${email}`);
  return u.id;
}

// Make sure the user has tomatoes (for scenario 2), peppers (for 4),
// and a failed basil (for 3). Inserts only if missing.
async function seedScenarioData(
  sb: SupabaseClient<Database>,
  userId: string,
) {
  const wanted: Array<{
    plant: string;
    status: "active" | "failed";
    variety?: string;
    failure_reason?: string;
    daysAgo: number;
  }> = [
    { plant: "Tomato", status: "active", variety: "Sungold", daysAgo: 14 },
    {
      plant: "Sweet Pepper",
      status: "active",
      variety: "Lipstick",
      daysAgo: 21,
    },
    {
      plant: "Basil",
      status: "failed",
      variety: "Genovese",
      failure_reason: "wilted; soil dried out repeatedly during a heat wave",
      daysAgo: 60,
    },
  ];

  // Map plant common name → id from catalog.
  const { data: plants } = await sb
    .from("plants")
    .select("id, common_name")
    .in(
      "common_name",
      wanted.map((w) => w.plant),
    );
  const plantId = new Map<string, string>();
  for (const p of plants ?? []) plantId.set(p.common_name, p.id);

  for (const w of wanted) {
    const pid = plantId.get(w.plant);
    if (!pid) continue;
    // Already exists?
    const { data: existing } = await sb
      .from("plantings")
      .select("id")
      .eq("user_id", userId)
      .eq("plant_id", pid)
      .eq("status", w.status)
      .maybeSingle();
    if (existing) continue;

    const plantedAt = new Date(Date.now() - w.daysAgo * 86400 * 1000);
    const plantedDate = plantedAt.toISOString().slice(0, 10);

    const { data: created } = await sb
      .from("plantings")
      .insert({
        user_id: userId,
        plant_id: pid,
        variety: w.variety ?? null,
        planted_date: plantedDate,
        status: w.status,
        failure_reason: w.failure_reason ?? null,
      })
      .select("id")
      .single();
    if (!created) continue;

    if (w.plant === "Tomato" && w.status === "active") {
      // Last watered 4 days ago — within the needs-water window.
      const wateredAt = new Date(Date.now() - 4 * 86400 * 1000);
      await sb.from("logs").insert({
        user_id: userId,
        planting_id: created.id,
        type: "water",
        logged_at: wateredAt.toISOString(),
      });
    }
    console.log(`  · seeded ${w.status} ${w.plant}`);
  }
}

async function runScenario(
  sb: SupabaseClient<Database>,
  userId: string,
  prompt: string,
) {
  const system = buildSystemPrompt({ today: new Date(), earlierTurns: [] });
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt },
  ];
  const toolsUsed: string[] = [];

  for (let i = 0; i < 8; i++) {
    const res = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 1024,
      system,
      messages,
      tools: TOOL_SPECS,
    });
    messages.push({ role: "assistant", content: res.content });

    if (res.stop_reason === "tool_use") {
      const toolBlocks = res.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolBlocks) {
        toolsUsed.push(block.name);
        console.log(
          `  → ${block.name}(${shortenJson(block.input)})`,
        );
        const result = await executeCoachTool(
          block.name,
          block.input,
          sb,
          userId,
        );
        const summary = result.ok
          ? summarize(result.data)
          : `error: ${result.error}`;
        console.log(`    ← ${summary}`);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(
            result.ok ? result.data : { error: result.error },
          ),
          is_error: !result.ok,
        });
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    const finalText = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    console.log("\nFinal response:");
    console.log(indent(finalText));
    console.log(`\nTools used: ${toolsUsed.join(", ") || "(none)"}`);
    return;
  }
}

function shortenJson(v: unknown): string {
  const s = JSON.stringify(v);
  return s.length <= 80 ? s : s.slice(0, 77) + "…";
}

function summarize(v: unknown): string {
  if (Array.isArray(v)) return `array(${v.length})`;
  if (v && typeof v === "object") {
    const keys = Object.keys(v as object);
    return `object{${keys.slice(0, 6).join(",")}${keys.length > 6 ? ",…" : ""}}`;
  }
  return String(v).slice(0, 80);
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
}

main().catch((e) => {
  console.error("\nFatal:", e);
  process.exit(1);
});
