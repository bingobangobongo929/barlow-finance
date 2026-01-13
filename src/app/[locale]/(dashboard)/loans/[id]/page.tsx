import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { LoanDetailContent } from "./loan-detail-content";
import { generateAmortizationSchedule } from "@/lib/calculations/loan";

interface LoanDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: LoanDetailPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "loans" });
  return {
    title: t("loanDetails"),
  };
}

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    redirect("/register");
  }

  // Get the loan
  const { data: loan } = await supabase
    .from("loans")
    .select("*")
    .eq("id", id)
    .eq("household_id", profile.household_id)
    .single();

  if (!loan) {
    notFound();
  }

  // Get payment history
  const { data: payments } = await supabase
    .from("loan_payments")
    .select("*")
    .eq("loan_id", id)
    .order("payment_date", { ascending: false });

  // Generate amortization schedule
  const frequencyMap: { [key: string]: "weekly" | "biweekly" | "monthly" } = {
    weekly: "weekly",
    biweekly: "biweekly",
    monthly: "monthly",
  };

  const schedule = generateAmortizationSchedule(
    loan.current_balance,
    loan.interest_rate,
    loan.payment_amount,
    frequencyMap[loan.payment_frequency] || "monthly",
    loan.start_date ? new Date(loan.start_date) : new Date()
  );

  // Calculate stats
  const totalPaid = (payments || []).reduce(
    (sum, p) => sum + Number(p.principal_amount) + Number(p.interest_amount),
    0
  );
  const principalPaid = (payments || []).reduce(
    (sum, p) => sum + Number(p.principal_amount),
    0
  );
  const interestPaid = (payments || []).reduce(
    (sum, p) => sum + Number(p.interest_amount),
    0
  );

  // Project remaining interest from schedule
  const remainingInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  const projectedPayoffDate = schedule.length > 0 ? schedule[schedule.length - 1].date : null;

  return (
    <LoanDetailContent
      loan={loan}
      payments={payments || []}
      schedule={schedule}
      stats={{
        totalPaid,
        principalPaid,
        interestPaid,
        remainingInterest,
        projectedPayoffDate,
      }}
      locale={locale as "en" | "da"}
    />
  );
}
