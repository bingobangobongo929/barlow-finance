import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProjectsContent } from "./projects-content";

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProjectsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects" });
  return {
    title: t("title"),
  };
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, household:households(*)")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    redirect("/register");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("priority", { ascending: true });

  return (
    <ProjectsContent
      projects={projects || []}
      locale={locale as "en" | "da"}
      householdId={profile.household_id}
    />
  );
}
