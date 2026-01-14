import type { ParsedTransaction } from "./csv/parser";

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  dateRange: {
    start: string;
    end: string;
  };
  averageExpense: number;
  averageIncome: number;
}

export interface CategoryBreakdown {
  name: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyBreakdown {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
}

export interface RecurringTransaction {
  description: string;
  averageAmount: number;
  occurrences: number;
  frequency: "weekly" | "biweekly" | "monthly" | "irregular";
  type: "income" | "expense";
}

export interface FinancialAnomaly {
  date: string;
  description: string;
  amount: number;
  type: "large_expense" | "unusual_income" | "duplicate" | "spike";
  severity: "low" | "medium" | "high";
  message: string;
}

/**
 * Calculate overall financial summary from transactions
 */
export function calculateFinancialSummary(
  transactions: ParsedTransaction[]
): FinancialSummary {
  if (transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      transactionCount: 0,
      dateRange: { start: "", end: "" },
      averageExpense: 0,
      averageIncome: 0,
    };
  }

  const incomeTransactions = transactions.filter((t) => t.type === "income");
  const expenseTransactions = transactions.filter((t) => t.type === "expense");

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  const dates = transactions.map((t) => t.transaction_date).sort();

  return {
    totalIncome,
    totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    dateRange: {
      start: dates[0],
      end: dates[dates.length - 1],
    },
    averageExpense:
      expenseTransactions.length > 0
        ? totalExpenses / expenseTransactions.length
        : 0,
    averageIncome:
      incomeTransactions.length > 0
        ? totalIncome / incomeTransactions.length
        : 0,
  };
}

/**
 * Group transactions by merchant/description and calculate totals
 */
export function groupByMerchant(
  transactions: ParsedTransaction[]
): CategoryBreakdown[] {
  const groups = new Map<
    string,
    { total: number; count: number; type: string }
  >();

  for (const t of transactions) {
    // Normalize description for grouping
    const key = normalizeDescription(t.description);
    const existing = groups.get(key) || { total: 0, count: 0, type: t.type };
    existing.total += t.amount;
    existing.count += 1;
    groups.set(key, existing);
  }

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const result: CategoryBreakdown[] = [];

  for (const [name, data] of groups) {
    result.push({
      name,
      total: data.total,
      count: data.count,
      percentage:
        totalExpenses > 0 && data.type === "expense"
          ? (data.total / totalExpenses) * 100
          : 0,
    });
  }

  return result.sort((a, b) => b.total - a.total);
}

/**
 * Get monthly breakdown of income and expenses
 */
