import { addMonths, format } from "date-fns";
import type { AmortizationRow, PayoffSimulation, PaymentFrequency } from "@/lib/types";

/**
 * Calculate the monthly payment for a loan using the standard amortization formula
 * M = P × [r(1+r)^n] / [(1+r)^n – 1]
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) {
    return principal / termMonths;
  }

  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const payment = principal * (monthlyRate * factor) / (factor - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * Get the number of payments per year for a given frequency
 */
export function getPaymentsPerYear(frequency: PaymentFrequency): number {
  switch (frequency) {
    case "weekly":
      return 52;
    case "biweekly":
      return 26;
    case "monthly":
      return 12;
    case "quarterly":
      return 4;
    case "yearly":
      return 1;
    default:
      return 12;
  }
}

/**
 * Generate an amortization schedule for a loan
 */
export function generateAmortizationSchedule(
  currentBalance: number,
  annualRate: number,
  paymentAmount: number,
  frequency: PaymentFrequency,
  startDate: Date,
  extraMonthlyPayment: number = 0,
  oneTimePayment: number = 0,
  oneTimePaymentDate?: Date
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  let balance = currentBalance;
  let paymentNumber = 0;
  const paymentsPerYear = getPaymentsPerYear(frequency);
  const periodicRate = annualRate / 100 / paymentsPerYear;

  // Calculate months between payments
  const monthsPerPayment = 12 / paymentsPerYear;

  // Maximum iterations to prevent infinite loops
  const maxPayments = 1200; // 100 years

  let currentDate = new Date(startDate);
  let oneTimePaymentApplied = false;

  while (balance > 0.01 && paymentNumber < maxPayments) {
    paymentNumber++;

    // Calculate interest for this period
    const interestAmount = balance * periodicRate;

    // Check if one-time payment should be applied this period
    let extraPaymentThisPeriod = 0;
    if (
      oneTimePayment > 0 &&
      oneTimePaymentDate &&
      !oneTimePaymentApplied &&
      currentDate >= oneTimePaymentDate
    ) {
      extraPaymentThisPeriod = oneTimePayment;
      oneTimePaymentApplied = true;
    }

    // Add regular extra payment (converted to period if not monthly)
    if (frequency === "monthly") {
      extraPaymentThisPeriod += extraMonthlyPayment;
    } else {
      extraPaymentThisPeriod += (extraMonthlyPayment * 12) / paymentsPerYear;
    }

    // Calculate total payment for this period
    let totalPayment = paymentAmount + extraPaymentThisPeriod;

    // Don't pay more than balance + interest
    if (totalPayment > balance + interestAmount) {
      totalPayment = balance + interestAmount;
      extraPaymentThisPeriod = Math.max(0, totalPayment - paymentAmount);
    }

    // Calculate principal portion
    const principalAmount = totalPayment - interestAmount;

    // Update balance
    balance = Math.max(0, balance - principalAmount);

    schedule.push({
      paymentNumber,
      date: format(currentDate, "yyyy-MM-dd"),
      payment: Math.round(totalPayment * 100) / 100,
      principal: Math.round(principalAmount * 100) / 100,
      interest: Math.round(interestAmount * 100) / 100,
      extraPayment: Math.round(extraPaymentThisPeriod * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });

    // Move to next payment date
    currentDate = addMonths(currentDate, monthsPerPayment);
  }

  return schedule;
}

/**
 * Calculate total interest paid over the life of a loan from an amortization schedule
 */
export function calculateTotalInterest(schedule: AmortizationRow[]): number {
  return schedule.reduce((total, row) => total + row.interest, 0);
}

/**
 * Simulate loan payoff with extra payments
 */
export function simulateLoanPayoff(
  currentBalance: number,
  annualRate: number,
  paymentAmount: number,
  frequency: PaymentFrequency,
  startDate: Date,
  extraMonthlyPayment: number = 0,
  oneTimePayment: number = 0,
  oneTimePaymentDate?: Date
): PayoffSimulation {
  // Generate original schedule (no extra payments)
  const originalSchedule = generateAmortizationSchedule(
    currentBalance,
    annualRate,
    paymentAmount,
    frequency,
    startDate
  );

  // Generate new schedule (with extra payments)
  const newSchedule = generateAmortizationSchedule(
    currentBalance,
    annualRate,
    paymentAmount,
    frequency,
    startDate,
    extraMonthlyPayment,
    oneTimePayment,
    oneTimePaymentDate
  );

  const originalPayoffDate =
    originalSchedule.length > 0
      ? originalSchedule[originalSchedule.length - 1].date
      : format(startDate, "yyyy-MM-dd");

  const newPayoffDate =
    newSchedule.length > 0
      ? newSchedule[newSchedule.length - 1].date
      : format(startDate, "yyyy-MM-dd");

  const originalTotalInterest = calculateTotalInterest(originalSchedule);
  const newTotalInterest = calculateTotalInterest(newSchedule);

  return {
    originalPayoffDate,
    newPayoffDate,
    originalTotalInterest: Math.round(originalTotalInterest * 100) / 100,
    newTotalInterest: Math.round(newTotalInterest * 100) / 100,
    interestSaved: Math.round((originalTotalInterest - newTotalInterest) * 100) / 100,
    monthsSaved: originalSchedule.length - newSchedule.length,
    schedule: newSchedule,
  };
}

/**
 * Calculate expected payoff date for a loan
 */
export function calculatePayoffDate(
  currentBalance: number,
  annualRate: number,
  paymentAmount: number,
  frequency: PaymentFrequency,
  startDate: Date
): Date {
  const schedule = generateAmortizationSchedule(
    currentBalance,
    annualRate,
    paymentAmount,
    frequency,
    startDate
  );

  if (schedule.length === 0) {
    return startDate;
  }

  return new Date(schedule[schedule.length - 1].date);
}

/**
 * Calculate remaining term in months
 */
export function calculateRemainingTermMonths(
  currentBalance: number,
  annualRate: number,
  paymentAmount: number,
  frequency: PaymentFrequency
): number {
  const schedule = generateAmortizationSchedule(
    currentBalance,
    annualRate,
    paymentAmount,
    frequency,
    new Date()
  );

  const paymentsPerYear = getPaymentsPerYear(frequency);
  return Math.round((schedule.length * 12) / paymentsPerYear);
}

/**
 * Calculate the total amount paid over the life of a loan
 */
export function calculateTotalPaid(schedule: AmortizationRow[]): number {
  return schedule.reduce((total, row) => total + row.payment, 0);
}

/**
 * Calculate effective annual rate (APR) considering payment frequency
 */
export function calculateEffectiveAnnualRate(
  nominalRate: number,
  frequency: PaymentFrequency
): number {
  const periodsPerYear = getPaymentsPerYear(frequency);
  const periodicRate = nominalRate / 100 / periodsPerYear;
  const ear = (Math.pow(1 + periodicRate, periodsPerYear) - 1) * 100;
  return Math.round(ear * 100) / 100;
}

/**
 * Validate if a payment amount is sufficient to pay off the loan
 */
export function isPaymentSufficient(
  principal: number,
  annualRate: number,
  paymentAmount: number,
  frequency: PaymentFrequency
): boolean {
  const paymentsPerYear = getPaymentsPerYear(frequency);
  const periodicRate = annualRate / 100 / paymentsPerYear;
  const minimumPayment = principal * periodicRate;

  return paymentAmount > minimumPayment;
}
