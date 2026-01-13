"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  X,
  Receipt,
  Clock,
  PiggyBank,
  Target,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, formatPercentage, cn } from "@/lib/utils";
import type { Profile, Transaction, UpcomingExpense, Budget, Project, AIInsight } from "@/lib/types";

interface DashboardContentProps {
  profile: Profile & { household: { name: string } };
  stats: {
    income: number;
    expenses: number;
    netFlow: number;
    savingsRate: number;
    incomeChange: number;
    expensesChange: number;
  };
  recentTransactions: (Transaction & { category?: { name: string; name_da: string; icon: string; color: string } | null })[];
  upcomingExpenses: (UpcomingExpense & { category?: { name: string; name_da: string } | null })[];
  budgets: (Budget & { category?: { name: string; name_da: string } | null })[];
  projects: Project[];
  insight: AIInsight | null;
  locale: "en" | "da";
}

export function DashboardContent({
  profile,
  stats,
  recentTransactions,
  upcomingExpenses,
  budgets,
  projects,
  insight,
  locale,
}: DashboardContentProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [insightDismissed, setInsightDismissed] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">
          {t("greeting", { name: profile.display_name })}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {profile.household?.name} &middot; {t("thisMonth")}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.income")}
          value={formatCurrency(stats.income, locale)}
          change={stats.incomeChange}
          changeLabel={t("vsLastMonth")}
          variant="income"
        />
        <StatCard
          label={t("stats.expenses")}
          value={formatCurrency(stats.expenses, locale)}
          change={stats.expensesChange}
          changeLabel={t("vsLastMonth")}
          variant="expense"
          invertChangeColor
        />
        <StatCard
          label={t("stats.netFlow")}
          value={formatCurrency(stats.netFlow, locale)}
          variant={stats.netFlow >= 0 ? "income" : "expense"}
        />
        <StatCard
          label={t("stats.savingsRate")}
          value={formatPercentage(stats.savingsRate, locale)}
          variant={stats.savingsRate >= 20 ? "income" : stats.savingsRate >= 0 ? "neutral" : "expense"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Transactions & Budgets */}
        <div className="space-y-6 lg:col-span-2">
          {/* Budget Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[var(--text-secondary)]" />
                {t("budgetHealth.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgets.length > 0 ? (
                <div className="space-y-4">
                  {budgets.slice(0, 4).map((budget) => {
                    const spent = budget.spent || 0;
                    const percentage = (spent / budget.amount) * 100;
                    const status =
                      percentage >= 100
                        ? "overBudget"
                        : percentage >= 80
                        ? "warning"
                        : "onTrack";

                    return (
                      <div key={budget.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-[var(--text-primary)]">
                            {locale === "da"
                              ? budget.category?.name_da || budget.name
                              : budget.category?.name || budget.name}
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              status === "onTrack" && "text-[var(--income)]",
                              status === "warning" && "text-[var(--accent-warning)]",
                              status === "overBudget" && "text-[var(--expense)]"
                            )}
                          >
                            {t(`budgetHealth.${status}`)}
                          </span>
                        </div>
                        <Progress
                          value={spent}
                          max={budget.amount}
                          size="sm"
                          variant={status === "onTrack" ? "success" : status === "warning" ? "warning" : "danger"}
                        />
                        <div className="mt-1 flex justify-between text-xs text-[var(--text-tertiary)]">
                          <span>
                            {formatCurrency(spent, locale)} / {formatCurrency(budget.amount, locale)}
                          </span>
                          <span>
                            {percentage < 100
                              ? t("budgetHealth.remaining", {
                                  amount: formatCurrency(budget.amount - spent, locale),
                                })
                              : t("budgetHealth.overBy", {
                                  amount: formatCurrency(spent - budget.amount, locale),
                                })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
                  <PiggyBank className="mx-auto mb-2 h-8 w-8 text-[var(--text-tertiary)]" />
                  <p>No budgets set up yet</p>
                  <Link href="/budgets">
                    <Button variant="link" size="sm" className="mt-2">
                      Create your first budget
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[var(--text-secondary)]" />
                {t("recentTransactions.title")}
              </CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm">
                  {t("recentTransactions.viewAll")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-lg p-2 hover:bg-[var(--bg-hover)]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: transaction.category?.color
                              ? `${transaction.category.color}20`
                              : "var(--bg-tertiary)",
                          }}
                        >
                          {transaction.type === "income" ? (
                            <TrendingUp className="h-4 w-4 text-[var(--income)]" />
                          ) : transaction.type === "expense" ? (
                            <TrendingDown className="h-4 w-4 text-[var(--expense)]" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-[var(--transfer)]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {locale === "da"
                              ? transaction.category?.name_da
                              : transaction.category?.name}
                            {" · "}
                            {formatDate(transaction.transaction_date, "d. MMM", locale)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "font-mono text-sm font-medium",
                          transaction.type === "income"
                            ? "text-[var(--income)]"
                            : transaction.type === "expense"
                            ? "text-[var(--expense)]"
                            : "text-[var(--transfer)]"
                        )}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
                  <Receipt className="mx-auto mb-2 h-8 w-8 text-[var(--text-tertiary)]" />
                  <p>{t("recentTransactions.noTransactions")}</p>
                  <Link href="/transactions/import">
                    <Button variant="link" size="sm" className="mt-2">
                      Import transactions
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Upcoming, Projects, AI */}
        <div className="space-y-6">
          {/* AI Insight */}
          {insight && !insightDismissed && (
            <Card className="border-[var(--accent-primary)] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
                  <CardTitle className="text-base">{t("aiInsight.title")}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setInsightDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {insight.title}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {insight.content}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[var(--text-secondary)]" />
                {t("upcomingExpenses.title")}
              </CardTitle>
              <Link href="/upcoming">
                <Button variant="ghost" size="sm">
                  {t("upcomingExpenses.viewAll")}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingExpenses.length > 0 ? (
                <div className="space-y-3">
                  {upcomingExpenses.map((expense) => {
                    const dueDate = new Date(expense.due_date);
                    const today = new Date();
                    const daysUntil = Math.ceil(
                      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between rounded-lg border border-[var(--border-default)] p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {expense.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant={expense.certainty as "certain" | "expected" | "predicted" | "planned" | "considering"}>
                              {locale === "da"
                                ? expense.certainty === "certain"
                                  ? "Sikker"
                                  : expense.certainty === "expected"
                                  ? "Forventet"
                                  : expense.certainty
                                : expense.certainty}
                            </Badge>
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {daysUntil === 0
                                ? t("upcomingExpenses.dueToday")
                                : daysUntil < 0
                                ? t("upcomingExpenses.overdue")
                                : t("upcomingExpenses.dueIn", { days: daysUntil })}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-sm font-medium text-[var(--expense)]">
                          {formatCurrency(expense.amount, locale)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-[var(--text-secondary)]">
                  {t("upcomingExpenses.noUpcoming")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[var(--text-secondary)]" />
                {t("projects.title")}
              </CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  {t("projects.viewAll")}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => {
                    const percentage = (project.current_amount / project.target_amount) * 100;

                    return (
                      <div key={project.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-[var(--text-primary)]">
                            {project.name}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {t("projects.progress", { percent: Math.round(percentage) })}
                          </span>
                        </div>
                        <Progress value={project.current_amount} max={project.target_amount} size="sm" />
                        <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                          {formatCurrency(project.current_amount, locale)} /{" "}
                          {formatCurrency(project.target_amount, locale)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-[var(--text-secondary)]">
                  <Target className="mx-auto mb-2 h-8 w-8 text-[var(--text-tertiary)]" />
                  <p>No active projects</p>
                  <Link href="/projects">
                    <Button variant="link" size="sm" className="mt-2">
                      Create a savings goal
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  variant?: "income" | "expense" | "neutral";
  invertChangeColor?: boolean;
}

function StatCard({
  label,
  value,
  change,
  changeLabel,
  variant = "neutral",
  invertChangeColor = false,
}: StatCardProps) {
  const isPositiveChange = change !== undefined && change >= 0;
  const showPositiveColor = invertChangeColor ? !isPositiveChange : isPositiveChange;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="stat-card">
          <span className="stat-label">{label}</span>
          <span
            className={cn(
              "stat-value font-mono",
              variant === "income" && "text-[var(--income)]",
              variant === "expense" && "text-[var(--expense)]",
              variant === "neutral" && "text-[var(--text-primary)]"
            )}
          >
            {value}
          </span>
          {change !== undefined && (
            <div
              className={cn(
                "stat-change",
                showPositiveColor ? "stat-change-positive" : "stat-change-negative"
              )}
            >
              {isPositiveChange ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {isPositiveChange ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-[var(--text-tertiary)]">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
