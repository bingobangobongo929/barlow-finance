import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/security/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Get user for rate limiting
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
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": remaining.toString(),
          },
        }
      );
    }

    const { description, amount, type, householdId } = await request.json();

    if (!description || !householdId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get available categories
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name_en, name_da, type")
      .or(`household_id.eq.${householdId},is_system.eq.true`)
      .eq("type", type);

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { error: "No categories available" },
        { status: 400 }
      );
    }

    // Check for existing categorization rules
    const { data: rules } = await supabase
      .from("categorization_rules")
      .select("category_id, pattern")
      .eq("household_id", householdId)
      .eq("is_active", true);

    // Check if any rule matches
    const lowerDescription = description.toLowerCase();
    const matchingRule = rules?.find((rule) => {
      const pattern = rule.pattern.toLowerCase();
      return lowerDescription.includes(pattern) || pattern.includes(lowerDescription);
    });

    if (matchingRule) {
      return NextResponse.json({
        categoryId: matchingRule.category_id,
        confidence: 0.95,
        source: "rule",
      });
    }

    // Use Claude for categorization
    const categoryList = categories
      .map((c) => `- ${c.id}: ${c.name_en}`)
      .join("\n");

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Categorize this transaction:
Description: ${description}
Amount: ${amount} DKK
Type: ${type}

Available categories:
${categoryList}

Respond with only the category ID and a confidence score (0-1) in this exact format:
CATEGORY_ID: <id>
CONFIDENCE: <score>

If you're not confident (below 0.5), respond with:
CATEGORY_ID: null
CONFIDENCE: 0`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse response
    const categoryMatch = responseText.match(/CATEGORY_ID:\s*(\S+)/);
    const confidenceMatch = responseText.match(/CONFIDENCE:\s*([\d.]+)/);

    const categoryId =
      categoryMatch?.[1] !== "null" ? categoryMatch?.[1] : null;
    const confidence = confidenceMatch
      ? parseFloat(confidenceMatch[1])
      : 0;

    return NextResponse.json({
      categoryId,
      confidence,
      source: "ai",
    });
  } catch (error) {
    console.error("AI categorization error:", error);
    return NextResponse.json(
      { error: "Failed to categorize transaction" },
      { status: 500 }
    );
  }
}
