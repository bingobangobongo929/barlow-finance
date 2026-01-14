import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/security/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

    const { allowed } = await checkRateLimit(user.id, "ai-insights");
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const { language = "en" } = await request.json();

    // Get user's household - SECURITY: Don't trust client-provided householdId
    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", user.id)
      .single();

    if (!profile?.household_id) {
      return NextResponse.json(
        { error: "User not associated with a household" },
        { status: 403 }
      );
    }

    const householdId = profile.household_id;

    // Get language preference - default to English
    const lang = language === "da" ? "Danish" : "English";

    // Get recent transactions for analysis
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [{ data: recentTransactions }, { data: priorTransactions }] =
      await Promise.all([
        supabase
          .from("transactions")
          .select("amount, type, category:categories(name)")
          .eq("household_id", householdId)
          .gte("transaction_date", thirtyDaysAgo.toISOString().split("T")[0])
          .lte("transaction_date", now.toISOString().split("T")[0]),
        supabase
          .from("transactions")
          .select("amount, type, category:categories(name)")
          .eq("household_id", householdId)
          .gte("transaction_date", sixtyDaysAgo.toISOString().split("T")[0])
          .lt("transaction_date", thirtyDaysAgo.toISOString().split("T")[0]),
      ]);

    if (!recentTransactions || recentTransactions.length === 0) {
      return NextResponse.json({ insights: [] });
    }

    // Calculate summaries
    const recentIncome = recentTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const recentExpenses = recentTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const priorIncome = (priorTransactions || [])
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const priorExpenses = (priorTransactions || [])
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    // Category breakdown for recent period
    const categoryBreakdown: { [key: string]: number } = {};
    recentTransactions
      .filter((t) => t.type === "expense" && t.category)
      .forEach((t: any) => {
        const categoryName = t.category.name || "Uncategorized";
        categoryBreakdown[categoryName] =
          (categoryBreakdown[categoryName] || 0) + Math.abs(Number(t.amount));
      });

    const topCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => `${name}: ${amount.toFixed(0)} DKK`)
      .join(", ");

    // Generate insights using Claude
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Analyze this household financial data and provide 1-2 brief, actionable insights in JSON format. IMPORTANT: Respond in ${lang}.

Last 30 days:
- Income: ${recentIncome.toFixed(0)} DKK
- Expenses: ${recentExpenses.toFixed(0)} DKK
- Top expense categories: ${topCategories}

Previous 30 days:
- Income: ${priorIncome.toFixed(0)} DKK
- Expenses: ${priorExpenses.toFixed(0)} DKK

Respond with a JSON array of insights in ${lang}. Each insight should have:
- "type": one of "spending_pattern", "saving_opportunity", "unusual_activity", "budget_alert", "milestone"
- "title": short title in ${lang} (max 50 chars)
- "content": brief description in ${lang} (max 150 chars)
- "priority": "high", "medium", or "low"

Example (in English):
[{"type": "spending_pattern", "title": "Dining out increased", "content": "Restaurant spending is up 30% this month. Consider cooking more at home.", "priority": "medium"}]`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    // Parse JSON response
    let insights = [];
    try {
      // Find JSON array in response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI insights:", parseError instanceof Error ? parseError.message : "Unknown error");
    }

    // Store insights in database
    for (const insight of insights) {
      await supabase.from("ai_insights").insert({
        household_id: householdId,
        type: insight.type,
        title: insight.title,
        content: insight.content,
        data: {
          generated: new Date().toISOString(),
          priority: insight.priority,
          language: language
        },
      });
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("AI insights error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
