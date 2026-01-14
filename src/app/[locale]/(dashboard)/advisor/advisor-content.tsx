"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Upload, FileText, X, Send, Sparkles, Loader2, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuccessToast, useErrorToast } from "@/components/ui/toast";
import { parseCSV, detectBankFormat, readFileAsText } from "@/lib/csv/parser";
import type { ParsedTransaction } from "@/lib/csv/parser";
import {
  calculateFinancialSummary,
  prepareFinancialContext,
  type FinancialSummary,
} from "@/lib/financial-analysis";
import { formatCurrency } from "@/lib/utils";
import { BANK_FORMATS } from "@/lib/constants";

interface UploadedFile {
  id: string;
  name: string;
  transactions: ParsedTransaction[];
  summary: FinancialSummary;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AdvisorContentProps {
  householdId: string;
  accounts: Array<{ id: string; name: string; type: string }>;
  locale: "en" | "da";
  preferredLanguage: string;
}

export function AdvisorContent({
  householdId,
  accounts,
  locale,
  preferredLanguage,
}: AdvisorContentProps) {
  const t = useTranslations("advisor");
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();

  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle file drop
  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.name.endsWith(".csv") || f.type === "text/csv"
      );

      await processFiles(droppedFiles);
    },
    []
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    await processFiles(selectedFiles);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFiles = async (fileList: File[]) => {
    for (const file of fileList) {
      try {
        const content = await readFileAsText(file);
        const format = detectBankFormat(content);

        if (!format) {
          showError(`${file.name}: ${t("unknownFormat")}`);
          continue;
        }

        const result = parseCSV(content, format);

        if (result.transactions.length === 0) {
          showError(`${file.name}: ${t("noTransactions")}`);
          continue;
        }

        const summary = calculateFinancialSummary(result.transactions);

        const uploadedFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          transactions: result.transactions,
          summary,
        };

        setFiles((prev) => [...prev, uploadedFile]);
        showSuccess(`${file.name}: ${result.transactions.length} ${t("transactionsLoaded")}`);
      } catch (error) {
        showError(`${file.name}: ${t("parseError")}`);
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setMessages([]);
  };

  const getAllTransactions = (): ParsedTransaction[] => {
    return files.flatMap((f) => f.transactions);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const allTransactions = getAllTransactions();
    if (allTransactions.length === 0) {
      showError(t("uploadFirst"));
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare financial context
      const context = prepareFinancialContext(allTransactions);

      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          financialContext: context,
          language: preferredLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      showError(error instanceof Error ? error.message : t("sendError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    t("suggestedQ1"),
    t("suggestedQ2"),
    t("suggestedQ3"),
    t("suggestedQ4"),
  ];

  const totalSummary = React.useMemo(() => {
    const allTransactions = getAllTransactions();
    return calculateFinancialSummary(allTransactions);
  }, [files]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{t("subtitle")}</p>
        </div>
        {files.length > 0 && (
          <Button variant="ghost" onClick={clearAll}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("clearAll")}
          </Button>
        )}
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Panel - File Upload & Summary */}
        <div className="flex w-80 flex-shrink-0 flex-col gap-4">
          {/* File Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {t("uploadFiles")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors
                  ${isDragging
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                    : "border-[var(--border-default)] hover:border-[var(--accent-primary)]/50"
                  }
                `}
              >
                <Upload className="mb-2 h-8 w-8 text-[var(--text-secondary)]" />
                <p className="text-center text-sm text-[var(--text-secondary)]">
                  {t("dropHere")}
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  CSV files only
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <Card className="flex-1 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {t("uploadedFiles")} ({files.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-60 space-y-2 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-start justify-between rounded-lg bg-[var(--bg-secondary)] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0 text-[var(--accent-primary)]" />
                        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {file.name}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-secondary)]">
                        {file.transactions.length} {t("transactions")}
                      </div>
                      <div className="mt-1 flex gap-3 text-xs">
                        <span className="text-[var(--accent-success)]">
                          +{formatCurrency(file.summary.totalIncome, locale)}
                        </span>
                        <span className="text-[var(--accent-danger)]">
                          -{formatCurrency(file.summary.totalExpenses, locale)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="ml-2 p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-danger)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {files.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{t("summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{t("totalIncome")}</span>
                  <span className="font-medium text-[var(--accent-success)]">
                    +{formatCurrency(totalSummary.totalIncome, locale)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{t("totalExpenses")}</span>
                  <span className="font-medium text-[var(--accent-danger)]">
                    -{formatCurrency(totalSummary.totalExpenses, locale)}
                  </span>
                </div>
                <div className="border-t border-[var(--border-default)] pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{t("netCashFlow")}</span>
                    <span
                      className={`font-semibold ${
                        totalSummary.netCashFlow >= 0
                          ? "text-[var(--accent-success)]"
                          : "text-[var(--accent-danger)]"
                      }`}
                    >
                      {totalSummary.netCashFlow >= 0 ? "+" : ""}
                      {formatCurrency(totalSummary.netCashFlow, locale)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {totalSummary.dateRange.start} → {totalSummary.dateRange.end}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Chat */}
        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0 border-b border-[var(--border-default)] pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
              <CardTitle>{t("chatTitle")}</CardTitle>
            </div>
          </CardHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                {files.length === 0 ? (
                  <>
                    <Upload className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
                    <p className="text-[var(--text-secondary)]">{t("uploadToStart")}</p>
                  </>
                ) : (
                  <>
                    <Sparkles className="mb-4 h-12 w-12 text-[var(--accent-primary)]" />
                    <p className="mb-4 text-[var(--text-secondary)]">{t("readyToChat")}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInput(q);
                          }}
                          className="rounded-full bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-[var(--accent-primary)] text-white"
                          : "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      <p
                        className={`mt-1 text-xs ${
                          message.role === "user"
                            ? "text-white/70"
                            : "text-[var(--text-tertiary)]"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
                      <span className="text-sm text-[var(--text-secondary)]">
                        {t("analyzing")}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-[var(--border-default)] p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("placeholder")}
                disabled={files.length === 0 || isLoading}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || files.length === 0 || isLoading}
                className="h-auto px-4"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              {t("privacyNote")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
