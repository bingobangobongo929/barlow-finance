import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BudgetsContent } from "./budgets-content";

interface BudgetsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BudgetsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "budgets" });
  return {
    title: t("title"),
  };
}

export default async function BudgetsPage({ params }: BudgetsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile with household
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, household:households(*)")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    redirect("/register");
  }

  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get budgets with spent amounts
  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: false });

  // Get categories for budget creation
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`household_id.eq.${profile.household_id},is_system.eq.true`)
    .eq("type", "expense")
    .order("name");

  // Calculate spent amounts for each budget
  const budgetsWithSpent = await Promise.all(
    (budgets || []).map(async (budget) => {
      // Determine the budget period start/end
      let periodStart: Date;
      let periodEnd: Date;

      if (budget.period === "monthly") {
        periodStart = startOfMonth;
        periodEnd = endOfMonth;
      } else if (budget.period === "weekly") {
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is start
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - diff);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
      } else if (budget.period === "yearly") {
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
      } else {
        // Custom period
        periodStart = new Date(budget.start_date || startOfMonth);
        periodEnd = budget.end_date ? new Date(budget.end_date) : endOfMonth;
      }

      // Get transactions for this budget's category in the period
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount")
        .eq("household_id", profile.household_id)
        .eq("category_id", budget.category_id)
        .eq("type", "expense")
        .gte("transaction_date", periodStart.toISOString().split("T")[0])
        .lte("transaction_date", periodEnd.toISOString().split("T")[0]);

      const spent = (transactions || []).reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0
      );

      return {
        ...budget,
        spent,
        periodStart: periodStart.toISOString().split("T")[0],
        periodEnd: periodEnd.toISOString().split("T")[0],
      };
    })
  );

  return (
    <BudgetsContent
      budgets={budgetsWithSpent}
      categories={categories || []}
      locale={locale as "en" | "da"}
      householdId={profile.household_id}
    />
  );
}
