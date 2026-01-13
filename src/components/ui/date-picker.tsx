"use client";

import * as React from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { da, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  locale?: "en" | "da";
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  locale = "da",
  minDate,
  maxDate,
  disabled,
  error,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(value || new Date());
  const containerRef = React.useRef<HTMLDivElement>(null);

  const dateLocale = locale === "da" ? da : enUS;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { locale: dateLocale });
  const calendarEnd = endOfWeek(monthEnd, { locale: dateLocale });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const weekDaysDa = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          readOnly
          value={value ? format(value, "dd-MM-yyyy") : ""}
          placeholder={placeholder}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          error={error}
          className="cursor-pointer pr-10"
        />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-lg animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {format(viewDate, "MMMM yyyy", { locale: dateLocale })}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {(locale === "da" ? weekDaysDa : weekDays).map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-[var(--text-tertiary)]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isSelected = value && isSameDay(day, value);
              const isCurrentMonth = isSameMonth(day, viewDate);
              const isCurrentDay = isToday(day);
              const isDisabled = isDateDisabled(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    "h-8 w-8 rounded-md text-sm transition-colors",
                    !isCurrentMonth && "text-[var(--text-tertiary)]",
                    isCurrentMonth && !isSelected && "text-[var(--text-primary)]",
                    isSelected &&
                      "bg-[var(--accent-primary)] text-white",
                    !isSelected &&
                      !isDisabled &&
                      "hover:bg-[var(--bg-hover)]",
                    isCurrentDay &&
                      !isSelected &&
                      "border border-[var(--accent-primary)]",
                    isDisabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-4 border-t border-[var(--border-default)] pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                const today = new Date();
                setViewDate(today);
                handleDateSelect(today);
              }}
            >
              {locale === "da" ? "I dag" : "Today"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
