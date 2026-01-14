"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  Landmark,
  TrendingDown,
  Calendar,
  Percent,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
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
import type { Loan, LoanPayment } from "@/lib/types";

interface LoanWithPayments extends Loan {
  payments: LoanPayment[];
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  lastPayment: LoanPayment | null;
}

interface LoansContentProps {
  loans: LoanWithPayments[];
  locale: "en" | "da";
  householdId: string;
}

export function LoansContent({
  loans,
  locale,
  householdId,
}: LoansContentProps) {
  const t = useTranslations("loans");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedLoan, setSelectedLoan] =
    React.useState<LoanWithPayments | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "active" | "paid_off">(
    "active"
  );

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    original_amount: "",
    current_balance: "",
    interest_rate: "",
    payment_amount: "",
    payment_frequency: "monthly" as "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly",
    start_date: "",
    expected_end_date: "",
    loan_type: "mortgage" as "mortgage" | "car" | "personal" | "student" | "other",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      original_amount: "",
      current_balance: "",
      interest_rate: "",
      payment_amount: "",
      payment_frequency: "monthly",
      start_date: "",
      expected_end_date: "",
      loan_type: "mortgage",
      notes: "",
    });
  };

  const openEditModal = (loan: LoanWithPayments) => {
    setSelectedLoan(loan);
    setFormData({
      name: loan.name,
      description: loan.description || "",
      original_amount: loan.original_amount.toString(),
      current_balance: loan.current_balance.toString(),
      interest_rate: loan.interest_rate.toString(),
      payment_amount: loan.payment_amount.toString(),
      payment_frequency: loan.payment_frequency,
      start_date: loan.start_date || "",
      expected_end_date: loan.expected_end_date || "",
      loan_type: "other",
      notes: loan.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    setIsSubmitting(true);

    try {
      const originalAmount = parseFloat(formData.original_amount);
      const currentBalance = parseFloat(formData.current_balance);
      const interestRate = parseFloat(formData.interest_rate);
      const paymentAmount = parseFloat(formData.payment_amount);

      if (
        isNaN(originalAmount) ||
        isNaN(currentBalance) ||
        isNaN(interestRate) ||
        isNaN(paymentAmount)
      ) {
        showError(t("invalidNumbers"));
        return;
      }

      const loanData = {
        household_id: householdId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        original_amount: originalAmount,
        current_balance: currentBalance,
        interest_rate: interestRate,
        interest_type: "fixed" as const, // Default to fixed
        payment_amount: paymentAmount,
        payment_frequency: formData.payment_frequency,
        start_date: formData.start_date || null,
        expected_end_date: formData.expected_end_date || null,
        notes: formData.notes.trim() || null,
        is_active: currentBalance > 0,
      };

      if (isEdit && selectedLoan) {
        const { error } = await supabase
          .from("loans")
          .update(loanData)
          .eq("id", selectedLoan.id);

        if (error) throw error;
        showSuccess(t("loanUpdated"));
      } else {
        const { error } = await supabase.from("loans").insert(loanData);

        if (error) throw error;
        showSuccess(t("loanAdded"));
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Loan error:", error instanceof Error ? error.message : "Unknown error");
      showError(isEdit ? t("updateError") : t("addError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLoan) return;
    setIsSubmitting(true);

    try {
      // Delete payments first
      await supabase
        .from("loan_payments")
        .delete()
        .eq("loan_id", selectedLoan.id);

      // Then delete the loan
      const { error } = await supabase
        .from("loans")
        .delete()
        .eq("id", selectedLoan.id);

      if (error) throw error;

      showSuccess(t("loanDeleted"));
      setShowDeleteModal(false);
      setSelectedLoan(null);
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error instanceof Error ? error.message : "Unknown error");
      showError(t("deleteError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLoans = loans.filter((l) => {
    if (filter === "active") return l.is_active;
    if (filter === "paid_off") return !l.is_active;
    return true;
  });

  // Calculate summary stats
  const totalDebt = loans
    .filter((l) => l.is_active)
    .reduce((sum, l) => sum + l.current_balance, 0);
  const totalMonthlyPayments = loans
    .filter((l) => l.is_active)
    .reduce((sum, l) => {
      if (l.payment_frequency === "weekly") return sum + l.payment_amount * 4.33;
      if (l.payment_frequency === "biweekly") return sum + l.payment_amount * 2.17;
      return sum + l.payment_amount;
    }, 0);
  const avgInterestRate =
    loans.filter((l) => l.is_active).length > 0
      ? loans
          .filter((l) => l.is_active)
          .reduce((sum, l) => sum + l.interest_rate, 0) /
        loans.filter((l) => l.is_active).length
      : 0;

  const getLoanTypeIcon = (type: string) => {
    switch (type) {
      case "mortgage":
        return "🏠";
      case "car":
        return "🚗";
      case "student":
        return "🎓";
      case "personal":
        return "💰";
      default:
        return "📋";
    }
  };

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
          {t("addLoan")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-danger)]/10">
              <Landmark className="h-5 w-5 text-[var(--accent-danger)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("totalDebt")}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {formatCurrency(totalDebt, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-warning)]/10">
              <Calendar className="h-5 w-5 text-[var(--accent-warning)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("monthlyPayments")}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {formatCurrency(totalMonthlyPayments, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
              <Percent className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("avgInterestRate")}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {avgInterestRate.toFixed(2)}%
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
          {tCommon("all")} ({loans.length})
        </Button>
        <Button
          variant={filter === "active" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("active")}
        >
          {t("active")} ({loans.filter((l) => l.is_active).length})
        </Button>
        <Button
          variant={filter === "paid_off" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("paid_off")}
        >
          {t("paidOff")} ({loans.filter((l) => !l.is_active).length})
        </Button>
      </div>

      {/* Loans List */}
      <div className="grid gap-4">
        {filteredLoans.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-[var(--text-secondary)]">{t("noLoans")}</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addLoan")}
            </Button>
          </Card>
        ) : (
          filteredLoans.map((loan) => {
            const paidPercentage =
              loan.original_amount > 0
                ? ((loan.original_amount - loan.current_balance) /
                    loan.original_amount) *
                  100
                : 0;

            return (
              <Card key={loan.id} className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">
                      {getLoanTypeIcon("loan")}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[var(--text-primary)]">
                          {loan.name}
                        </h3>
                        {!loan.is_active && (
                          <Badge variant="success">{t("paidOff")}</Badge>
                        )}
                      </div>
                      {loan.description && (
                        <p className="text-sm text-[var(--text-secondary)]">
                          {loan.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                        <span>
                          {t("interestRate")}: {loan.interest_rate}%
                        </span>
                        <span>
                          {t("payment")}:{" "}
                          {formatCurrency(loan.payment_amount, "DKK", locale)} /{" "}
                          {t(loan.payment_frequency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/loans/${loan.id}`}>
                      <Button variant="secondary" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        {t("viewDetails")}
                      </Button>
                    </Link>
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                      align="end"
                    >
                      <DropdownItem onClick={() => openEditModal(loan)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {tCommon("edit")}
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => {
                          setSelectedLoan(loan);
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
                      {t("remaining")}:{" "}
                      {formatCurrency(loan.current_balance, "DKK", locale)}
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {t("original")}:{" "}
                      {formatCurrency(loan.original_amount, "DKK", locale)}
                    </span>
                  </div>
                  <Progress value={paidPercentage} className="mt-2" />
                  <p className="mt-1 text-right text-xs text-[var(--text-tertiary)]">
                    {paidPercentage.toFixed(1)}% {t("paid")}
                  </p>
                </div>

                {loan.lastPayment && (
                  <div className="mt-3 rounded-lg bg-[var(--bg-secondary)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {t("lastPayment")}
                    </p>
                    <p className="text-sm text-[var(--text-primary)]">
                      {formatCurrency(
                        Number(loan.lastPayment.principal_amount) +
                          Number(loan.lastPayment.interest_amount),
                        "DKK",
                        locale
                      )}{" "}
                      {t("on")} {formatDate(loan.lastPayment.payment_date, locale)}
                    </p>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Add Loan Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t("addLoan")}
        size="lg"
      >
        <LoanForm
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit(false)}
          onCancel={() => {
            setShowAddModal(false);
            resetForm();
          }}
        />
      </Modal>

      {/* Edit Loan Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLoan(null);
          resetForm();
        }}
        title={t("editLoan")}
        size="lg"
      >
        <LoanForm
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit(true)}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedLoan(null);
            resetForm();
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLoan(null);
        }}
        title={t("deleteLoan")}
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t("deleteConfirmation")}
          </p>
          {selectedLoan && (
            <Card className="bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {getLoanTypeIcon("loan")}
                </span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {selectedLoan.name}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {formatCurrency(selectedLoan.current_balance, "DKK", locale)}{" "}
                    {t("remaining")}
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
                setSelectedLoan(null);
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

interface LoanFormProps {
  formData: {
    name: string;
    description: string;
    original_amount: string;
    current_balance: string;
    interest_rate: string;
    payment_amount: string;
    payment_frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
    start_date: string;
    expected_end_date: string;
    loan_type: "mortgage" | "car" | "personal" | "student" | "other";
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<LoanFormProps["formData"]>>;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

function LoanForm({
  formData,
  setFormData,
  isSubmitting,
  onSubmit,
  onCancel,
}: LoanFormProps) {
  const t = useTranslations("loans");
  const tCommon = useTranslations("common");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="name" required>
            {t("loanName")}
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t("loanNamePlaceholder")}
            required
          />
        </div>

        <div className="form-group">
          <Label htmlFor="loan_type" required>
            {t("loanType")}
          </Label>
          <Select
            id="loan_type"
            value={formData.loan_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                loan_type: e.target.value as typeof formData.loan_type,
              })
            }
            required
          >
            <option value="mortgage">{t("type.mortgage")}</option>
            <option value="car">{t("type.car")}</option>
            <option value="personal">{t("type.personal")}</option>
            <option value="student">{t("type.student")}</option>
            <option value="other">{t("type.other")}</option>
          </Select>
        </div>
      </div>

      <div className="form-group">
        <Label htmlFor="lender">{t("lender")}</Label>
        <Input
          id="lender"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t("lenderPlaceholder")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="original_amount" required>
            {t("originalAmount")}
          </Label>
          <Input
            id="original_amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.original_amount}
            onChange={(e) =>
              setFormData({ ...formData, original_amount: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <Label htmlFor="current_balance" required>
            {t("currentBalance")}
          </Label>
          <Input
            id="current_balance"
            type="number"
            step="0.01"
            min="0"
            value={formData.current_balance}
            onChange={(e) =>
              setFormData({ ...formData, current_balance: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="form-group">
          <Label htmlFor="interest_rate" required>
            {t("interestRate")} (%)
          </Label>
          <Input
            id="interest_rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.interest_rate}
            onChange={(e) =>
              setFormData({ ...formData, interest_rate: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <Label htmlFor="payment_amount" required>
            {t("paymentAmount")}
          </Label>
          <Input
            id="payment_amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.payment_amount}
            onChange={(e) =>
              setFormData({ ...formData, payment_amount: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <Label htmlFor="payment_frequency" required>
            {t("paymentFrequency")}
          </Label>
          <Select
            id="payment_frequency"
            value={formData.payment_frequency}
            onChange={(e) =>
              setFormData({
                ...formData,
                payment_frequency: e.target.value as typeof formData.payment_frequency,
              })
            }
            required
          >
            <option value="weekly">{t("weekly")}</option>
            <option value="biweekly">{t("biweekly")}</option>
            <option value="monthly">{t("monthly")}</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="start_date">{t("startDate")}</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <Label htmlFor="end_date">{t("endDate")}</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.expected_end_date}
            onChange={(e) =>
              setFormData({ ...formData, expected_end_date: e.target.value })
            }
          />
        </div>
      </div>

      <div className="form-group">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder={t("notesPlaceholder")}
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
