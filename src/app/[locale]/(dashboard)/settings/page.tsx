"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  User,
  Home,
  Bell,
  Shield,
  Database,
  UserPlus,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";
import type { Profile, Household } from "@/lib/types";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("profile");
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [household, setHousehold] = React.useState<Household | null>(null);
  const [members, setMembers] = React.useState<Profile[]>([]);

  const [profileForm, setProfileForm] = React.useState({
    display_name: "",
    email: "",
    preferred_language: "en" as "en" | "da",
    notification_preferences: {
      budget_alerts: true,
      payment_reminders: true,
      weekly_summary: true,
    },
  });

  const [householdForm, setHouseholdForm] = React.useState({
    name: "",
    settings: {
      currency: "DKK",
      dateFormat: "dd-MM-yyyy",
      firstDayOfWeek: 1,
      fiscalYearStart: 1,
    },
  });

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, household:households(*)")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        router.push("/register");
        return;
      }

      setProfile(profileData);
      setHousehold(profileData.household);
      setProfileForm({
        display_name: profileData.display_name,
        email: profileData.email,
        preferred_language: profileData.preferred_language || "en",
        notification_preferences: profileData.notification_preferences || {
          budget_alerts: true,
          payment_reminders: true,
          weekly_summary: true,
        },
      });

      if (profileData.household) {
        setHouseholdForm({
          name: profileData.household.name,
          settings: profileData.household.settings || {
            currency: "DKK",
            dateFormat: "dd-MM-yyyy",
            firstDayOfWeek: 1,
            fiscalYearStart: 1,
          },
        });

        // Load household members
        const { data: membersData } = await supabase
          .from("profiles")
          .select("*")
          .eq("household_id", profileData.household_id);

        setMembers(membersData || []);
      }

      setIsLoading(false);
    }

    loadData();
  }, [supabase, router]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profileForm.display_name,
          preferred_language: profileForm.preferred_language,
          notification_preferences: profileForm.notification_preferences,
        })
        .eq("id", profile.id);

      if (error) throw error;
      showSuccess(t("profileSaved"));
      router.refresh();
    } catch (error) {
      console.error("Save profile error:", error);
      showError(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHousehold = async () => {
    if (!household) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("households")
        .update({
          name: householdForm.name,
          settings: householdForm.settings,
        })
        .eq("id", household.id);

      if (error) throw error;
      showSuccess(t("householdSaved"));
    } catch (error) {
      console.error("Save household error:", error);
      showError(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const generateInviteLink = async () => {
    if (!household) return;

    try {
      // Generate a unique token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase.from("invite_tokens").insert({
        household_id: household.id,
        token,
        created_by: profile?.id,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      setShowInviteModal(true);
    } catch (error) {
      console.error("Generate invite error:", error);
      showError(t("inviteError"));
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">{t("subtitle")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            {t("tabs.profile")}
          </TabsTrigger>
          <TabsTrigger value="household">
            <Home className="mr-2 h-4 w-4" />
            {t("tabs.household")}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            {t("tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            {t("tabs.security")}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card className="p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
              {t("profileInfo")}
            </h3>
            <div className="space-y-4">
              <div className="form-group">
                <Label htmlFor="display_name">{t("displayName")}</Label>
                <Input
                  id="display_name"
                  value={profileForm.display_name}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      display_name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="bg-[var(--bg-secondary)]"
                />
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {t("emailCannotChange")}
                </p>
              </div>

              <div className="form-group">
                <Label htmlFor="preferred_language">{t("language")}</Label>
                <Select
                  id="preferred_language"
                  value={profileForm.preferred_language}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      preferred_language: e.target.value as "en" | "da",
                    })
                  }
                >
                  <option value="en">English</option>
                  <option value="da">Dansk</option>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} loading={isSaving}>
                  {tCommon("save")}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Household Tab */}
        <TabsContent value="household" className="mt-6 space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
              {t("householdInfo")}
            </h3>
            <div className="space-y-4">
              <div className="form-group">
                <Label htmlFor="household_name">{t("householdName")}</Label>
                <Input
                  id="household_name"
                  value={householdForm.name}
                  onChange={(e) =>
                    setHouseholdForm({
                      ...householdForm,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-group">
                  <Label htmlFor="dateFormat">{t("dateFormat")}</Label>
                  <Select
                    id="dateFormat"
                    value={householdForm.settings.dateFormat}
                    onChange={(e) =>
                      setHouseholdForm({
                        ...householdForm,
                        settings: {
                          ...householdForm.settings,
                          dateFormat: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="dd-MM-yyyy">DD-MM-YYYY</option>
                    <option value="MM-dd-yyyy">MM-DD-YYYY</option>
                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                  </Select>
                </div>

                <div className="form-group">
                  <Label htmlFor="firstDayOfWeek">{t("firstDayOfWeek")}</Label>
                  <Select
                    id="firstDayOfWeek"
                    value={householdForm.settings.firstDayOfWeek.toString()}
                    onChange={(e) =>
                      setHouseholdForm({
                        ...householdForm,
                        settings: {
                          ...householdForm.settings,
                          firstDayOfWeek: parseInt(e.target.value, 10),
                        },
                      })
                    }
                  >
                    <option value="0">{t("sunday")}</option>
                    <option value="1">{t("monday")}</option>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveHousehold} loading={isSaving}>
                  {tCommon("save")}
                </Button>
              </div>
            </div>
          </Card>

          {/* Members */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                {t("householdMembers")}
              </h3>
              <Button variant="secondary" onClick={generateInviteLink}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t("inviteMember")}
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border-primary)] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                      {member.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {member.display_name}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={member.role === "admin" ? "default" : "default"}
                  >
                    {t(`role.${member.role}`)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
              {t("notificationSettings")}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {t("budgetAlerts")}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("budgetAlertsDescription")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileForm.notification_preferences.budget_alerts}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      notification_preferences: {
                        ...profileForm.notification_preferences,
                        budget_alerts: e.target.checked,
                      },
                    })
                  }
                  className="h-5 w-5 rounded border-[var(--border-primary)]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {t("paymentReminders")}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("paymentRemindersDescription")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={
                    profileForm.notification_preferences.payment_reminders
                  }
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      notification_preferences: {
                        ...profileForm.notification_preferences,
                        payment_reminders: e.target.checked,
                      },
                    })
                  }
                  className="h-5 w-5 rounded border-[var(--border-primary)]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {t("weeklySummary")}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("weeklySummaryDescription")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileForm.notification_preferences.weekly_summary}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      notification_preferences: {
                        ...profileForm.notification_preferences,
                        weekly_summary: e.target.checked,
                      },
                    })
                  }
                  className="h-5 w-5 rounded border-[var(--border-primary)]"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} loading={isSaving}>
                  {tCommon("save")}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
              {t("accountSecurity")}
            </h3>
            <div className="space-y-4">
              <Button variant="secondary" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                {t("changePassword")}
              </Button>
            </div>
          </Card>

          <Card className="border-[var(--accent-danger)]/50 p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--accent-danger)]">
              {t("dangerZone")}
            </h3>
            <div className="space-y-4">
              <Button
                variant="secondary"
                className="w-full justify-start border-[var(--accent-danger)]/50 text-[var(--accent-danger)]"
                onClick={handleSignOut}
              >
                {t("signOut")}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={t("inviteMember")}
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t("inviteDescription")}
          </p>
          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="flex-1" />
            <Button onClick={copyInviteLink}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            {t("inviteExpiry")}
          </p>
        </div>
      </Modal>
    </div>
  );
}
