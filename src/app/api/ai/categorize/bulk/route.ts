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

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(
      user.id,
      "ai-categorize"
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const { transactions, householdId } = await request.json();

    if (!transactions || !Array.isArray(transactions) || !householdId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Limit batch size
    const batch = transactions.slice(0, 50);

    // Get available categories
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, name_da, type")
      .or(`household_id.eq.${householdId},is_system.eq.true`);

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { error: "No categories available" },
        { status: 400 }
      );
    }

    // Get categorization rules
    const { data: rules } = await supabase
      .from("categorization_rules")
      .select("category_id, pattern")
      .eq("household_id", householdId)
      .eq("is_active", true);

    const results: Array<{
      transactionId: string;
      categoryId: string | null;
      confidence: number;
    }> = [];

    // First, check rules for all transactions
    const transactionsNeedingAI: typeof batch = [];

    for (const tx of batch) {
      const lowerDescription = tx.description.toLowerCase();
      const matchingRule = rules?.find((rule) => {
        const pattern = rule.pattern.toLowerCase();
        return (
          lowerDescription.includes(pattern) ||
          pattern.includes(lowerDescription)
        );
      });

      if (matchingRule) {
        results.push({
          transactionId: tx.id,
          categoryId: matchingRule.category_id,
          confidence: 0.95,
        });
      } else {
        transactionsNeedingAI.push(tx);
      }
    }

    // Use AI for remaining transactions
    if (transactionsNeedingAI.length > 0) {
      const expenseCategories = categories.filter((c) => c.type === "expense");
      const incomeCategories = categories.filter((c) => c.type === "income");

      const categoryListExpense = expenseCategories
        .map((c) => `${c.id}: ${c.name}`)
        .join(", ");
      const categoryListIncome = incomeCategories
        .map((c) => `${c.id}: ${c.name}`)
        .join(", ");

      const transactionsList = transactionsNeedingAI
        .map(
          (tx, i) =>
            `${i + 1}. [${tx.id}] "${tx.description}" (${tx.type}, ${tx.amount} DKK)`
        )
        .join("\n");

      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `Categorize these transactions. For each transaction, provide the category ID and confidence (0-1).

Expense categories: ${categoryListExpense}
Income categories: ${categoryListIncome}

Transactions:
${transactionsList}

Respond with one line per transaction in this exact format:
[transaction_id]: category_id, confidence

Example:
[abc-123]: cat_food, 0.9
[def-456]: cat_salary, 0.85

If uncertain, use "null" as category_id with confidence 0.`,
          },
        ],
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      // Parse response
      const lines = responseText.split("\n").filter((line) => line.trim());
      for (const line of lines) {
        const match = line.match(/\[([^\]]+)\]:\s*(\S+),\s*([\d.]+)/);
        if (match) {
          const [, txId, categoryId, confidenceStr] = match;
          const confidence = parseFloat(confidenceStr);
          results.push({
            transactionId: txId,
            categoryId: categoryId !== "null" ? categoryId : null,
            confidence,
          });
        }
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Bulk AI categorization error:", error);
    return NextResponse.json(
      { error: "Failed to categorize transactions" },
      { status: 500 }
    );
  }
}
