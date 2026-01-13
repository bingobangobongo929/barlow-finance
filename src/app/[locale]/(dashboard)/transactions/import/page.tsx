"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { Progress } from "@/components/ui/progress";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";
import { parseCSV, detectBankFormat, type ParsedTransaction } from "@/lib/csv/parser";
import { SUPPORTED_BANKS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Category, Account } from "@/lib/types";

type ImportStep = "upload" | "mapping" | "review" | "importing" | "complete";

interface PreviewTransaction extends ParsedTransaction {
  category_id: string | null;
  account_id: string | null;
  selected: boolean;
}

export default function TransactionImportPage() {
  const t = useTranslations("transactions.import");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [step, setStep] = React.useState<ImportStep>("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [bankFormat, setBankFormat] = React.useState<string>("");
  const [detectedFormat, setDetectedFormat] = React.useState<string>("");
  const [parsedTransactions, setParsedTransactions] = React.useState<
    PreviewTransaction[]
  >([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = React.useState<string>("");
  const [householdId, setHouseholdId] = React.useState<string>("");
  const [importProgress, setImportProgress] = React.useState(0);
  const [importResults, setImportResults] = React.useState({
    success: 0,
    failed: 0,
    skipped: 0,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [parseError, setParseError] = React.useState<string>("");

  // Load categories and accounts on mount
  React.useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("id", user.id)
        .single();

      if (!profile) return;
      setHouseholdId(profile.household_id);

      const [{ data: cats }, { data: accs }] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .or(`household_id.eq.${profile.household_id},is_system.eq.true`)
          .order("name_en"),
        supabase
          .from("accounts")
          .select("*")
          .eq("household_id", profile.household_id)
          .eq("is_active", true)
          .order("name"),
      ]);

      setCategories(cats || []);
      setAccounts(accs || []);
      if (accs && accs.length > 0) {
        setSelectedAccount(accs[0].id);
      }
    }

    loadData();
  }, [supabase]);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError("");
    setIsLoading(true);

    try {
      const text = await selectedFile.text();
      const detected = detectBankFormat(text);
      setDetectedFormat(detected?.id || "");
      setBankFormat(detected?.id || "");
    } catch (error) {
      console.error("File read error:", error);
      setParseError(t("fileReadError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleParse = async () => {
    if (!file || !bankFormat) return;

    setIsLoading(true);
    setParseError("");

    try {
      const text = await file.text();
      const format = SUPPORTED_BANKS.find(b => b.id === bankFormat);
      if (!format) {
        setParseError("Invalid bank format");
        return;
      }
      const result = parseCSV(text, format);

      if (result.transactions.length === 0) {
        setParseError(result.errors.join(", ") || t("noTransactionsFound"));
        return;
      }

      // Convert to preview format with category/account mapping
      const preview: PreviewTransaction[] = result.transactions.map((tx) => ({
        ...tx,
        category_id: null,
        account_id: selectedAccount,
        selected: true,
      }));

      setParsedTransactions(preview);
      setStep("mapping");
    } catch (error) {
      console.error("Parse error:", error);
      setParseError(t("parseError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (index: number, categoryId: string) => {
    setParsedTransactions((prev) =>
      prev.map((tx, i) =>
        i === index ? { ...tx, category_id: categoryId || null } : tx
      )
    );
  };

  const handleToggleSelect = (index: number) => {
    setParsedTransactions((prev) =>
      prev.map((tx, i) =>
        i === index ? { ...tx, selected: !tx.selected } : tx
      )
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setParsedTransactions((prev) =>
      prev.map((tx) => ({ ...tx, selected }))
    );
  };

  const handleImport = async () => {
    const selectedTransactions = parsedTransactions.filter((tx) => tx.selected);
    if (selectedTransactions.length === 0) {
      showError(t("noTransactionsSelected"));
      return;
    }

    setStep("importing");
    setImportProgress(0);

    const results = { success: 0, failed: 0, skipped: 0 };
    const batchSize = 50;

    for (let i = 0; i < selectedTransactions.length; i += batchSize) {
      const batch = selectedTransactions.slice(i, i + batchSize);

      const transactionsToInsert = batch.map((tx) => ({
        household_id: householdId,
        account_id: tx.account_id,
        category_id: tx.category_id,
        transaction_date: tx.transaction_date,
        description: tx.description,
        amount: tx.type === "expense" ? -Math.abs(tx.amount) : Math.abs(tx.amount),
        type: tx.type,
        import_source: bankFormat,
      }));

      const { error, data } = await supabase
        .from("transactions")
        .insert(transactionsToInsert)
        .select();

      if (error) {
        console.error("Import batch error:", error);
        results.failed += batch.length;
      } else {
        results.success += data?.length || 0;
      }

      setImportProgress(
        Math.round(((i + batch.length) / selectedTransactions.length) * 100)
      );
    }

    setImportResults(results);
    setStep("complete");

    if (results.success > 0) {
      showSuccess(t("importSuccess", { count: results.success }));
    }
  };

  const getCategoryName = (category: Category | null) => {
    if (!category) return "";
    const locale = document.documentElement.lang || "en";
    return locale === "da" ? category.name_da : category.name;
  };

  const selectedCount = parsedTransactions.filter((tx) => tx.selected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">{t("subtitle")}</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {(["upload", "mapping", "review", "complete"] as const).map(
          (s, index) => (
            <React.Fragment key={s}>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step === s || (step === "importing" && s === "review")
                    ? "bg-[var(--accent-primary)] text-white"
                    : ["upload", "mapping", "review", "importing", "complete"].indexOf(
                        step
                      ) >
                      ["upload", "mapping", "review", "importing", "complete"].indexOf(s)
                    ? "bg-[var(--accent-success)] text-white"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                }`}
              >
                {["upload", "mapping", "review", "importing", "complete"].indexOf(
                  step
                ) > index ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div
                  className={`h-0.5 w-12 ${
                    ["upload", "mapping", "review", "importing", "complete"].indexOf(
                      step
                    ) > index
                      ? "bg-[var(--accent-success)]"
                      : "bg-[var(--border-primary)]"
                  }`}
                />
              )}
            </React.Fragment>
          )
        )}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-[var(--accent-primary)]" />
              <h2 className="mt-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
                {t("uploadTitle")}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {t("uploadDescription")}
              </p>
            </div>

            <FileUpload
              accept=".csv,.CSV"
              onFileSelect={handleFileSelect}
              className="min-h-[200px]"
            />

            {file && (
              <div className="rounded-lg bg-[var(--bg-secondary)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-[var(--accent-primary)]" />
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {file.name}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setBankFormat("");
                      setDetectedFormat("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {detectedFormat && (
                  <div className="mt-4">
                    <Badge variant="success">
                      {t("detectedFormat", {
                        format:
                          SUPPORTED_BANKS.find((b) => b.id === detectedFormat)
                            ?.name || detectedFormat,
                      })}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {file && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-group">
                  <Label htmlFor="bankFormat">{t("bankFormat")}</Label>
                  <Select
                    id="bankFormat"
                    value={bankFormat}
                    onChange={(e) => setBankFormat(e.target.value)}
                  >
                    <option value="">{t("selectBankFormat")}</option>
                    {SUPPORTED_BANKS.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="form-group">
                  <Label htmlFor="account">{t("targetAccount")}</Label>
                  <Select
                    id="account"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                  >
                    <option value="">{t("selectAccount")}</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {parseError && (
              <div className="flex items-center gap-2 rounded-lg bg-[var(--accent-danger)]/10 p-4 text-[var(--accent-danger)]">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{parseError}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleParse}
                disabled={!file || !bankFormat || isLoading}
                loading={isLoading}
              >
                {t("parseFile")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step: Mapping */}
      {step === "mapping" && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                  {t("mappingTitle")}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("mappingDescription", {
                    count: parsedTransactions.length,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCount === parsedTransactions.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-primary)]"
                  />
                  {t("selectAll")}
                </label>
                <Badge variant="default">
                  {t("selectedCount", { count: selectedCount })}
                </Badge>
              </div>
            </div>

            <div className="max-h-[500px] overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[var(--bg-primary)]">
                  <tr className="border-b border-[var(--border-primary)]">
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                      {t("select")}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                      {t("date")}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                      {t("description")}
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-[var(--text-secondary)]">
                      {t("amount")}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                      {t("category")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTransactions.map((tx, index) => (
                    <tr
                      key={index}
                      className={`border-b border-[var(--border-primary)] last:border-0 ${
                        !tx.selected ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={tx.selected}
                          onChange={() => handleToggleSelect(index)}
                          className="h-4 w-4 rounded border-[var(--border-primary)]"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-primary)]">
                        {tx.transaction_date}
                      </td>
                      <td className="max-w-[300px] truncate px-3 py-2 text-sm text-[var(--text-primary)]">
                        {tx.description}
                      </td>
                      <td
                        className={`px-3 py-2 text-right text-sm font-medium ${
                          tx.type === "income"
                            ? "text-[var(--accent-success)]"
                            : "text-[var(--accent-danger)]"
                        }`}
                      >
                        {tx.type === "expense" ? "-" : ""}
                        {formatCurrency(Math.abs(tx.amount), "DKK", "da")}
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={tx.category_id || ""}
                          onChange={(e) =>
                            handleCategoryChange(index, e.target.value)
                          }
                          className="text-sm"
                        >
                          <option value="">{t("uncategorized")}</option>
                          {categories
                            .filter(
                              (c) =>
                                c.type === tx.type ||
                                c.type === null
                            )
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.icon} {getCategoryName(category)}
                              </option>
                            ))}
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep("upload");
                  setParsedTransactions([]);
                }}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {tCommon("back")}
              </Button>
              <Button onClick={() => setStep("review")} disabled={selectedCount === 0}>
                {t("reviewImport")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                {t("reviewTitle")}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("reviewDescription")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-[var(--bg-secondary)] p-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("totalTransactions")}
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                  {selectedCount}
                </p>
              </Card>
              <Card className="bg-[var(--bg-secondary)] p-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("totalIncome")}
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--accent-success)]">
                  {formatCurrency(
                    parsedTransactions
                      .filter((tx) => tx.selected && tx.type === "income")
                      .reduce((sum, tx) => sum + tx.amount, 0),
                    "DKK",
                    "da"
                  )}
                </p>
              </Card>
              <Card className="bg-[var(--bg-secondary)] p-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("totalExpenses")}
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--accent-danger)]">
                  {formatCurrency(
                    parsedTransactions
                      .filter((tx) => tx.selected && tx.type === "expense")
                      .reduce((sum, tx) => sum + tx.amount, 0),
                    "DKK",
                    "da"
                  )}
                </p>
              </Card>
            </div>

            <div className="rounded-lg bg-[var(--bg-secondary)] p-4">
              <h3 className="font-medium text-[var(--text-primary)]">
                {t("importSettings")}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                <p>
                  {t("bankFormat")}:{" "}
                  <span className="text-[var(--text-primary)]">
                    {SUPPORTED_BANKS.find((b) => b.id === bankFormat)?.name}
                  </span>
                </p>
                <p>
                  {t("targetAccount")}:{" "}
                  <span className="text-[var(--text-primary)]">
                    {accounts.find((a) => a.id === selectedAccount)?.name ||
                      t("noAccount")}
                  </span>
                </p>
                <p>
                  {t("categorized")}:{" "}
                  <span className="text-[var(--text-primary)]">
                    {
                      parsedTransactions.filter(
                        (tx) => tx.selected && tx.category_id
                      ).length
                    }{" "}
                    / {selectedCount}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep("mapping")}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {tCommon("back")}
              </Button>
              <Button onClick={handleImport}>
                {t("startImport")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step: Importing */}
      {step === "importing" && (
        <Card className="p-6">
          <div className="space-y-6 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[var(--accent-primary)]" />
            <div>
              <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                {t("importingTitle")}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("importingDescription")}
              </p>
            </div>
            <Progress value={importProgress} className="mx-auto max-w-md" />
            <p className="text-sm text-[var(--text-secondary)]">
              {importProgress}%
            </p>
          </div>
        </Card>
      )}

      {/* Step: Complete */}
      {step === "complete" && (
        <Card className="p-6">
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-success)]/20">
              <Check className="h-8 w-8 text-[var(--accent-success)]" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                {t("completeTitle")}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("completeDescription")}
              </p>
            </div>

            <div className="mx-auto grid max-w-md gap-4 sm:grid-cols-3">
              <Card className="bg-[var(--accent-success)]/10 p-4">
                <p className="text-sm text-[var(--accent-success)]">
                  {t("imported")}
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--accent-success)]">
                  {importResults.success}
                </p>
              </Card>
              <Card className="bg-[var(--accent-danger)]/10 p-4">
                <p className="text-sm text-[var(--accent-danger)]">
                  {t("failed")}
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--accent-danger)]">
                  {importResults.failed}
                </p>
              </Card>
              <Card className="bg-[var(--accent-warning)]/10 p-4">
                <p className="text-sm text-[var(--accent-warning)]">
                  {t("skipped")}
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--accent-warning)]">
                  {importResults.skipped}
                </p>
              </Card>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep("upload");
                  setFile(null);
                  setBankFormat("");
                  setDetectedFormat("");
                  setParsedTransactions([]);
                  setImportResults({ success: 0, failed: 0, skipped: 0 });
                }}
              >
                {t("importMore")}
              </Button>
              <Button onClick={() => router.push("/transactions")}>
                {t("viewTransactions")}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
