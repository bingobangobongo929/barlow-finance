"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";

const registerSchema = z
  .object({
    displayName: z.string().min(1).max(100),
    email: z.string().email().max(255),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    confirmPassword: z.string().min(1),
    householdName: z.string().min(1).max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
            household_name: data.householdName,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          showError(t("emailInUse"));
        } else {
          showError(authError.message);
        }
        return;
      }

      if (!authData.user) {
        showError("Failed to create account");
        return;
      }

      // Create the household
      const { data: household, error: householdError } = await supabase
        .from("households")
        .insert({
          name: data.householdName,
          settings: {
            currency: "DKK",
            dateFormat: "dd-MM-yyyy",
            firstDayOfWeek: 1,
            fiscalYearStart: 1,
          },
        })
        .select()
        .single();

      if (householdError) {
        console.error("Household creation error:", householdError);
        showError("Failed to create household");
        return;
      }

      // Create the user profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        household_id: household.id,
        email: data.email,
        display_name: data.displayName,
        role: "admin",
        preferred_language: "en",
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        showError("Failed to create profile");
        return;
      }

      showSuccess("Account created successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Registration error:", error);
      showError("An error occurred during registration");
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
          <Label htmlFor="displayName" required error={!!errors.displayName}>
            {t("displayName")}
          </Label>
          <Input
            id="displayName"
            type="text"
            autoComplete="name"
            error={!!errors.displayName}
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-sm text-[var(--accent-danger)]">
              {tValidation("required")}
            </p>
          )}
        </div>

        <div className="form-group">
          <Label htmlFor="email" required error={!!errors.email}>
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
          <Label htmlFor="password" required error={!!errors.password}>
            {t("password")}
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-[var(--accent-danger)]">
              {t("passwordRequirements")}
            </p>
          )}
        </div>

        <div className="form-group">
          <Label
            htmlFor="confirmPassword"
            required
            error={!!errors.confirmPassword}
          >
            {t("confirmPassword")}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-[var(--accent-danger)]">
              {t("passwordMismatch")}
            </p>
          )}
        </div>

        <div className="form-group">
          <Label htmlFor="householdName" required error={!!errors.householdName}>
            {t("householdName")}
          </Label>
          <Input
            id="householdName"
            type="text"
            placeholder={t("householdNameHint")}
            error={!!errors.householdName}
            {...register("householdName")}
          />
          {errors.householdName && (
            <p className="text-sm text-[var(--accent-danger)]">
              {tValidation("required")}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" loading={isLoading}>
          {t("submit")}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="text-[var(--accent-primary)] hover:underline"
        >
          {t("signIn")}
        </Link>
      </div>
    </div>
  );
}
