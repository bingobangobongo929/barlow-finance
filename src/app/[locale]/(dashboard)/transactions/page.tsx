import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TransactionsContent } from "./transactions-content";

interface TransactionsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    type?: string;
    category?: string;
    account?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sort?: string;
    order?: string;
  }>;
}

export async function generateMetadata({ params }: TransactionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "transactions" });
  return {
    title: t("title"),
  };
}

export default async function TransactionsPage({
  params,
  searchParams,
}: TransactionsPageProps) {
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

  // Parse search params
  const page = parseInt(search.page || "1", 10);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;
  const sortField = search.sort || "transaction_date";
  const sortOrder = search.order === "asc" ? true : false;

  // Build query
  let query = supabase
    .from("transactions")
    .select("*, category:categories(*), account:accounts(*)", { count: "exact" })
    .eq("household_id", profile.household_id);

  // Apply filters
  if (search.type && search.type !== "all") {
    query = query.eq("type", search.type);
  }

  if (search.category) {
    query = query.eq("category_id", search.category);
  }

  if (search.account) {
    query = query.eq("account_id", search.account);
  }

  if (search.startDate) {
    query = query.gte("transaction_date", search.startDate);
  }

  if (search.endDate) {
    query = query.lte("transaction_date", search.endDate);
  }

  if (search.search) {
    query = query.ilike("description", `%${search.search}%`);
  }

  // Apply sorting and pagination
  query = query
    .order(sortField, { ascending: sortOrder })
    .range(offset, offset + pageSize - 1);

  const { data: transactions, count } = await query;

  // Get categories and accounts for filters
  const [{ data: categories }, { data: accounts }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .or(`household_id.eq.${profile.household_id},is_system.eq.true`)
      .order("name_en"),
    supabase
      .from("accounts")
      .select("*")
      .eq("household_id", profile.household_id)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <TransactionsContent
      transactions={transactions || []}
      categories={categories || []}
      accounts={accounts || []}
      totalCount={count || 0}
      currentPage={page}
      pageSize={pageSize}
      filters={{
        type: search.type || "all",
        category: search.category || "",
        account: search.account || "",
        startDate: search.startDate || "",
        endDate: search.endDate || "",
        search: search.search || "",
        sort: sortField,
        order: search.order || "desc",
      }}
      locale={locale as "en" | "da"}
      householdId={profile.household_id}
    />
  );
}
