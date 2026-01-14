import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/security/rate-limit";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Validation schema
const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ).max(20),
  financialContext: z.object({
    summary: z.object({
      totalIncome: z.number(),
      totalExpenses: z.number(),
      netCashFlow: z.number(),
      transactionCount: z.number(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }),
      averageExpense: z.number(),
      averageIncome: z.number(),
    }),
    topExpenseCategories: z.array(
      z.object({
        name: z.string(),
        total: z.number(),
        count: z.number(),
        percentage: z.number(),
      })
    ),
    incomeSources: z.array(
      z.object({
        name: z.string(),
        total: z.number(),
        count: z.number(),
        percentage: z.number(),
      })
    ),
    monthlyBreakdown: z.array(
      z.object({
        month: z.string(),
        income: z.number(),
        expenses: z.number(),
        net: z.number(),
        transactionCount: z.number(),
      })
    ),
    recurringTransactions: z.array(
      z.object({
        description: z.string(),
        averageAmount: z.number(),
        occurrences: z.number(),
        frequency: z.string(),
        type: z.string(),
      })
    ),
    anomalies: z.array(
      z.object({
        date: z.string(),
        description: z.string(),
        amount: z.number(),
        type: z.string(),
        severity: z.string(),
        message: z.string(),
      })
    ),
    recentTransactions: z.array(
      z.object({
        date: z.string(),
        description: z.string(),
        amount: z.number(),
        type: z.string(),
      })
    ).max(500),
  }),
  language: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(user.id, "ai-advisor");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before sending more messages." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { message, conversationHistory, financialContext, language } = validation.data;

    // Build context for Claude
    const lang = language === "da" ? "Danish" : "English";
    const context = financialContext;

    const systemPrompt = `You are a helpful, knowledgeable financial advisor assistant. You have access to the user's uploaded bank transaction data and should provide personalized, actionable financial insights.

IMPORTANT GUIDELINES:
- Respond in ${lang}
- Be conversational but professional
- Use specific numbers from their data when relevant
- Identify patterns and trends in their spending
- Suggest concrete, actionable improvements
- Flag any concerning patterns (unusual spending spikes, declining income, etc.)
- Compare months when it helps illustrate a point
- Never be judgmental about spending choices - be supportive and constructive
- If asked about something not in the data, acknowledge the limitation

FINANCIAL DATA SUMMARY:
- Date range: ${context.summary.dateRange.start} to ${context.summary.dateRange.end}
- Total transactions: ${context.summary.transactionCount}
- Total income: ${context.summary.totalIncome.toFixed(0)} DKK
- Total expenses: ${context.summary.totalExpenses.toFixed(0)} DKK
- Net cash flow: ${context.summary.netCashFlow.toFixed(0)} DKK
- Average expense: ${context.summary.averageExpense.toFixed(0)} DKK
- Average income: ${context.summary.averageIncome.toFixed(0)} DKK

TOP EXPENSE CATEGORIES:
${context.topExpenseCategories.slice(0, 10).map((c) => `- ${c.name}: ${c.total.toFixed(0)} DKK (${c.percentage.toFixed(1)}% of expenses, ${c.count} transactions)`).join("\n")}

INCOME SOURCES:
${context.incomeSources.slice(0, 5).map((s) => `- ${s.name}: ${s.total.toFixed(0)} DKK (${s.count} deposits)`).join("\n")}

MONTHLY BREAKDOWN:
${context.monthlyBreakdown.map((m) => `- ${m.month}: Income ${m.income.toFixed(0)} DKK, Expenses ${m.expenses.toFixed(0)} DKK, Net ${m.net.toFixed(0)} DKK`).join("\n")}

${context.recurringTransactions.length > 0 ? `
RECURRING TRANSACTIONS:
${context.recurringTransactions.slice(0, 10).map((r) => `- ${r.description}: ~${r.averageAmount.toFixed(0)} DKK (${r.frequency}, ${r.type})`).join("\n")}
` : ""}

${context.anomalies.length > 0 ? `
DETECTED ANOMALIES:
${context.anomalies.map((a) => `- ${a.message}`).join("\n")}
` : ""}

SAMPLE OF RECENT TRANSACTIONS (for specific queries):
${context.recentTransactions.slice(0, 50).map((t) => `${t.date}: ${t.description} (${t.amount > 0 ? "+" : ""}${t.amount.toFixed(0)} DKK)`).join("\n")}
`;

    // Build messages for Claude
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ];

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json(
      { response: responseText },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("AI advisor error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to get response from advisor" },
      { status: 500 }
    );
  }
}
