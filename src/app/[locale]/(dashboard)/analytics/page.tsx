import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsContent } from "./analytics-content";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

interface AnalyticsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    period?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export async function generateMetadata({ params }: AnalyticsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "analytics" });
  return {
    title: t("title"),
  };
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: AnalyticsPageProps) {
  const { locale } = await params;
  const search = await searchParams;
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

  // Determine date range based on period
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  const period = search.period || "6months";

  if (search.startDate && search.endDate) {
    startDate = new Date(search.startDate);
    endDate = new Date(search.endDate);
  } else {
    switch (period) {
      case "1month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "3months":
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
      case "6months":
        startDate = startOfMonth(subMonths(now, 5));
        endDate = endOfMonth(now);
        break;
      case "1year":
        startDate = startOfMonth(subMonths(now, 11));
        endDate = endOfMonth(now);
        break;
      default:
        startDate = startOfMonth(subMonths(now, 5));
        endDate = endOfMonth(now);
    }
  }

  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  // Fetch all transactions for the period
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("household_id", profile.household_id)
    .gte("transaction_date", startDateStr)
    .lte("transaction_date", endDateStr)
    .order("transaction_date", { ascending: true });

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`household_id.eq.${profile.household_id},is_system.eq.true`);

  // Fetch monthly summaries
  const { data: monthlySummaries } = await supabase
    .from("monthly_summaries")
    .select("*")
    .eq("household_id", profile.household_id)
    .gte("month", startDateStr.substring(0, 7))
    .lte("month", endDateStr.substring(0, 7))
    .order("month", { ascending: true });

  // Process data for charts
  const monthlyData = processMonthlyData(transactions || [], startDate, endDate);
  const categoryData = processCategoryData(transactions || [], categories || [], locale);
  const trendData = processTrendData(transactions || [], startDate, endDate);

  return (
    <AnalyticsContent
      transactions={transactions || []}
      categories={categories || []}
      monthlyData={monthlyData}
      categoryData={categoryData}
      trendData={trendData}
      monthlySummaries={monthlySummaries || []}
      period={period}
      startDate={startDateStr}
      endDate={endDateStr}
      locale={locale as "en" | "da"}
    />
  );
}

function processMonthlyData(
  transactions: any[],
  startDate: Date,
  endDate: Date
) {
  const months: { [key: string]: { income: number; expenses: number } } = {};

  // Initialize all months in range
  let current = new Date(startDate);
  while (current <= endDate) {
    const key = format(current, "yyyy-MM");
    months[key] = { income: 0, expenses: 0 };
    current = new Date(current.setMonth(current.getMonth() + 1));
  }

  // Aggregate transactions
  transactions.forEach((tx) => {
    const month = tx.transaction_date.substring(0, 7);
    if (months[month]) {
      if (tx.type === "income") {
        months[month].income += Number(tx.amount);
      } else if (tx.type === "expense") {
        months[month].expenses += Math.abs(Number(tx.amount));
      }
    }
  });

  return Object.entries(months)
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function processCategoryData(
  transactions: any[],
  categories: any[],
  locale: string
) {
  const categoryTotals: {
    [key: string]: { amount: number; category: any };
  } = {};

  transactions
    .filter((tx) => tx.type === "expense" && tx.category)
    .forEach((tx) => {
      const categoryId = tx.category_id;
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = {
          amount: 0,
          category: tx.category,
        };
      }
      categoryTotals[categoryId].amount += Math.abs(Number(tx.amount));
    });

  return Object.entries(categoryTotals)
    .map(([id, data]) => ({
      id,
      name: locale === "da" ? data.category.name_da : data.category.name,
      icon: data.category.icon,
      amount: data.amount,
      color: data.category.color || "#6b7280",
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
}

function processTrendData(
  transactions: any[],
  startDate: Date,
  endDate: Date
) {
  const days: { [key: string]: { income: number; expenses: number } } = {};

  transactions.forEach((tx) => {
    const day = tx.transaction_date;
    if (!days[day]) {
      days[day] = { income: 0, expenses: 0 };
    }
    if (tx.type === "income") {
      days[day].income += Number(tx.amount);
    } else if (tx.type === "expense") {
      days[day].expenses += Math.abs(Number(tx.amount));
    }
  });

  // Calculate cumulative values
  let cumulativeIncome = 0;
  let cumulativeExpenses = 0;

  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => {
      cumulativeIncome += data.income;
      cumulativeExpenses += data.expenses;
      return {
        date,
        dailyIncome: data.income,
        dailyExpenses: data.expenses,
        cumulativeIncome,
        cumulativeExpenses,
        cumulativeNet: cumulativeIncome - cumulativeExpenses,
      };
    });
}
