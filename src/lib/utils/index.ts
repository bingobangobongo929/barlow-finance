import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid, differenceInDays } from "date-fns";
import { da, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currencyOrLocale: string = "DKK",
  locale?: "en" | "da"
): string {
  // Support both (amount, locale) and (amount, currency, locale) signatures
  const actualLocale = locale ?? (currencyOrLocale === "en" || currencyOrLocale === "da" ? currencyOrLocale : "da");

  const formatter = new Intl.NumberFormat(actualLocale === "da" ? "da-DK" : "en-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

export function formatNumber(
  number: number,
  locale: "en" | "da" = "da"
): string {
  const formatter = new Intl.NumberFormat(locale === "da" ? "da-DK" : "en-DK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(number);
}

export function formatPercentage(
  value: number,
  locale: "en" | "da" = "da"
): string {
  const formatter = new Intl.NumberFormat(locale === "da" ? "da-DK" : "en-DK", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return formatter.format(value / 100);
}

export function formatDate(
  date: string | Date,
  formatString: string = "dd-MM-yyyy",
  locale: "en" | "da" = "da"
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return "";
  }

  return format(dateObj, formatString, {
    locale: locale === "da" ? da : enUS,
  });
}

export function formatDateRelative(
  date: string | Date,
  locale: "en" | "da" = "da"
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const days = differenceInDays(dateObj, now);

  if (days === 0) {
    return locale === "da" ? "I dag" : "Today";
  } else if (days === 1) {
    return locale === "da" ? "I morgen" : "Tomorrow";
  } else if (days === -1) {
    return locale === "da" ? "I går" : "Yesterday";
  } else if (days > 0 && days <= 7) {
    return locale === "da" ? `Om ${days} dage` : `In ${days} days`;
  } else if (days < 0 && days >= -7) {
    return locale === "da"
      ? `${Math.abs(days)} dage siden`
      : `${Math.abs(days)} days ago`;
  }

  return formatDate(date, "d. MMM yyyy", locale);
}

export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) {
    return "****";
  }

  const lastFour = accountNumber.slice(-4);
  return `****${lastFour}`;
}

export function generateImportHash(
  date: string,
  amount: number,
  description: string
): string {
  const str = `${date}|${amount}|${description}`;
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16);
}

export function generateRandomToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 3) + "...";
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function parseAmount(value: string, locale: "en" | "da" = "da"): number {
  let cleaned = value.replace(/[^\d,.\-]/g, "");

  if (locale === "da") {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseDanishDate(dateString: string): Date | null {
  const formats = [
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
  ];

  for (const regex of formats) {
    const match = dateString.match(regex);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const date = new Date(year, month, day);

      if (isValid(date)) {
        return date;
      }
    }
  }

  const isoDate = parseISO(dateString);
  if (isValid(isoDate)) {
    return isoDate;
  }

  return null;
}

export function getMonthRange(year: number, month: number): [Date, Date] {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return [start, end];
}

export function getYearRange(year: number): [Date, Date] {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return [start, end];
}

export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

export function getBudgetStatus(
  spent: number,
  budgeted: number
): "onTrack" | "warning" | "overBudget" {
  const percentage = (spent / budgeted) * 100;

  if (percentage >= 100) {
    return "overBudget";
  } else if (percentage >= 80) {
    return "warning";
  }

  return "onTrack";
}

export function getCertaintyColor(
  certainty: string
): "green" | "blue" | "yellow" | "orange" | "gray" {
  switch (certainty) {
    case "certain":
      return "green";
    case "expected":
      return "blue";
    case "predicted":
      return "yellow";
    case "planned":
      return "orange";
    case "considering":
      return "gray";
    default:
      return "gray";
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string)
): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey =
        typeof key === "function" ? key(item) : String(item[key]);

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

export function sortBy<T>(array: T[], key: keyof T, direction: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const val = item[key];
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    return true;
  });
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function isEmptyObject(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
