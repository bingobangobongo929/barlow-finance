"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertCircle,
  DollarSign,
  Car,
  Wrench,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { da, enUS } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  amount?: number;
  type: "expense" | "loan" | "maintenance";
  isPaid?: boolean;
}

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");

  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [locale, setLocale] = React.useState<"en" | "da">("en");

  const supabase = createClient();
  const dateLocale = locale === "da" ? da : enUS;

  React.useEffect(() => {
    async function loadEvents() {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id, preferred_language")
        .eq("id", user.id)
        .single();

      if (!profile) return;
      setLocale((profile.preferred_language as "en" | "da") || "en");

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Fetch upcoming expenses
      const { data: expenses } = await supabase
        .from("upcoming_expenses")
        .select("id, name, due_date, amount, is_paid")
        .eq("household_id", profile.household_id)
        .gte("due_date", format(monthStart, "yyyy-MM-dd"))
        .lte("due_date", format(monthEnd, "yyyy-MM-dd"));

      // Fetch loan payments (from schedule or upcoming)
      const { data: loans } = await supabase
        .from("loans")
        .select("id, name, payment_amount, start_date, payment_frequency")
        .eq("household_id", profile.household_id)
        .eq("is_active", true);

      // Fetch vehicle maintenance with upcoming due dates
      const { data: maintenance } = await supabase
        .from("vehicle_maintenance")
        .select("id, description, next_due_date, cost, vehicle:vehicles(nickname)")
        .not("next_due_date", "is", null)
        .gte("next_due_date", format(monthStart, "yyyy-MM-dd"))
        .lte("next_due_date", format(monthEnd, "yyyy-MM-dd"));

      const calendarEvents: CalendarEvent[] = [];

      // Add expenses
      (expenses || []).forEach((expense) => {
        calendarEvents.push({
          id: `expense-${expense.id}`,
          date: expense.due_date,
          title: expense.name,
          amount: expense.amount,
          type: "expense",
          isPaid: expense.is_paid,
        });
      });

      // Add loan payments (simple monthly calculation)
      (loans || []).forEach((loan) => {
        if (loan.payment_frequency === "monthly" && loan.start_date) {
          const startDay = parseISO(loan.start_date).getDate();
          const paymentDate = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            startDay
          );
          if (paymentDate >= monthStart && paymentDate <= monthEnd) {
            calendarEvents.push({
              id: `loan-${loan.id}`,
              date: format(paymentDate, "yyyy-MM-dd"),
              title: loan.name,
              amount: loan.payment_amount,
              type: "loan",
            });
          }
        }
      });

      // Add maintenance
      (maintenance || []).forEach((m: any) => {
        calendarEvents.push({
          id: `maintenance-${m.id}`,
          date: m.next_due_date,
          title: `${m.vehicle?.nickname || "Vehicle"}: ${m.description}`,
          amount: m.cost,
          type: "maintenance",
        });
      });

      setEvents(calendarEvents);
      setIsLoading(false);
    }

    loadEvents();
  }, [currentMonth, supabase]);

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">
          {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            {t("today")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={i}
          className="py-2 text-center text-xs font-medium uppercase text-[var(--text-secondary)]"
        >
          {format(addDays(startDate, i), "EEE", { locale: dateLocale })}
        </div>
      );
    }

    return <div className="grid grid-cols-7">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayEvents = events.filter((e) =>
          isSameDay(parseISO(e.date), currentDay)
        );

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] border-b border-r border-[var(--border-primary)] p-1 ${
              !isSameMonth(currentDay, monthStart)
                ? "bg-[var(--bg-secondary)] opacity-50"
                : ""
            } ${
              isSameDay(currentDay, new Date())
                ? "bg-[var(--accent-primary)]/5"
                : ""
            } ${
              selectedDate && isSameDay(currentDay, selectedDate)
                ? "ring-2 ring-inset ring-[var(--accent-primary)]"
                : ""
            } cursor-pointer hover:bg-[var(--bg-secondary)]`}
            onClick={() => setSelectedDate(currentDay)}
          >
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                isSameDay(currentDay, new Date())
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {format(currentDay, "d")}
            </span>
            <div className="mt-1 space-y-0.5">
              {dayEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={`truncate rounded px-1 py-0.5 text-xs ${
                    event.type === "expense"
                      ? event.isPaid
                        ? "bg-[var(--accent-success)]/20 text-[var(--accent-success)]"
                        : "bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]"
                      : event.type === "loan"
                      ? "bg-[var(--accent-danger)]/20 text-[var(--accent-danger)]"
                      : "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
                  }`}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-[var(--text-tertiary)]">
                  +{dayEvents.length - 2} {t("more")}
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="border-l border-t border-[var(--border-primary)]">{rows}</div>;
  };

  const selectedDateEvents = selectedDate
    ? events.filter((e) => isSameDay(parseISO(e.date), selectedDate))
    : [];

  // Calculate monthly totals
  const monthlyExpenses = events
    .filter((e) => e.type === "expense" && !e.isPaid)
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthlyLoans = events
    .filter((e) => e.type === "loan")
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthlyMaintenance = events
    .filter((e) => e.type === "maintenance")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">{t("subtitle")}</p>
      </div>

      {/* Monthly Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-warning)]/10">
              <AlertCircle className="h-5 w-5 text-[var(--accent-warning)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("upcomingExpenses")}
              </p>
              <p className="text-xl font-bold text-[var(--accent-warning)]">
                {formatCurrency(monthlyExpenses, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-danger)]/10">
              <DollarSign className="h-5 w-5 text-[var(--accent-danger)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("loanPayments")}
              </p>
              <p className="text-xl font-bold text-[var(--accent-danger)]">
                {formatCurrency(monthlyLoans, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
              <Wrench className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("maintenance")}
              </p>
              <p className="text-xl font-bold text-[var(--accent-primary)]">
                {formatCurrency(monthlyMaintenance, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Calendar */}
        <Card className="p-4">
          {renderHeader()}
          <div className="mt-4">
            {renderDays()}
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              renderCells()
            )}
          </div>
        </Card>

        {/* Selected Day Details */}
        <Card className="h-fit p-4">
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
            {selectedDate
              ? format(selectedDate, "EEEE, MMMM d", { locale: dateLocale })
              : t("selectDate")}
          </h3>

          {selectedDate && (
            <div className="mt-4 space-y-3">
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("noEvents")}
                </p>
              ) : (
                selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-[var(--border-primary)] p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {event.type === "expense" && (
                          <AlertCircle className="h-4 w-4 text-[var(--accent-warning)]" />
                        )}
                        {event.type === "loan" && (
                          <DollarSign className="h-4 w-4 text-[var(--accent-danger)]" />
                        )}
                        {event.type === "maintenance" && (
                          <Wrench className="h-4 w-4 text-[var(--accent-primary)]" />
                        )}
                        <span className="font-medium text-[var(--text-primary)]">
                          {event.title}
                        </span>
                      </div>
                      {event.isPaid && (
                        <Badge variant="success">{t("paid")}</Badge>
                      )}
                    </div>
                    {event.amount && (
                      <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                        {formatCurrency(event.amount, "DKK", locale)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
