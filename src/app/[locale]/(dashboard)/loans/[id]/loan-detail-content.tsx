"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Calculator,
  Calendar,
  TrendingDown,
  PiggyBank,
  Percent,
  DollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateAmortizationSchedule } from "@/lib/calculations/loan";
import type { AmortizationRow } from "@/lib/types";
import type { Loan, LoanPayment } from "@/lib/types";

interface LoanDetailContentProps {
  loan: Loan;
  payments: LoanPayment[];
  schedule: AmortizationRow[];
  stats: {
    totalPaid: number;
    principalPaid: number;
    interestPaid: number;
    remainingInterest: number;
    projectedPayoffDate: string | null;
  };
  locale: "en" | "da";
}

export function LoanDetailContent({
  loan,
  payments,
  schedule,
  stats,
  locale,
}: LoanDetailContentProps) {
  const t = useTranslations("loans");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [activeTab, setActiveTab] = React.useState("overview");
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showScenarioModal, setShowScenarioModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [paymentForm, setPaymentForm] = React.useState({
    payment_date: new Date().toISOString().split("T")[0],
    principal_amount: "",
    interest_amount: "",
    extra_payment: "",
    notes: "",
  });

  const [scenarioForm, setScenarioForm] = React.useState({
    extraMonthly: "0",
    oneTimePayment: "0",
    oneTimeDate: "",
  });

  const [scenarioSchedule, setScenarioSchedule] = React.useState<AmortizationRow[]>([]);

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

  const handleAddPayment = async () => {
    setIsSubmitting(true);

    try {
      const principal = parseFloat(paymentForm.principal_amount) || 0;
      const interest = parseFloat(paymentForm.interest_amount) || 0;
      const extra = parseFloat(paymentForm.extra_payment) || 0;

      if (principal + interest + extra <= 0) {
        showError(t("invalidPayment"));
        return;
      }

      // Insert payment record
      const { error: paymentError } = await supabase
        .from("loan_payments")
        .insert({
          loan_id: loan.id,
          payment_date: paymentForm.payment_date,
          principal_amount: principal + extra,
          interest_amount: interest,
          extra_payment: extra,
          notes: paymentForm.notes || null,
        });

      if (paymentError) throw paymentError;

      // Update loan balance
      const newBalance = Math.max(0, loan.current_balance - principal - extra);
      const { error: loanError } = await supabase
        .from("loans")
        .update({
          current_balance: newBalance,
          status: newBalance <= 0 ? "paid_off" : "active",
        })
        .eq("id", loan.id);

      if (loanError) throw loanError;

      showSuccess(t("paymentAdded"));
      setShowPaymentModal(false);
      setPaymentForm({
        payment_date: new Date().toISOString().split("T")[0],
        principal_amount: "",
        interest_amount: "",
        extra_payment: "",
        notes: "",
      });
      router.refresh();
    } catch (error) {
      console.error("Payment error:", error);
      showError(t("paymentError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateScenario = () => {
    const extraMonthly = parseFloat(scenarioForm.extraMonthly) || 0;
    const oneTimePayment = parseFloat(scenarioForm.oneTimePayment) || 0;
    const oneTimeDate = scenarioForm.oneTimeDate
      ? new Date(scenarioForm.oneTimeDate)
      : undefined;

    const frequencyMap: { [key: string]: "weekly" | "biweekly" | "monthly" } = {
      weekly: "weekly",
      biweekly: "biweekly",
      monthly: "monthly",
    };

    const newSchedule = generateAmortizationSchedule(
      loan.current_balance,
      loan.interest_rate,
      loan.payment_amount,
      frequencyMap[loan.payment_frequency] || "monthly",
      new Date(),
      extraMonthly,
      oneTimePayment,
      oneTimeDate
    );

    setScenarioSchedule(newSchedule);
  };

  // Prepare chart data
  const chartData = schedule.slice(0, 120).map((row, index) => ({
    payment: index + 1,
    balance: row.balance,
    principal: row.principal,
    interest: row.interest,
    totalPaid: row.payment + row.extraPayment,
  }));

  const scenarioChartData = scenarioSchedule.slice(0, 120).map((row, index) => ({
    payment: index + 1,
    balance: row.balance,
    originalBalance: schedule[index]?.balance || 0,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-3 shadow-lg">
          <p className="font-medium text-[var(--text-primary)]">
            {t("payment")} #{label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value, "DKK", locale)}
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
      <div className="flex items-center gap-4">
        <Link href="/loans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon("back")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{getLoanTypeIcon("loan")}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
                {loan.name}
              </h1>
              {loan.current_balance <= 0 && (
                <Badge variant="success">{t("paidOff")}</Badge>
              )}
            </div>
            {loan.description && (
              <p className="text-[var(--text-secondary)]">{loan.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setShowPaymentModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("recordPayment")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-danger)]/10">
              <DollarSign className="h-5 w-5 text-[var(--accent-danger)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("currentBalance")}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {formatCurrency(loan.current_balance, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-success)]/10">
              <TrendingDown className="h-5 w-5 text-[var(--accent-success)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("principalPaid")}
              </p>
              <p className="text-xl font-bold text-[var(--accent-success)]">
                {formatCurrency(stats.principalPaid, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-warning)]/10">
              <Percent className="h-5 w-5 text-[var(--accent-warning)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("interestPaid")}
              </p>
              <p className="text-xl font-bold text-[var(--accent-warning)]">
                {formatCurrency(stats.interestPaid, "DKK", locale)}
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
                {t("payoffDate")}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {stats.projectedPayoffDate
                  ? formatDate(
                      stats.projectedPayoffDate,
                      locale
                    )
                  : "-"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t("detail.overview")}</TabsTrigger>
          <TabsTrigger value="schedule">{t("detail.amortization")}</TabsTrigger>
          <TabsTrigger value="payments">{t("detail.payments")}</TabsTrigger>
          <TabsTrigger value="scenario">{t("detail.payoffSimulator")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
                {t("loanDetails")}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">
                    {t("originalAmount")}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatCurrency(loan.original_amount, "DKK", locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">
                    {t("interestRate")}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {loan.interest_rate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">
                    {t("paymentAmount")}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatCurrency(loan.payment_amount, "DKK", locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">
                    {t("paymentFrequency")}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {t(loan.payment_frequency)}
                  </span>
                </div>
                {loan.start_date && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">
                      {t("startDate")}
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {formatDate(loan.start_date, locale)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">
                    {t("remainingPayments")}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {schedule.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">
                    {t("totalInterestRemaining")}
                  </span>
                  <span className="font-medium text-[var(--accent-warning)]">
                    {formatCurrency(stats.remainingInterest, "DKK", locale)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
                {t("balanceOverTime")}
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-primary)"
                    />
                    <XAxis
                      dataKey="payment"
                      tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
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
                      dataKey="balance"
                      name={t("balance")}
                      stroke="var(--accent-primary)"
                      fill="url(#balanceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6">
          <Card className="overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[var(--bg-primary)]">
                  <tr className="border-b border-[var(--border-primary)]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                      {t("date")}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--text-secondary)]">
                      {t("payment")}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--text-secondary)]">
                      {t("principal")}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--text-secondary)]">
                      {t("interest")}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--text-secondary)]">
                      {t("balance")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.slice(0, 360).map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-[var(--border-primary)] last:border-0"
                    >
                      <td className="px-4 py-2 text-sm text-[var(--text-secondary)]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 text-sm text-[var(--text-primary)]">
                        {formatDate(row.date, locale)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-[var(--text-primary)]">
                        {formatCurrency(row.payment, "DKK", locale)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-[var(--accent-success)]">
                        {formatCurrency(row.principal, "DKK", locale)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-[var(--accent-warning)]">
                        {formatCurrency(row.interest, "DKK", locale)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-[var(--text-primary)]">
                        {formatCurrency(row.balance, "DKK", locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6">
          <Card>
            {payments.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[var(--text-secondary)]">{t("noPayments")}</p>
                <Button
                  className="mt-4"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("recordPayment")}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                        {t("date")}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--text-secondary)]">
                        {t("principal")}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--text-secondary)]">
                        {t("interest")}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--text-secondary)]">
                        {t("extra")}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--text-secondary)]">
                        {t("total")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--text-secondary)]">
                        {t("notes")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-[var(--border-primary)] last:border-0"
                      >
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                          {formatDate(payment.payment_date, locale)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-[var(--accent-success)]">
                          {formatCurrency(Number(payment.principal_amount), "DKK", locale)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-[var(--accent-warning)]">
                          {formatCurrency(Number(payment.interest_amount), "DKK", locale)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-[var(--accent-primary)]">
                          {payment.extra_payment
                            ? formatCurrency(Number(payment.extra_payment), "DKK", locale)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-[var(--text-primary)]">
                          {formatCurrency(
                            Number(payment.principal_amount) +
                              Number(payment.interest_amount),
                            "DKK",
                            locale
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          "-"
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Scenario Tab */}
        <TabsContent value="scenario" className="mt-6 space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
              {t("simulator.title")}
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="form-group">
                <Label htmlFor="extraMonthly">{t("simulator.extraPayment")}</Label>
                <Input
                  id="extraMonthly"
                  type="number"
                  min="0"
                  step="100"
                  value={scenarioForm.extraMonthly}
                  onChange={(e) =>
                    setScenarioForm({
                      ...scenarioForm,
                      extraMonthly: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <Label htmlFor="oneTimePayment">{t("simulator.oneTimePayment")}</Label>
                <Input
                  id="oneTimePayment"
                  type="number"
                  min="0"
                  step="1000"
                  value={scenarioForm.oneTimePayment}
                  onChange={(e) =>
                    setScenarioForm({
                      ...scenarioForm,
                      oneTimePayment: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <Label htmlFor="oneTimeDate">{t("simulator.oneTimeDate")}</Label>
                <Input
                  id="oneTimeDate"
                  type="date"
                  value={scenarioForm.oneTimeDate}
                  onChange={(e) =>
                    setScenarioForm({
                      ...scenarioForm,
                      oneTimeDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <Button className="mt-4" onClick={calculateScenario}>
              <Calculator className="mr-2 h-4 w-4" />
              {t("simulator.calculate")}
            </Button>
          </Card>

          {scenarioSchedule.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-4">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("simulator.newPayoff")}
                  </p>
                  <p className="mt-1 text-xl font-bold text-[var(--accent-success)]">
                    {formatDate(
                      scenarioSchedule[scenarioSchedule.length - 1].date,
                      locale
                    )}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("simulator.timeSaved")}
                  </p>
                  <p className="mt-1 text-xl font-bold text-[var(--accent-success)]">
                    {schedule.length - scenarioSchedule.length}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("simulator.interestSaved")}
                  </p>
                  <p className="mt-1 text-xl font-bold text-[var(--accent-success)]">
                    {formatCurrency(
                      stats.remainingInterest -
                        scenarioSchedule.reduce((sum, r) => sum + r.interest, 0),
                      "DKK",
                      locale
                    )}
                  </p>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
                  {t("simulator.comparison")}
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scenarioChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border-primary)"
                      />
                      <XAxis
                        dataKey="payment"
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
                      <Line
                        type="monotone"
                        dataKey="originalBalance"
                        name={t("simulator.originalSchedule")}
                        stroke="var(--text-tertiary)"
                        strokeDasharray="5 5"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        name={t("simulator.newSchedule")}
                        stroke="var(--accent-success)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={t("recordPayment")}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddPayment();
          }}
          className="space-y-4"
        >
          <div className="form-group">
            <Label htmlFor="payment_date" required>
              {t("paymentDate")}
            </Label>
            <Input
              id="payment_date"
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, payment_date: e.target.value })
              }
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="form-group">
              <Label htmlFor="principal_amount">{t("principalAmount")}</Label>
              <Input
                id="principal_amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.principal_amount}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    principal_amount: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <Label htmlFor="interest_amount">{t("interestAmount")}</Label>
              <Input
                id="interest_amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.interest_amount}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    interest_amount: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <Label htmlFor="extra_payment">{t("extraPayment")}</Label>
            <Input
              id="extra_payment"
              type="number"
              step="0.01"
              min="0"
              value={paymentForm.extra_payment}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  extra_payment: e.target.value,
                })
              }
            />
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              {t("extraPaymentHint")}
            </p>
          </div>

          <div className="form-group">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Input
              id="notes"
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, notes: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPaymentModal(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t("recordPayment")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
