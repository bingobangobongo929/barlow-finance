import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoansContent } from "./loans-content";

interface LoansPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LoansPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "loans" });
  return {
    title: t("title"),
  };
}

export default async function LoansPage({ params }: LoansPageProps) {
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

  // Get loans with payment history
  const { data: loans } = await supabase
    .from("loans")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: false });

  // Calculate totals for each loan
  const loansWithPayments = await Promise.all(
    (loans || []).map(async (loan) => {
      const { data: payments } = await supabase
        .from("loan_payments")
        .select("*")
        .eq("loan_id", loan.id)
        .order("payment_date", { ascending: false });

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

      return {
        ...loan,
        payments: payments || [],
        totalPaid,
        principalPaid,
        interestPaid,
        lastPayment: payments?.[0] || null,
      };
    })
  );

  return (
    <LoansContent
      loans={loansWithPayments}
      locale={locale as "en" | "da"}
      householdId={profile.household_id}
    />
  );
}
