import { z } from "zod";

// Common schemas
export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email().max(255);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

export const dateSchema = z.string().refine(
  (val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  },
  { message: "Invalid date format" }
);

export const positiveNumberSchema = z.number().positive();

export const nonNegativeNumberSchema = z.number().nonnegative();

export const currencySchema = z
  .number()
  .multipleOf(0.01)
  .refine((val) => val >= -999999999.99 && val <= 999999999.99, {
    message: "Amount out of range",
  });

// Transaction schemas
export const transactionTypeSchema = z.enum(["income", "expense", "transfer"]);

export const transactionFormSchema = z.object({
  transaction_date: dateSchema,
  description: z.string().min(1).max(500),
  merchant: z.string().max(255).optional().nullable(),
  amount: currencySchema,
  type: transactionTypeSchema,
  category_id: uuidSchema.optional().nullable(),
  account_id: uuidSchema,
  notes: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  is_recurring: z.boolean().optional(),
});

export const transactionImportSchema = z.object({
  account_id: uuidSchema,
  bank_format: z.string().min(1).max(50),
  skip_duplicates: z.boolean().optional(),
});

// Budget schemas
export const budgetPeriodSchema = z.enum(["monthly", "quarterly", "yearly"]);

export const budgetFormSchema = z.object({
  name: z.string().min(1).max(100),
  category_id: uuidSchema.optional().nullable(),
  amount: currencySchema.positive(),
  period: budgetPeriodSchema,
  start_date: dateSchema.optional().nullable(),
  end_date: dateSchema.optional().nullable(),
  rollover: z.boolean().optional(),
});

// Loan schemas
export const interestTypeSchema = z.enum(["fixed", "variable"]);

export const paymentFrequencySchema = z.enum([
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const loanFormSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  original_amount: currencySchema.positive(),
  current_balance: currencySchema.nonnegative(),
  interest_rate: z.number().min(0).max(100),
  interest_type: interestTypeSchema,
  payment_amount: currencySchema.positive(),
  payment_frequency: paymentFrequencySchema,
  start_date: dateSchema,
  linked_account_id: uuidSchema.optional().nullable(),
});

export const loanSimulationSchema = z.object({
  loan_id: uuidSchema,
  extra_monthly_payment: currencySchema.nonnegative().optional(),
  one_time_payment: currencySchema.nonnegative().optional(),
  one_time_payment_date: dateSchema.optional(),
});

// Project schemas
export const projectStatusSchema = z.enum([
  "active",
  "paused",
  "completed",
  "cancelled",
]);

export const projectFormSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  target_amount: currencySchema.positive(),
  current_amount: currencySchema.nonnegative(),
  monthly_contribution: currencySchema.nonnegative(),
  target_date: dateSchema.optional().nullable(),
  priority: z.number().int().min(1).max(10),
  status: projectStatusSchema,
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

// Upcoming expense schemas
export const certaintyLevelSchema = z.enum([
  "certain",
  "expected",
  "predicted",
  "planned",
  "considering",
]);

export const recurrenceTypeSchema = z.enum([
  "once",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const upcomingExpenseFormSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  amount: currencySchema.positive(),
  amount_is_estimate: z.boolean().optional(),
  due_date: dateSchema,
  certainty: certaintyLevelSchema,
  recurrence: recurrenceTypeSchema,
  recurrence_interval: z.number().int().min(1).max(365).optional().nullable(),
  recurrence_end_date: dateSchema.optional().nullable(),
  category_id: uuidSchema.optional().nullable(),
  linked_vehicle_id: uuidSchema.optional().nullable(),
  linked_loan_id: uuidSchema.optional().nullable(),
});

// Vehicle schemas
export const fuelTypeSchema = z.enum([
  "petrol",
  "diesel",
  "electric",
  "hybrid",
  "pluginHybrid",
]);

