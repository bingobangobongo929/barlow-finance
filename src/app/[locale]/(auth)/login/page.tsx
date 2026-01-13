"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useErrorToast } from "@/components/ui/toast";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const showError = useErrorToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const supabase = createClient();

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          showError(t("invalidCredentials"));
        } else if (error.message.includes("Too many requests")) {
          showError(t("tooManyAttempts", { minutes: 15 }));
        } else {
          showError(error.message);
        }
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      showError(t("invalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {t("subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-group">
          <Label htmlFor="email" error={!!errors.email}>
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-[var(--accent-danger)]">
              {tValidation("email")}
            </p>
          )}
        </div>

        <div className="form-group">
          <Label htmlFor="password" error={!!errors.password}>
            {t("password")}
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            error={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-[var(--accent-danger)]">
              {tValidation("required")}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Checkbox label={t("rememberMe")} />
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--accent-primary)] hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isLoading}>
          {t("submit")}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="text-[var(--accent-primary)] hover:underline"
        >
          {t("signUp")}
        </Link>
      </div>
    </div>
  );
}
