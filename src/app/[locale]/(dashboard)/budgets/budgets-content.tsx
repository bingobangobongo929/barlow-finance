"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Budget, Category } from "@/lib/types";

interface BudgetWithSpent extends Omit<Budget, "category" | "spent"> {
  category: Category | null | undefined;
  spent: number;
  periodStart: string;
  periodEnd: string;
}

interface BudgetsContentProps {
  budgets: BudgetWithSpent[];
  categories: Category[];
  locale: "en" | "da";
  householdId: string;
}

export function BudgetsContent({
  budgets,
  categories,
  locale,
  householdId,
}: BudgetsContentProps) {
  const t = useTranslations("budgets");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedBudget, setSelectedBudget] =
    React.useState<BudgetWithSpent | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "active" | "inactive">(
    "active"
  );

  const [formData, setFormData] = React.useState({
    category_id: "",
    amount: "",
    period: "monthly" as "weekly" | "monthly" | "quarterly" | "yearly" | "custom",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    alert_threshold: "80",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      category_id: "",
      amount: "",
      period: "monthly",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      alert_threshold: "80",
      is_active: true,
    });
  };

  const openEditModal = (budget: BudgetWithSpent) => {
    setSelectedBudget(budget);
    setFormData({
      category_id: budget.category_id || "",
      amount: budget.amount.toString(),
      period: budget.period,
      start_date: budget.start_date || "",
      end_date: budget.end_date || "",
      alert_threshold: "80",
      is_active: budget.is_active,
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        showError(t("invalidAmount"));
        return;
      }

      const budgetData = {
        household_id: householdId,
        category_id: formData.category_id,
        amount,
        period: formData.period,
        start_date: formData.period === "custom" ? formData.start_date : null,
        end_date: formData.period === "custom" ? formData.end_date : null,
        alert_threshold: parseInt(formData.alert_threshold, 10),
        is_active: formData.is_active,
      };

      if (isEdit && selectedBudget) {
        const { error } = await supabase
          .from("budgets")
          .update(budgetData)
          .eq("id", selectedBudget.id);

        if (error) throw error;
        showSuccess(t("budgetUpdated"));
      } else {
        // Check if budget already exists for this category/period
        const { data: existing } = await supabase
          .from("budgets")
          .select("id")
          .eq("household_id", householdId)
          .eq("category_id", formData.category_id)
          .eq("period", formData.period)
          .eq("is_active", true)
          .single();

        if (existing) {
          showError(t("budgetExists"));
          return;
        }

        const { error } = await supabase.from("budgets").insert(budgetData);

        if (error) throw error;
        showSuccess(t("budgetAdded"));
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Budget error:", error);
      showError(isEdit ? t("updateError") : t("addError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBudget) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", selectedBudget.id);

      if (error) throw error;

      showSuccess(t("budgetDeleted"));
      setShowDeleteModal(false);
      setSelectedBudget(null);
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      showError(t("deleteError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryName = (category: Category | null | undefined) => {
    if (!category) return t("uncategorized");
    return locale === "da" ? category.name_da : category.name;
  };

  const getProgressColor = (percentage: number, threshold: number) => {
    if (percentage >= 100) return "var(--accent-danger)";
    if (percentage >= threshold) return "var(--accent-warning)";
    return "var(--accent-success)";
  };

  const filteredBudgets = budgets.filter((b) => {
    if (filter === "active") return b.is_active;
    if (filter === "inactive") return !b.is_active;
    return true;
  });

  // Calculate summary stats
  const activeBudgets = budgets.filter((b) => b.is_active);
  const totalBudgeted = activeBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = activeBudgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = activeBudgets.filter((b) => b.spent > b.amount).length;

  // Get categories that don't have an active budget yet
  const availableCategories = categories.filter(
    (c) => !budgets.some((b) => b.category_id === c.id && b.is_active)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addBudget")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {t("totalBudgeted")}
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {formatCurrency(totalBudgeted, "DKK", locale)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {t("totalSpent")}
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${
              totalSpent > totalBudgeted
                ? "text-[var(--accent-danger)]"
                : "text-[var(--text-primary)]"
            }`}
          >
            {formatCurrency(totalSpent, "DKK", locale)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {t("overBudget")}
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${
              overBudgetCount > 0
                ? "text-[var(--accent-danger)]"
                : "text-[var(--accent-success)]"
            }`}
          >
            {overBudgetCount} / {activeBudgets.length}
          </p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          {tCommon("all")}
        </Button>
        <Button
          variant={filter === "active" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("active")}
        >
          {t("active")}
        </Button>
        <Button
          variant={filter === "inactive" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("inactive")}
        >
          {t("inactive")}
        </Button>
      </div>

      {/* Budget List */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredBudgets.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <p className="text-[var(--text-secondary)]">{t("noBudgets")}</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addBudget")}
            </Button>
          </Card>
        ) : (
          filteredBudgets.map((budget) => {
            const percentage = (budget.spent / budget.amount) * 100;
            const remaining = budget.amount - budget.spent;
            const isOverBudget = budget.spent > budget.amount;
            const isNearLimit =
              percentage >= (80) && !isOverBudget;

            return (
              <Card key={budget.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {budget.category?.icon || "📊"}
                    </span>
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">
                        {getCategoryName(budget.category)}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {t(budget.period)} •{" "}
                        {formatDate(budget.periodStart, locale)} -{" "}
                        {formatDate(budget.periodEnd, locale)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!budget.is_active && (
                      <Badge variant="default">{t("inactive")}</Badge>
                    )}
                    {isOverBudget && (
                      <Badge variant="danger">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {t("overBudget")}
                      </Badge>
                    )}
                    {isNearLimit && (
                      <Badge variant="warning">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        {t("nearLimit")}
                      </Badge>
                    )}
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                      align="end"
                    >
                      <DropdownItem onClick={() => openEditModal(budget)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {tCommon("edit")}
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => {
                          setSelectedBudget(budget);
                          setShowDeleteModal(true);
                        }}
                        className="text-[var(--accent-danger)]"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {tCommon("delete")}
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">
                      {formatCurrency(budget.spent, "DKK", locale)} /{" "}
                      {formatCurrency(budget.amount, "DKK", locale)}
                    </span>
                    <span
                      className={
                        isOverBudget
                          ? "text-[var(--accent-danger)]"
                          : "text-[var(--text-secondary)]"
                      }
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="mt-2"
                    style={
                      {
                        "--progress-color": getProgressColor(
                          percentage,
                          80
                        ),
                      } as React.CSSProperties
                    }
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">
                    {t("remaining")}
                  </span>
                  <span
                    className={`font-medium ${
                      remaining < 0
                        ? "text-[var(--accent-danger)]"
                        : "text-[var(--accent-success)]"
                    }`}
                  >
                    {formatCurrency(remaining, "DKK", locale)}
                  </span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Budget Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t("addBudget")}
      >
        <BudgetForm
          formData={formData}
          setFormData={setFormData}
          categories={availableCategories}
          locale={locale}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit(false)}
          onCancel={() => {
            setShowAddModal(false);
            resetForm();
          }}
          getCategoryName={getCategoryName}
        />
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBudget(null);
          resetForm();
        }}
        title={t("editBudget")}
      >
        <BudgetForm
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          locale={locale}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit(true)}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedBudget(null);
            resetForm();
          }}
          getCategoryName={getCategoryName}
          isEdit
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBudget(null);
        }}
        title={t("deleteBudget")}
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t("deleteConfirmation")}
          </p>
          {selectedBudget && (
            <Card className="bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {selectedBudget.category?.icon || "📊"}
                </span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {getCategoryName(selectedBudget.category)}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {formatCurrency(selectedBudget.amount, "DKK", locale)} /{" "}
                    {t(selectedBudget.period)}
                  </p>
                </div>
              </div>
            </Card>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedBudget(null);
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="danger"
              loading={isSubmitting}
              onClick={handleDelete}
            >
              {tCommon("delete")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface BudgetFormProps {
  formData: {
    category_id: string;
    amount: string;
    period: "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
    start_date: string;
    end_date: string;
    alert_threshold: string;
    is_active: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<BudgetFormProps["formData"]>>;
  categories: Category[];
  locale: "en" | "da";
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  getCategoryName: (category: Category | null | undefined) => string;
  isEdit?: boolean;
}

function BudgetForm({
  formData,
  setFormData,
  categories,
  locale,
  isSubmitting,
  onSubmit,
  onCancel,
  getCategoryName,
  isEdit,
}: BudgetFormProps) {
  const t = useTranslations("budgets");
  const tCommon = useTranslations("common");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="form-group">
        <Label htmlFor="category_id" required>
          {t("category")}
        </Label>
        <Select
          id="category_id"
          value={formData.category_id}
          onChange={(e) =>
            setFormData({ ...formData, category_id: e.target.value })
          }
          disabled={isEdit}
          required
        >
          <option value="">{t("selectCategory")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {getCategoryName(category)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="amount" required>
            {t("budgetAmount")}
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <Label htmlFor="period" required>
            {t("period")}
          </Label>
          <Select
            id="period"
            value={formData.period}
            onChange={(e) =>
              setFormData({
                ...formData,
                period: e.target.value as typeof formData.period,
              })
            }
            required
          >
            <option value="weekly">{t("weekly")}</option>
            <option value="monthly">{t("monthly")}</option>
            <option value="yearly">{t("yearly")}</option>
            <option value="custom">{t("custom")}</option>
          </Select>
        </div>
      </div>

      {formData.period === "custom" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="form-group">
            <Label htmlFor="start_date" required>
              {t("startDate")}
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <Label htmlFor="end_date" required>
              {t("endDate")}
            </Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              required
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <Label htmlFor="alert_threshold">{t("alertThreshold")}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="alert_threshold"
            type="number"
            min="0"
            max="100"
            value={formData.alert_threshold}
            onChange={(e) =>
              setFormData({ ...formData, alert_threshold: e.target.value })
            }
            className="w-24"
          />
          <span className="text-sm text-[var(--text-secondary)]">%</span>
        </div>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          {t("alertThresholdHint")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) =>
            setFormData({ ...formData, is_active: e.target.checked })
          }
          className="h-4 w-4 rounded border-[var(--border-primary)] text-[var(--accent-primary)]"
        />
        <Label htmlFor="is_active" className="mb-0">
          {t("isActive")}
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