export const vehicleFormSchema = z.object({
  nickname: z.string().min(1).max(50),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1900).max(2100),
  variant: z.string().max(50).optional().nullable(),
  license_plate: z.string().min(1).max(20),
  vin: z.string().max(17).optional().nullable(),
  purchase_date: dateSchema.optional().nullable(),
  purchase_price: currencySchema.nonnegative().optional().nullable(),
  current_mileage: z.number().int().nonnegative(),
  fuel_type: fuelTypeSchema,
  linked_loan_id: uuidSchema.optional().nullable(),
  insurance_provider: z.string().max(100).optional().nullable(),
  insurance_policy_number: z.string().max(50).optional().nullable(),
  insurance_annual_cost: currencySchema.nonnegative().optional().nullable(),
  insurance_renewal_date: dateSchema.optional().nullable(),
  next_inspection_date: dateSchema.optional().nullable(),
});

export const maintenanceTypeSchema = z.enum([
  "oil",
  "tires",
  "brakes",
  "service",
  "repair",
  "inspection",
  "other",
]);

export const maintenanceFormSchema = z.object({
  vehicle_id: uuidSchema,
  type: maintenanceTypeSchema,
  description: z.string().min(1).max(500),
  cost: currencySchema.nonnegative(),
  mileage_at_service: z.number().int().nonnegative().optional().nullable(),
  service_date: dateSchema,
  service_provider: z.string().max(100).optional().nullable(),
  next_due_mileage: z.number().int().positive().optional().nullable(),
  next_due_date: dateSchema.optional().nullable(),
});

// Account schemas
export const accountTypeSchema = z.enum([
  "checking",
  "savings",
  "credit",
  "investment",
  "loan",
]);

export const accountFormSchema = z.object({
  name: z.string().min(1).max(100),
  bank_name: z.string().min(1).max(100),
  account_type: accountTypeSchema,
  account_number_masked: z.string().min(4).max(4),
  current_balance: currencySchema,
  owner_id: uuidSchema.optional().nullable(),
});

// Category schemas
export const categoryFormSchema = z.object({
  name: z.string().min(1).max(50),
  name_da: z.string().min(1).max(50),
  icon: z.string().max(50),
  color: z.string().max(20),
  type: transactionTypeSchema.optional().nullable(),
  parent_id: uuidSchema.optional().nullable(),
});

// Rule schemas
export const matchTypeSchema = z.enum([
  "contains",
  "startsWith",
  "endsWith",
  "equals",
  "regex",
]);

export const matchFieldSchema = z.enum(["description", "merchant"]);

export const ruleFormSchema = z.object({
  category_id: uuidSchema,
  field: matchFieldSchema,
  match_type: matchTypeSchema,
  match_value: z.string().min(1).max(500),
  case_sensitive: z.boolean().optional(),
  priority: z.number().int().min(1).max(1000),
});

// Settings schemas
export const householdSettingsSchema = z.object({
  name: z.string().min(1).max(100),
});

export const profileSettingsSchema = z.object({
  display_name: z.string().min(1).max(100),
  preferred_language: z.enum(["en", "da"]),
});

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1),
    new_password: passwordSchema,
    confirm_password: z.string().min(1),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string().min(1),
    display_name: z.string().min(1).max(100),
    household_name: z.string().min(1).max(100),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const inviteSchema = z.object({
  email: emailSchema,
});

// AI schemas
export const aiCategorizeSchema = z.object({
  transaction_ids: z.array(uuidSchema).min(1).max(100),
});

export const aiQuerySchema = z.object({
  query: z.string().min(1).max(1000),
});

export const aiScenarioSchema = z.object({
  scenario_type: z.enum([
    "extra_loan_payment",
    "reduce_spending",
    "increase_income",
  ]),
  parameters: z.record(z.string(), z.unknown()),
});

// Filter schemas
export const transactionFilterSchema = z.object({
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  category_id: uuidSchema.optional(),
  account_id: uuidSchema.optional(),
  type: transactionTypeSchema.optional(),
  min_amount: currencySchema.optional(),
  max_amount: currencySchema.optional(),
  uncategorized_only: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().positive().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  sort_by: z.enum(["transaction_date", "amount", "description"]).optional(),
  sort_direction: z.enum(["asc", "desc"]).optional(),
});

// Utility function to validate and return typed data
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}
