import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdvisorContent } from "./advisor-content";

interface AdvisorPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AdvisorPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "advisor" });
  return {
    title: t("title"),
  };
}

export default async function AdvisorPage({ params }: AdvisorPageProps) {
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

  // Get user's accounts for potential import
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type")
    .eq("household_id", profile.household_id)
    .order("name");

  return (
    <AdvisorContent
      householdId={profile.household_id}
      accounts={accounts || []}
      locale={locale as "en" | "da"}
      preferredLanguage={profile.preferred_language || "en"}
    />
  );
}
