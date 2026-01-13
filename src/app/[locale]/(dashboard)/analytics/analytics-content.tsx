"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import type { Transaction, Category } from "@/lib/types";

interface MonthlyDataPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface CategoryDataPoint {
  [key: string]: string | number;
  id: string;
  name: string;
  icon: string;
  amount: number;
  color: string;
}

interface TrendDataPoint {
  date: string;
  dailyIncome: number;
  dailyExpenses: number;
  cumulativeIncome: number;
  cumulativeExpenses: number;
  cumulativeNet: number;
}

interface AnalyticsContentProps {
  transactions: (Transaction & { category: Category | null })[];
  categories: Category[];
  monthlyData: MonthlyDataPoint[];
  categoryData: CategoryDataPoint[];
  trendData: TrendDataPoint[];
  monthlySummaries: any[];
  period: string;
  startDate: string;
  endDate: string;
  locale: "en" | "da";
}

const COLORS = [
  "#C67C4E",
  "#8B9A7D",
  "#D4A574",
  "#A68B5B",
  "#9B8B7A",
  "#7D8471",
  "#B89B7A",
  "#8C7B6B",
  "#6B7D6B",
  "#9B7B5B",
];

export function AnalyticsContent({
  transactions,
  categories,
  monthlyData,
  categoryData,
  trendData,
  monthlySummaries,
  period,
  startDate,
  endDate,
  locale,
}: AnalyticsContentProps) {
  const t = useTranslations("analytics");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = React.useState("overview");

  const updatePeriod = (newPeriod: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    params.delete("startDate");
    params.delete("endDate");
    router.push(`?${params.toString()}`);
  };

  // Calculate summary stats
  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  const netFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const avgMonthlyIncome = monthlyData.length > 0 ? totalIncome / monthlyData.length : 0;
  const avgMonthlyExpenses = monthlyData.length > 0 ? totalExpenses / monthlyData.length : 0;

  // Custom tooltip formatter
  const formatTooltipValue = (value: number) =>
    formatCurrency(value, "DKK", locale);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-3 shadow-lg">
          <p className="font-medium text-[var(--text-primary)]">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatTooltipValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
        <div className="flex gap-2">
          <Select
            value={period}
            onChange={(e) => updatePeriod(e.target.value)}
            className="w-40"
          >
            <option value="1month">{t("period.1month")}</option>
            <option value="3months">{t("period.3months")}</option>
            <option value="6months">{t("period.6months")}</option>
            <option value="1year">{t("period.1year")}</option>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              {t("totalIncome")}
            </p>
            <TrendingUp className="h-5 w-5 text-[var(--accent-success)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--accent-success)]">
            {formatCurrency(totalIncome, "DKK", locale)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {t("avgPerMonth")}: {formatCurrency(avgMonthlyIncome, "DKK", locale)}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              {t("totalExpenses")}
            </p>
            <TrendingDown className="h-5 w-5 text-[var(--accent-danger)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--accent-danger)]">
            {formatCurrency(totalExpenses, "DKK", locale)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {t("avgPerMonth")}:{" "}
            {formatCurrency(avgMonthlyExpenses, "DKK", locale)}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              {t("netFlow")}
            </p>
            {netFlow >= 0 ? (
              <TrendingUp className="h-5 w-5 text-[var(--accent-success)]" />
            ) : (
              <TrendingDown className="h-5 w-5 text-[var(--accent-danger)]" />
            )}
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${
              netFlow >= 0
                ? "text-[var(--accent-success)]"
                : "text-[var(--accent-danger)]"
            }`}
          >
            {formatCurrency(netFlow, "DKK", locale)}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              {t("savingsRate")}
            </p>
            <PieChartIcon className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${
              savingsRate >= 0
                ? "text-[var(--accent-success)]"
                : "text-[var(--accent-danger)]"
            }`}
          >
            {savingsRate.toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            {t("tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="categories">
            <PieChartIcon className="mr-2 h-4 w-4" />
            {t("tabs.categories")}
          </TabsTrigger>
          <TabsTrigger value="trends">
            <LineChartIcon className="mr-2 h-4 w-4" />
            {t("tabs.trends")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Monthly Income vs Expenses Bar Chart */}
          <Card className="p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
              {t("charts.monthlyComparison")}
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-primary)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    tickFormatter={(value) =>
                      `${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name={t("income")}
                    fill="var(--accent-success)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name={t("expenses")}
                    fill="var(--accent-danger)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Net Flow Area Chart */}
          <Card className="p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
              {t("charts.netFlow")}
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-primary)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    tickFormatter={(value) =>
                      `${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <defs>
                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--accent-primary)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--accent-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="net"
                    name={t("netFlow")}
                    stroke="var(--accent-primary)"
                    fill="url(#netGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pie Chart */}
            <Card className="p-6">
              <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
                {t("charts.expensesByCategory")}
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatTooltipValue(value as number)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category List */}
            <Card className="p-6">
              <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
                {t("charts.topCategories")}
              </h3>
              <div className="space-y-4">
                {categoryData.map((category, index) => {
                  const percentage =
                    totalExpenses > 0
                      ? (category.amount / totalExpenses) * 100
                      : 0;
                  return (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category.icon}</span>
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {category.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {formatCurrency(category.amount, "DKK", locale)}
                          </span>
                          <span className="ml-2 text-xs text-[var(--text-tertiary)]">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {categoryData.length === 0 && (
                  <p className="py-8 text-center text-[var(--text-secondary)]">
                    {t("noData")}
                  </p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6 space-y-6">
          {/* Cumulative Chart */}
          <Card className="p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
              {t("charts.cumulativeTrend")}
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-primary)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    tickFormatter={(value) => value.substring(5)}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    tickFormatter={(value) =>
                      `${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cumulativeIncome"
                    name={t("cumulativeIncome")}
                    stroke="var(--accent-success)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeExpenses"
                    name={t("cumulativeExpenses")}
                    stroke="var(--accent-danger)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeNet"
                    name={t("cumulativeNet")}
                    stroke="var(--accent-primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Daily Activity Chart */}
          <Card className="p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
              {t("charts.dailyActivity")}
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData.slice(-30)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-primary)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                    tickFormatter={(value) => value.substring(8)}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="dailyIncome"
                    name={t("dailyIncome")}
                    fill="var(--accent-success)"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="dailyExpenses"
                    name={t("dailyExpenses")}
                    fill="var(--accent-danger)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
