import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VehiclesContent } from "./vehicles-content";

interface VehiclesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: VehiclesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vehicles" });
  return {
    title: t("title"),
  };
}

export default async function VehiclesPage({ params }: VehiclesPageProps) {
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

  // Get vehicles with maintenance records
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: false });

  // Get maintenance records for each vehicle
  const vehiclesWithMaintenance = await Promise.all(
    (vehicles || []).map(async (vehicle) => {
      const { data: maintenanceRecords } = await supabase
        .from("vehicle_maintenance")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .order("scheduled_date", { ascending: false });

      const totalCost = (maintenanceRecords || [])
        .filter((m) => m.is_completed)
        .reduce((sum, m) => sum + (m.cost || 0), 0);

      const upcomingMaintenance = (maintenanceRecords || []).filter(
        (m) => !m.is_completed
      );

      return {
        ...vehicle,
        maintenance: maintenanceRecords || [],
        totalMaintenanceCost: totalCost,
        upcomingCount: upcomingMaintenance.length,
      };
    })
  );

  return (
    <VehiclesContent
      vehicles={vehiclesWithMaintenance}
      locale={locale as "en" | "da"}
      householdId={profile.household_id}
    />
  );
}
