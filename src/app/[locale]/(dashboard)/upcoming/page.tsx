"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  MoreHorizontal,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { UpcomingExpense, Category } from "@/lib/types";

export default function UpcomingExpensesPage() {
  const t = useTranslations("upcoming");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [expenses, setExpenses] = React.useState<
    (UpcomingExpense & { category: Category | null })[]
  >([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<
    (UpcomingExpense & { category: Category | null }) | null
  >(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [householdId, setHouseholdId] = React.useState("");
  const [locale, setLocale] = React.useState<"en" | "da">("en");
  const [filter, setFilter] = React.useState<"all" | "unpaid" | "paid">("unpaid");

  const [formData, setFormData] = React.useState({
    name: "",
    amount: "",
    due_date: "",
    category_id: "",
    recurrence: "once" as import("@/lib/types").RecurrenceType,
    notes: "",
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

      const [{ data: expensesData }, { data: categoriesData }] =
        await Promise.all([
          supabase
            .from("upcoming_expenses")
            .select("*, category:categories(*)")
            .eq("household_id", profile.household_id)
            .order("due_date", { ascending: true }),
          supabase
            .from("categories")
            .select("*")
            .or(`household_id.eq.${profile.household_id},is_system.eq.true`)
            .eq("type", "expense")
            .order("name_en"),
        ]);

      setExpenses(expensesData || []);
      setCategories(categoriesData || []);
      setIsLoading(false);
    }

    loadData();
  }, [supabase, router]);

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      due_date: "",
      category_id: "",
      recurrence: "once",
      notes: "",
    });
  };

  const openEditModal = (expense: (typeof expenses)[0]) => {
    setSelectedExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      due_date: expense.due_date,
      category_id: expense.category_id || "",
      recurrence: expense.recurrence || "once",
      notes: expense.notes || "",
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

      const data = {
        household_id: householdId,
        name: formData.name.trim(),
        amount,
        due_date: formData.due_date,
        category_id: formData.category_id || null,
        recurrence: formData.recurrence,
        notes: formData.notes.trim() || null,
      };

      if (isEdit && selectedExpense) {
        const { error } = await supabase
          .from("upcoming_expenses")
          .update(data)
          .eq("id", selectedExpense.id);

        if (error) throw error;
        showSuccess(t("expenseUpdated"));
      } else {
        const { error } = await supabase
          .from("upcoming_expenses")
          .insert({ ...data, is_paid: false });

        if (error) throw error;
        showSuccess(t("expenseAdded"));
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();

      // Refresh data
      const { data: newData } = await supabase
        .from("upcoming_expenses")
        .select("*, category:categories(*)")
        .eq("household_id", householdId)
        .order("due_date", { ascending: true });

      setExpenses(newData || []);
    } catch (error) {
      console.error("Expense error:", error);
      showError(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (expense: (typeof expenses)[0]) => {
    try {
      const { error } = await supabase
        .from("upcoming_expenses")
        .update({
          is_paid: true,
          paid_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", expense.id);

      if (error) throw error;

      // If recurring, create next occurrence
      if (expense.recurrence !== "once") {
        const nextDate = new Date(expense.due_date);
        if (expense.recurrence === "weekly") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (expense.recurrence === "monthly") {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (expense.recurrence === "yearly") {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }

        await supabase.from("upcoming_expenses").insert({
          household_id: expense.household_id,
          name: expense.name,
          amount: expense.amount,
          due_date: nextDate.toISOString().split("T")[0],
          category_id: expense.category_id,
          recurrence: expense.recurrence,
          notes: expense.notes,
          is_paid: false,
        });
      }

      showSuccess(t("markedPaid"));

      // Refresh data
      const { data: newData } = await supabase
        .from("upcoming_expenses")
        .select("*, category:categories(*)")
        .eq("household_id", householdId)
        .order("due_date", { ascending: true });

      setExpenses(newData || []);
    } catch (error) {
      showError(t("updateError"));
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("upcoming_expenses")
        .delete()
        .eq("id", selectedExpense.id);

      if (error) throw error;

      showSuccess(t("expenseDeleted"));
      setShowDeleteModal(false);
      setSelectedExpense(null);

      setExpenses((prev) =>
        prev.filter((e) => e.id !== selectedExpense.id)
      );
    } catch (error) {
      showError(t("deleteError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryName = (category: Category | null) => {
    if (!category) return t("uncategorized");
    return locale === "da" ? category.name_da : category.name;
  };

  const filteredExpenses = expenses.filter((e) => {
    if (filter === "unpaid") return !e.is_paid;
    if (filter === "paid") return e.is_paid;
    return true;
  });

  // Calculate totals
  const totalUnpaid = expenses
    .filter((e) => !e.is_paid)
    .reduce((sum, e) => sum + e.amount, 0);
  const thisMonthTotal = expenses
    .filter((e) => {
      if (e.is_paid) return false;
      const dueDate = new Date(e.due_date);
      const now = new Date();
      return (
        dueDate.getMonth() === now.getMonth() &&
        dueDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);
  const overdueCount = expenses.filter((e) => {
    if (e.is_paid) return false;
    return new Date(e.due_date) < new Date();
  }).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

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
          {t("addExpense")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-warning)]/10">
              <Calendar className="h-5 w-5 text-[var(--accent-warning)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("totalUnpaid")}
              </p>
              <p className="text-xl font-bold text-[var(--accent-warning)]">
                {formatCurrency(totalUnpaid, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
              <Calendar className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("thisMonth")}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {formatCurrency(thisMonthTotal, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-danger)]/10">
              <AlertTriangle className="h-5 w-5 text-[var(--accent-danger)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("overdue")}
              </p>
              <p className="text-xl font-bold text-[var(--accent-danger)]">
                {overdueCount}
              </p>
            </div>
          </div>
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
          variant={filter === "unpaid" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("unpaid")}
        >
          {t("unpaid")}
        </Button>
        <Button
          variant={filter === "paid" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("paid")}
        >
          {t("paid")}
        </Button>
      </div>

      {/* Expenses List */}
      <Card>
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[var(--text-secondary)]">{t("noExpenses")}</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addExpense")}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-primary)]">
            {filteredExpenses.map((expense) => {
              const isOverdue =
                !expense.is_paid && new Date(expense.due_date) < new Date();
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        expense.is_paid
                          ? "bg-[var(--accent-success)]/10"
                          : isOverdue
                          ? "bg-[var(--accent-danger)]/10"
                          : "bg-[var(--bg-secondary)]"
                      }`}
                    >
                      {expense.is_paid ? (
                        <Check className="h-5 w-5 text-[var(--accent-success)]" />
                      ) : expense.recurrence !== "once" ? (
                        <RefreshCw className="h-5 w-5 text-[var(--text-secondary)]" />
                      ) : (
                        <Calendar className="h-5 w-5 text-[var(--text-secondary)]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--text-primary)]">
                          {expense.name}
                        </p>
                        {expense.recurrence !== "once" && (
                          <Badge variant="default">{t("recurring")}</Badge>
                        )}
                        {isOverdue && (
                          <Badge variant="danger">{t("overdue")}</Badge>
                        )}
                        {expense.is_paid && (
                          <Badge variant="success">{t("paid")}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {t("dueDate")}: {formatDate(expense.due_date, locale)}
                        {expense.category && (
                          <> • {getCategoryName(expense.category)}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {formatCurrency(expense.amount, "DKK", locale)}
                    </p>
                    {!expense.is_paid && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkPaid(expense)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {t("markPaid")}
                      </Button>
                    )}
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                      align="end"
                    >
                      <DropdownItem onClick={() => openEditModal(expense)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {tCommon("edit")}
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => {
                          setSelectedExpense(expense);
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
              );
            })}
          </div>
        )}
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t("addExpense")}
      >
        <ExpenseForm
          formData={formData}
          setFormData={setFormData}
          categories={categories}
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

      {/* Edit Expense Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedExpense(null);
          resetForm();
        }}
        title={t("editExpense")}
      >
        <ExpenseForm
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          locale={locale}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit(true)}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedExpense(null);
            resetForm();
          }}
          getCategoryName={getCategoryName}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedExpense(null);
        }}
        title={t("deleteExpense")}
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t("deleteConfirmation")}
          </p>
          {selectedExpense && (
            <Card className="bg-[var(--bg-secondary)] p-4">
              <p className="font-medium text-[var(--text-primary)]">
                {selectedExpense.name}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {formatCurrency(selectedExpense.amount, "DKK", locale)} •{" "}
                {formatDate(selectedExpense.due_date, locale)}
              </p>
            </Card>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedExpense(null);
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

interface ExpenseFormProps {
  formData: {
    name: string;
    amount: string;
    due_date: string;
    category_id: string;
    recurrence: import("@/lib/types").RecurrenceType;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<ExpenseFormProps["formData"]>>;
  categories: Category[];
  locale: "en" | "da";
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  getCategoryName: (category: Category | null) => string;
}

function ExpenseForm({
  formData,
  setFormData,
  categories,
  locale,
  isSubmitting,
  onSubmit,
  onCancel,
  getCategoryName,
}: ExpenseFormProps) {
  const t = useTranslations("upcoming");
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
        <Label htmlFor="name" required>
          {t("expenseName")}
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t("expenseNamePlaceholder")}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="amount" required>
            {t("amount")}
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
            required
          />
        </div>

        <div className="form-group">
          <Label htmlFor="due_date" required>
            {t("dueDate")}
          </Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) =>
              setFormData({ ...formData, due_date: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="form-group">
        <Label htmlFor="category_id">{t("category")}</Label>
        <Select
          id="category_id"
          value={formData.category_id}
          onChange={(e) =>
            setFormData({ ...formData, category_id: e.target.value })
          }
        >
          <option value="">{t("selectCategory")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {getCategoryName(category)}
            </option>
          ))}
        </Select>
      </div>

      <div className="form-group">
        <Label htmlFor="recurrence">{t("recurrence")}</Label>
        <Select
          id="recurrence"
          value={formData.recurrence}
          onChange={(e) =>
            setFormData({
              ...formData,
              recurrence: e.target.value as import("@/lib/types").RecurrenceType,
            })
          }
        >
          <option value="once">{t("once")}</option>
          <option value="weekly">{t("weekly")}</option>
          <option value="biweekly">{t("biweekly")}</option>
          <option value="monthly">{t("monthly")}</option>
          <option value="quarterly">{t("quarterly")}</option>
          <option value="yearly">{t("yearly")}</option>
        </Select>
      </div>

      

      <div className="form-group">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
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
