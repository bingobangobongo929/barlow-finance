"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { da, enUS } from "date-fns/locale";
import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Tag,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { DatePicker } from "@/components/ui/date-picker";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, Category, Account } from "@/lib/types";

interface TransactionsContentProps {
  transactions: (Transaction & {
    category: Category | null;
    account: Account | null;
  })[];
  categories: Category[];
  accounts: Account[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: {
    type: string;
    category: string;
    account: string;
    startDate: string;
    endDate: string;
    search: string;
    sort: string;
    order: string;
    page?: string;
  };
  locale: "en" | "da";
  householdId: string;
}

export function TransactionsContent({
  transactions,
  categories,
  accounts,
  totalCount,
  currentPage,
  pageSize,
  filters,
  locale,
  householdId,
}: TransactionsContentProps) {
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const router = useRouter();
  const searchParams = useSearchParams();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [showFilters, setShowFilters] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<
    (typeof transactions)[0] | null
  >(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState(filters.search);

  // Form state
  const [formData, setFormData] = React.useState({
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense" as "income" | "expense" | "transfer",
    category_id: "",
    account_id: accounts[0]?.id || "",
    notes: "",
    is_recurring: false,
  });

  const dateLocale = locale === "da" ? da : enUS;
  const totalPages = Math.ceil(totalCount / pageSize);

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (!newFilters.page) {
      params.delete("page");
    }

    router.push(`?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilters({ search: searchInput });
  };

  const handleSort = (field: string) => {
    const newOrder =
      filters.sort === field && filters.order === "desc" ? "asc" : "desc";
    updateFilters({ sort: field, order: newOrder });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page: page.toString() });
  };

  const getCategoryName = (category: Category | null) => {
    if (!category) return t("uncategorized");
    return locale === "da" ? category.name_da : category.name;
  };

  const resetForm = () => {
    setFormData({
      transaction_date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      type: "expense",
      category_id: "",
      account_id: accounts[0]?.id || "",
      notes: "",
      is_recurring: false,
    });
  };

  const handleAddTransaction = async () => {
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        showError(t("invalidAmount"));
        return;
      }

      const { error } = await supabase.from("transactions").insert({
        household_id: householdId,
        account_id: formData.account_id || null,
        category_id: formData.category_id || null,
        transaction_date: formData.transaction_date,
        description: formData.description,
        amount: formData.type === "expense" ? -Math.abs(amount) : Math.abs(amount),
        type: formData.type,
        notes: formData.notes || null,
        is_recurring: formData.is_recurring,
      });

      if (error) throw error;

      showSuccess(t("transactionAdded"));
      setShowAddModal(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Add transaction error:", error);
      showError(t("addError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTransaction = async () => {
    if (!selectedTransaction) return;
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        showError(t("invalidAmount"));
        return;
      }

      const { error } = await supabase
        .from("transactions")
        .update({
          account_id: formData.account_id || null,
          category_id: formData.category_id || null,
          transaction_date: formData.transaction_date,
          description: formData.description,
          amount: formData.type === "expense" ? -Math.abs(amount) : Math.abs(amount),
          type: formData.type,
          notes: formData.notes || null,
          is_recurring: formData.is_recurring,
        })
        .eq("id", selectedTransaction.id);

      if (error) throw error;

      showSuccess(t("transactionUpdated"));
      setShowEditModal(false);
      setSelectedTransaction(null);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Edit transaction error:", error);
      showError(t("editError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", selectedTransaction.id);

      if (error) throw error;

      showSuccess(t("transactionDeleted"));
      setShowDeleteModal(false);
      setSelectedTransaction(null);
      router.refresh();
    } catch (error) {
      console.error("Delete transaction error:", error);
      showError(t("deleteError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (transaction: (typeof transactions)[0]) => {
    setSelectedTransaction(transaction);
    setFormData({
      transaction_date: transaction.transaction_date,
      description: transaction.description,
      amount: Math.abs(Number(transaction.amount)).toString(),
      type: transaction.type,
      category_id: transaction.category_id || "",
      account_id: transaction.account_id || "",
      notes: transaction.notes || "",
      is_recurring: transaction.is_recurring,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (transaction: (typeof transactions)[0]) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const filteredCategories = categories.filter((c) => {
    if (formData.type === "transfer") return false;
    return c.type === formData.type || c.type === null;
  });

  const exportTransactions = () => {
    const csvContent = [
      ["Date", "Description", "Amount", "Type", "Category", "Account", "Notes"].join(","),
      ...transactions.map((tx) =>
        [
          tx.transaction_date,
          `"${tx.description.replace(/"/g, '""')}"`,
          tx.amount,
          tx.type,
          getCategoryName(tx.category),
          tx.account?.name || "",
          `"${(tx.notes || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("subtitle", { count: totalCount })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportTransactions}>
            <Download className="mr-2 h-4 w-4" />
            {tCommon("export")}
          </Button>
          <Link
            href="/transactions/import"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
          >
            <Upload className="mr-2 h-4 w-4" />
            {t("import")}
          </Link>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addTransaction")}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Link
          href="/transactions/categorize"
          className="inline-flex items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
        >
          <Tag className="mr-2 h-4 w-4" />
          {t("quickCategorize")}
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>
              {tCommon("search")}
            </Button>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-[var(--bg-tertiary)]" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            {t("filters")}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 grid gap-4 border-t border-[var(--border-primary)] pt-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label className="mb-2 block text-xs">{t("type")}</Label>
              <Select
                value={filters.type}
                onChange={(e) => updateFilters({ type: e.target.value })}
              >
                <option value="all">{tCommon("all")}</option>
                <option value="income">{t("income")}</option>
                <option value="expense">{t("expense")}</option>
                <option value="transfer">{t("transfer")}</option>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-xs">{t("category")}</Label>
              <Select
                value={filters.category}
                onChange={(e) => updateFilters({ category: e.target.value })}
              >
                <option value="">{tCommon("all")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {getCategoryName(cat)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-xs">{t("account")}</Label>
              <Select
                value={filters.account}
                onChange={(e) => updateFilters({ account: e.target.value })}
              >
                <option value="">{tCommon("all")}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-xs">{t("startDate")}</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilters({ startDate: e.target.value })}
              />
            </div>

            <div>
              <Label className="mb-2 block text-xs">{t("endDate")}</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilters({ endDate: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(filters.type !== "all" ||
          filters.category ||
          filters.account ||
          filters.startDate ||
          filters.endDate ||
          filters.search) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.type !== "all" && (
              <Badge variant="default" className="flex items-center gap-1">
                {t(filters.type)}
                <button onClick={() => updateFilters({ type: "all" })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.category && (
              <Badge variant="default" className="flex items-center gap-1">
                {getCategoryName(categories.find((c) => c.id === filters.category) || null)}
                <button onClick={() => updateFilters({ category: "" })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.account && (
              <Badge variant="default" className="flex items-center gap-1">
                {accounts.find((a) => a.id === filters.account)?.name}
                <button onClick={() => updateFilters({ account: "" })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.startDate && (
              <Badge variant="default" className="flex items-center gap-1">
                {t("from")}: {formatDate(filters.startDate, locale)}
                <button onClick={() => updateFilters({ startDate: "" })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.endDate && (
              <Badge variant="default" className="flex items-center gap-1">
                {t("to")}: {formatDate(filters.endDate, locale)}
                <button onClick={() => updateFilters({ endDate: "" })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant="default" className="flex items-center gap-1">
                &quot;{filters.search}&quot;
                <button onClick={() => { setSearchInput(""); updateFilters({ search: "" }); }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort("transaction_date")}
                    className="flex items-center gap-1 text-xs font-medium uppercase text-[var(--text-secondary)]"
                  >
                    {t("date")}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                  {t("description")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                  {t("category")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                  {t("account")}
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort("amount")}
                    className="flex items-center justify-end gap-1 text-xs font-medium uppercase text-[var(--text-secondary)]"
                  >
                    {t("amount")}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--text-secondary)]">
                  {tCommon("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-[var(--text-secondary)]">{t("noTransactions")}</p>
                    <Button
                      variant="secondary"
                      className="mt-4"
                      onClick={() => setShowAddModal(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("addFirst")}
                    </Button>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                      {formatDate(transaction.transaction_date, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {transaction.is_recurring && (
                          <Badge variant="default" className="text-xs">
                            {t("recurring")}
                          </Badge>
                        )}
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {transaction.description}
                        </span>
                      </div>
                      {transaction.notes && (
                        <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-1">
                          {transaction.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {transaction.category ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{transaction.category.icon}</span>
                          <span className="text-sm text-[var(--text-secondary)]">
                            {getCategoryName(transaction.category)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">
                          {t("uncategorized")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {transaction.account?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-semibold ${
                          Number(transaction.amount) >= 0
                            ? "text-[var(--accent-success)]"
                            : "text-[var(--accent-danger)]"
                        }`}
                      >
                        {formatCurrency(Number(transaction.amount), "DKK", locale)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Dropdown
                        trigger={
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      >
                        <DropdownItem onClick={() => openEditModal(transaction)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {tCommon("edit")}
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => openDeleteModal(transaction)}
                          className="text-[var(--accent-danger)]"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {tCommon("delete")}
                        </DropdownItem>
                      </Dropdown>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border-primary)] px-4 py-3">
            <p className="text-sm text-[var(--text-secondary)]">
              {t("showing", {
                start: (currentPage - 1) * pageSize + 1,
                end: Math.min(currentPage * pageSize, totalCount),
                total: totalCount,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-[var(--text-secondary)]">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title={t("addTransaction")}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="transaction_date">{t("date")}</Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_date: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="type">{t("type")}</Label>
              <Select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "income" | "expense" | "transfer",
                    category_id: "",
                  })
                }
              >
                <option value="expense">{t("expense")}</option>
                <option value="income">{t("income")}</option>
                <option value="transfer">{t("transfer")}</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">{t("description")}</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t("descriptionPlaceholder")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="amount">{t("amount")}</Label>
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
              />
            </div>
            <div>
              <Label htmlFor="account_id">{t("account")}</Label>
              <Select
                id="account_id"
                value={formData.account_id}
                onChange={(e) =>
                  setFormData({ ...formData, account_id: e.target.value })
                }
              >
                <option value="">{t("selectAccount")}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {formData.type !== "transfer" && (
            <div>
              <Label htmlFor="category_id">{t("category")}</Label>
              <Select
                id="category_id"
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
              >
                <option value="">{t("selectCategory")}</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {getCategoryName(cat)}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder={t("notesPlaceholder")}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_recurring"
              checked={formData.is_recurring}
              onChange={(e) =>
                setFormData({ ...formData, is_recurring: e.target.checked })
              }
              className="h-4 w-4 rounded border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--accent-primary)]"
            />
            <Label htmlFor="is_recurring" className="cursor-pointer">
              {t("markRecurring")}
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleAddTransaction} loading={isSubmitting}>
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedTransaction(null); resetForm(); }}
        title={t("editTransaction")}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit_transaction_date">{t("date")}</Label>
              <Input
                id="edit_transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_date: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_type">{t("type")}</Label>
              <Select
                id="edit_type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "income" | "expense" | "transfer",
                    category_id: "",
                  })
                }
              >
                <option value="expense">{t("expense")}</option>
                <option value="income">{t("income")}</option>
                <option value="transfer">{t("transfer")}</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit_description">{t("description")}</Label>
            <Input
              id="edit_description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit_amount">{t("amount")}</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_account_id">{t("account")}</Label>
              <Select
                id="edit_account_id"
                value={formData.account_id}
                onChange={(e) =>
                  setFormData({ ...formData, account_id: e.target.value })
                }
              >
                <option value="">{t("selectAccount")}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {formData.type !== "transfer" && (
            <div>
              <Label htmlFor="edit_category_id">{t("category")}</Label>
              <Select
                id="edit_category_id"
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
              >
                <option value="">{t("selectCategory")}</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {getCategoryName(cat)}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="edit_notes">{t("notes")}</Label>
            <Textarea
              id="edit_notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit_is_recurring"
              checked={formData.is_recurring}
              onChange={(e) =>
                setFormData({ ...formData, is_recurring: e.target.checked })
              }
              className="h-4 w-4 rounded border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--accent-primary)]"
            />
            <Label htmlFor="edit_is_recurring" className="cursor-pointer">
              {t("markRecurring")}
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => { setShowEditModal(false); setSelectedTransaction(null); resetForm(); }}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleEditTransaction} loading={isSubmitting}>
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedTransaction(null); }}
        title={t("deleteTransaction")}
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t("deleteConfirmation")}
          </p>
          {selectedTransaction && (
            <div className="rounded-lg bg-[var(--bg-secondary)] p-4">
              <p className="font-medium text-[var(--text-primary)]">
                {selectedTransaction.description}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {formatCurrency(Number(selectedTransaction.amount), "DKK", locale)} -{" "}
                {formatDate(selectedTransaction.transaction_date, locale)}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => { setShowDeleteModal(false); setSelectedTransaction(null); }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteTransaction}
              loading={isSubmitting}
            >
              {tCommon("delete")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
