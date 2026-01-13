"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { User, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel } from "@/components/ui/dropdown";
import { getInitials } from "@/lib/utils";

interface UserMenuProps {
  user?: {
    email: string;
    display_name: string;
    avatar_url?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth.logout");
  const router = useRouter();
  const [profile, setProfile] = React.useState(user);
  const supabase = createClient();

  React.useEffect(() => {
    async function loadProfile() {
      if (user) return;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("email, display_name, avatar_url")
          .eq("id", authUser.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      }
    }

    loadProfile();
  }, [supabase, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const displayName = profile?.display_name || "User";
  const email = profile?.email || "";
  const initials = getInitials(displayName);

  return (
    <Dropdown
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t("profile")}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-medium text-white">
              {initials}
            </div>
          )}
        </Button>
      }
      align="end"
    >
      <DropdownLabel>
        <div className="flex flex-col">
          <span className="font-medium text-[var(--text-primary)]">
            {displayName}
          </span>
          <span className="text-[var(--text-tertiary)]">{email}</span>
        </div>
      </DropdownLabel>

      <DropdownSeparator />

      <DropdownItem onClick={handleSettings}>
        <Settings className="h-4 w-4" />
        {t("settings")}
      </DropdownItem>

      <DropdownSeparator />

      <DropdownItem onClick={handleLogout} destructive>
        <LogOut className="h-4 w-4" />
        {t("logout")}
      </DropdownItem>
    </Dropdown>
  );
}
