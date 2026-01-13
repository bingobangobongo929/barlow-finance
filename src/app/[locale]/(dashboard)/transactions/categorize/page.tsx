"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Tag,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  SkipForward,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, Category } from "@/lib/types";

interface UncategorizedTransaction extends Omit<Transaction, "category"> {
  category: Category | null;
}

export default function QuickCategorizePage() {
  const t = useTranslations("transactions.categorize");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [transactions, setTransactions] = React.useState<
    UncategorizedTransaction[]
  >([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAiCategorizing, setIsAiCategorizing] = React.useState(false);
  const [categorizedCount, setCategorizedCount] = React.useState(0);
  const [skippedCount, setSkippedCount] = React.useState(0);
  const [householdId, setHouseholdId] = React.useState("");
  const [locale, setLocale] = React.useState<"en" | "da">("en");

  // Load uncategorized transactions
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id, preferred_language")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/register");
        return;
      }

      setHouseholdId(profile.household_id);
      setLocale((profile.preferred_language as "en" | "da") || "en");

      const [{ data: txs }, { data: cats }] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .eq("household_id", profile.household_id)
          .is("category_id", null)
          .order("transaction_date", { ascending: false })
          .limit(100),
        supabase
          .from("categories")
          .select("*")
          .or(`household_id.eq.${profile.household_id},is_system.eq.true`)
          .order("name_en"),
      ]);

      setTransactions(
        (txs || []).map((tx) => ({ ...tx, category: null }))
      );
      setCategories(cats || []);
      setIsLoading(false);
    }

    loadData();
  }, [supabase, router]);

  const currentTransaction = transactions[currentIndex];
  const progress =
    transactions.length > 0
      ? ((categorizedCount + skippedCount) / transactions.length) * 100
      : 0;

  const filteredCategories = categories.filter((c) => {
    if (!currentTransaction) return true;
    return (
      c.type === currentTransaction.type ||
      c.type === null
    );
  });

  const getCategoryName = (category: Category) => {
    return locale === "da" ? category.name_da : category.name;
  };

  const handleCategorize = async (categoryId: string) => {
    if (!currentTransaction) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ category_id: categoryId })
        .eq("id", currentTransaction.id);

      if (error) throw error;

      // Check if this should create a categorization rule
      const { data: existingRule } = await supabase
        .from("categorization_rules")
        .select("id")
        .eq("household_id", householdId)
        .eq("pattern", currentTransaction.description.toLowerCase())
        .single();

      if (!existingRule) {
        // Create a new rule for this pattern
        await supabase.from("categorization_rules").insert({
          household_id: householdId,
          pattern: currentTransaction.description.toLowerCase(),
          category_id: categoryId,
          match_type: "exact",
          is_active: true,
        });
      }

      setCategorizedCount((prev) => prev + 1);
      moveToNext();
    } catch (error) {
      console.error("Categorize error:", error);
      showError(t("categorizeError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    setSkippedCount((prev) => prev + 1);
    moveToNext();
  };

  const moveToNext = () => {
    if (currentIndex < transactions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleAiCategorize = async () => {
    if (!currentTransaction) return;

    setIsAiCategorizing(true);

    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: currentTransaction.description,
          amount: currentTransaction.amount,
          type: currentTransaction.type,
          householdId,
        }),
      });

      if (!response.ok) {
        throw new Error("AI categorization failed");
      }

      const { categoryId, confidence } = await response.json();

      if (categoryId && confidence > 0.7) {
        await handleCategorize(categoryId);
        showSuccess(t("aiCategorized"));
      } else {
        showError(t("aiUncertain"));
      }
    } catch (error) {
      console.error("AI categorize error:", error);
      showError(t("aiError"));
    } finally {
      setIsAiCategorizing(false);
    }
  };

  const handleBulkAiCategorize = async () => {
    const uncategorized = transactions.slice(currentIndex);
    if (uncategorized.length === 0) return;

    setIsAiCategorizing(true);

    try {
      const response = await fetch("/api/ai/categorize/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: uncategorized.map((tx) => ({
            id: tx.id,
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
          })),
          householdId,
        }),
      });

      if (!response.ok) {
        throw new Error("Bulk AI categorization failed");
      }

      const { results } = await response.json();
      let successCount = 0;

      for (const result of results) {
        if (result.categoryId && result.confidence > 0.7) {
          const { error } = await supabase
            .from("transactions")
            .update({ category_id: result.categoryId })
            .eq("id", result.transactionId);

          if (!error) {
            successCount++;
          }
        }
      }

      setCategorizedCount((prev) => prev + successCount);
      showSuccess(t("bulkAiCategorized", { count: successCount }));
      router.push("/transactions");
    } catch (error) {
      console.error("Bulk AI categorize error:", error);
      showError(t("aiError"));
    } finally {
      setIsAiCategorizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
            {t("title")}
          </h1>
        </div>

        <Card className="p-12 text-center">
          <Check className="mx-auto h-16 w-16 text-[var(--accent-success)]" />
          <h2 className="mt-4 font-heading text-xl font-semibold text-[var(--text-primary)]">
            {t("allCategorized")}
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            {t("allCategorizedDescription")}
          </p>
          <Button className="mt-6" onClick={() => router.push("/transactions")}>
            {t("viewTransactions")}
          </Button>
        </Card>
      </div>
    );
  }

  const isComplete = currentIndex >= transactions.length - 1 &&
    (categorizedCount + skippedCount >= transactions.length);

  if (isComplete) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
            {t("title")}
          </h1>
        </div>

        <Card className="p-12 text-center">
          <Check className="mx-auto h-16 w-16 text-[var(--accent-success)]" />
          <h2 className="mt-4 font-heading text-xl font-semibold text-[var(--text-primary)]">
            {t("sessionComplete")}
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            {t("sessionSummary", {
              categorized: categorizedCount,
              skipped: skippedCount,
            })}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentIndex(0);
                setCategorizedCount(0);
                setSkippedCount(0);
              }}
            >
              {t("startOver")}
            </Button>
            <Button onClick={() => router.push("/transactions")}>
              {t("viewTransactions")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("subtitle", { remaining: transactions.length - currentIndex })}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleBulkAiCategorize}
          loading={isAiCategorizing}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {t("aiCategorizeAll")}
        </Button>
      </div>

      {/* Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>
            {t("progress", {
              current: currentIndex + 1,
              total: transactions.length,
            })}
          </span>
          <span>
            {t("stats", {
              categorized: categorizedCount,
              skipped: skippedCount,
            })}
          </span>
        </div>
        <Progress value={progress} className="mt-2" />
      </Card>

      {/* Current Transaction */}
      {currentTransaction && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <Badge
                  variant={
                    currentTransaction.type === "income" ? "success" : "danger"
                  }
                >
                  {currentTransaction.type === "income"
                    ? t("income")
                    : t("expense")}
                </Badge>
                <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                  {currentTransaction.description}
                </h2>
                
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold ${
                    Number(currentTransaction.amount) >= 0
                      ? "text-[var(--accent-success)]"
                      : "text-[var(--accent-danger)]"
                  }`}
                >
                  {formatCurrency(Number(currentTransaction.amount), "DKK", locale)}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {formatDate(currentTransaction.transaction_date, locale)}
                </p>
              </div>
            </div>

            {currentTransaction.notes && (
              <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  {currentTransaction.notes}
                </p>
              </div>
            )}

            {/* AI Suggestion */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAiCategorize}
                loading={isAiCategorizing}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t("aiSuggest")}
              </Button>
            </div>

            {/* Category Selection */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
                {t("selectCategory")}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorize(category.id)}
                    disabled={isSaving}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border-primary)] p-3 text-left transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {getCategoryName(category)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-[var(--border-primary)] pt-4">
              <Button
                variant="ghost"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {tCommon("previous")}
              </Button>
              <Button variant="secondary" onClick={handleSkip}>
                <SkipForward className="mr-2 h-4 w-4" />
                {t("skip")}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
