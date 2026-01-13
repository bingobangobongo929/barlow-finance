import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "./dashboard-content";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return {
    title: t("title"),
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  // Get dashboard data in parallel
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    { data: currentMonthTransactions },
    { data: lastMonthTransactions },
    { data: recentTransactions },
    { data: upcomingExpenses },
    { data: budgets },
    { data: projects },
    { data: insights },
  ] = await Promise.all([
    // Current month transactions for stats
    supabase
      .from("transactions")
      .select("amount, type")
      .eq("household_id", profile.household_id)
      .gte("transaction_date", startOfMonth.toISOString().split("T")[0])
      .lte("transaction_date", endOfMonth.toISOString().split("T")[0]),

    // Last month transactions for comparison
    supabase
      .from("transactions")
      .select("amount, type")
      .eq("household_id", profile.household_id)
      .gte("transaction_date", startOfLastMonth.toISOString().split("T")[0])
      .lte("transaction_date", endOfLastMonth.toISOString().split("T")[0]),

    // Recent transactions
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .eq("household_id", profile.household_id)
      .order("transaction_date", { ascending: false })
      .limit(10),

    // Upcoming expenses (next 30 days)
    supabase
      .from("upcoming_expenses")
      .select("*, category:categories(*)")
      .eq("household_id", profile.household_id)
      .eq("is_paid", false)
      .gte("due_date", now.toISOString().split("T")[0])
      .lte("due_date", new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("due_date", { ascending: true })
      .limit(5),

    // Active budgets with spent amounts
    supabase
      .from("budgets")
      .select("*, category:categories(*)")
      .eq("household_id", profile.household_id)
      .eq("is_active", true),

    // Active projects
    supabase
      .from("projects")
      .select("*")
      .eq("household_id", profile.household_id)
      .eq("status", "active")
      .order("priority", { ascending: true })
      .limit(4),

    // Recent AI insights
    supabase
      .from("ai_insights")
      .select("*")
      .eq("household_id", profile.household_id)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  // Calculate stats
  const currentIncome = (currentMonthTransactions || [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const currentExpenses = (currentMonthTransactions || [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const lastIncome = (lastMonthTransactions || [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const lastExpenses = (lastMonthTransactions || [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const stats = {
    income: currentIncome,
    expenses: currentExpenses,
    netFlow: currentIncome - currentExpenses,
    savingsRate: currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0,
    incomeChange: lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0,
    expensesChange: lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0,
  };

  return (
    <DashboardContent
      profile={profile}
      stats={stats}
      recentTransactions={recentTransactions || []}
      upcomingExpenses={upcomingExpenses || []}
      budgets={budgets || []}
      projects={projects || []}
      insight={insights?.[0] || null}
      locale={locale as "en" | "da"}
    />
  );
}