export function getMonthlyBreakdown(
  transactions: ParsedTransaction[]
): MonthlyBreakdown[] {
  const months = new Map<
    string,
    { income: number; expenses: number; count: number }
  >();

  for (const t of transactions) {
    const month = t.transaction_date.substring(0, 7); // YYYY-MM
    const existing = months.get(month) || { income: 0, expenses: 0, count: 0 };

    if (t.type === "income") {
      existing.income += t.amount;
    } else {
      existing.expenses += t.amount;
    }
    existing.count += 1;

    months.set(month, existing);
  }

  const result: MonthlyBreakdown[] = [];

  for (const [month, data] of months) {
    result.push({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
      transactionCount: data.count,
    });
  }

  return result.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Identify recurring transactions (subscriptions, salary, etc.)
 */
export function identifyRecurringTransactions(
  transactions: ParsedTransaction[]
): RecurringTransaction[] {
  // Group by normalized description
  const groups = new Map<
    string,
    { amounts: number[]; dates: string[]; type: string }
  >();

  for (const t of transactions) {
    const key = normalizeDescription(t.description);
    const existing = groups.get(key) || { amounts: [], dates: [], type: t.type };
    existing.amounts.push(t.amount);
    existing.dates.push(t.transaction_date);
    groups.set(key, existing);
  }

  const recurring: RecurringTransaction[] = [];

  for (const [description, data] of groups) {
    // Need at least 2 occurrences to be recurring
    if (data.amounts.length < 2) continue;

    // Check if amounts are similar (within 10%)
    const avgAmount =
      data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
    const isConsistentAmount = data.amounts.every(
      (a) => Math.abs(a - avgAmount) / avgAmount < 0.1
    );

    if (!isConsistentAmount && data.amounts.length < 3) continue;

    // Determine frequency
    const frequency = detectFrequency(data.dates);

    if (frequency !== "irregular" || data.amounts.length >= 3) {
      recurring.push({
        description,
        averageAmount: avgAmount,
        occurrences: data.amounts.length,
        frequency,
        type: data.type as "income" | "expense",
      });
    }
  }

  return recurring.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Detect anomalies in transaction data
 */
export function detectAnomalies(
  transactions: ParsedTransaction[]
): FinancialAnomaly[] {
  const anomalies: FinancialAnomaly[] = [];

  // Calculate averages for comparison
  const expenses = transactions.filter((t) => t.type === "expense");
  const avgExpense =
    expenses.length > 0
      ? expenses.reduce((sum, t) => sum + t.amount, 0) / expenses.length
      : 0;

  const stdDevExpense = calculateStdDev(expenses.map((t) => t.amount));

  // Detect large expenses (> 3 standard deviations)
  for (const t of expenses) {
    if (t.amount > avgExpense + 3 * stdDevExpense && t.amount > 1000) {
      anomalies.push({
        date: t.transaction_date,
        description: t.description,
        amount: t.amount,
        type: "large_expense",
        severity: t.amount > avgExpense * 5 ? "high" : "medium",
        message: `Unusually large expense of ${t.amount.toFixed(0)} DKK`,
      });
    }
  }

  // Detect monthly spending spikes
  const monthlySpending = getMonthlyBreakdown(transactions);
  const avgMonthlyExpense =
    monthlySpending.length > 0
      ? monthlySpending.reduce((sum, m) => sum + m.expenses, 0) /
        monthlySpending.length
      : 0;

  for (const month of monthlySpending) {
    if (month.expenses > avgMonthlyExpense * 1.5 && month.expenses > 5000) {
      anomalies.push({
        date: month.month,
        description: `Month of ${month.month}`,
        amount: month.expenses,
        type: "spike",
        severity: month.expenses > avgMonthlyExpense * 2 ? "high" : "medium",
        message: `Spending spike: ${month.expenses.toFixed(0)} DKK (${(((month.expenses - avgMonthlyExpense) / avgMonthlyExpense) * 100).toFixed(0)}% above average)`,
      });
    }
  }

  return anomalies;
}

/**
 * Prepare financial context for AI analysis
 */
export function prepareFinancialContext(
  transactions: ParsedTransaction[],
  maxTransactions: number = 500
) {
  // Get summary
  const summary = calculateFinancialSummary(transactions);

  // Get top merchants by spending
  const merchantBreakdown = groupByMerchant(
    transactions.filter((t) => t.type === "expense")
  ).slice(0, 15);

  // Get income sources
  const incomeSources = groupByMerchant(
    transactions.filter((t) => t.type === "income")
  ).slice(0, 10);

  // Get monthly breakdown
  const monthlyBreakdown = getMonthlyBreakdown(transactions);

  // Get recurring transactions
  const recurring = identifyRecurringTransactions(transactions);

  // Get anomalies
  const anomalies = detectAnomalies(transactions);

  // Sample transactions if too many (keep most recent)
  const sortedTransactions = [...transactions].sort(
    (a, b) => b.transaction_date.localeCompare(a.transaction_date)
  );

  const sampledTransactions = sortedTransactions
    .slice(0, maxTransactions)
    .map((t) => ({
      date: t.transaction_date,
      description: t.description,
      amount: t.type === "expense" ? -t.amount : t.amount,
      type: t.type,
    }));

  return {
    summary,
    topExpenseCategories: merchantBreakdown,
    incomeSources,
    monthlyBreakdown,
    recurringTransactions: recurring.slice(0, 20),
    anomalies,
    recentTransactions: sampledTransactions,
  };
}

// Helper functions

function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/[0-9]+/g, "") // Remove numbers
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\*/g, "") // Remove asterisks
    .replace(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/g, "") // Remove dates
    .trim()
    .substring(0, 50); // Limit length
}

function detectFrequency(
  dates: string[]
): "weekly" | "biweekly" | "monthly" | "irregular" {
  if (dates.length < 2) return "irregular";

  const sortedDates = dates.sort();
  const gaps: number[] = [];

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const daysDiff = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    gaps.push(daysDiff);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  if (avgGap >= 5 && avgGap <= 9) return "weekly";
  if (avgGap >= 12 && avgGap <= 18) return "biweekly";
  if (avgGap >= 25 && avgGap <= 35) return "monthly";

  return "irregular";
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  const avgSquareDiff =
    squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;

  return Math.sqrt(avgSquareDiff);
}
