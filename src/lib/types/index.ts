export type TransactionType = "income" | "expense" | "transfer";

export type CertaintyLevel =
  | "certain"
  | "expected"
  | "predicted"
  | "planned"
  | "considering";

export type RecurrenceType =
  | "once"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type BudgetPeriod = "monthly" | "quarterly" | "yearly";

export type ProjectStatus = "active" | "paused" | "completed" | "cancelled";

export type ProjectPriority = "high" | "medium" | "low";

export type AccountType =
  | "checking"
  | "savings"
  | "credit"
  | "investment"
  | "loan";

export type FuelType =
  | "petrol"
  | "diesel"
  | "electric"
  | "hybrid"
  | "pluginHybrid";

export type MaintenanceType =
  | "oil"
  | "tires"
  | "brakes"
  | "service"
  | "repair"
  | "inspection"
  | "other";

export type InterestType = "fixed" | "variable";

export type PaymentFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type MatchType =
  | "contains"
  | "startsWith"
  | "endsWith"
  | "equals"
  | "regex";

export type MatchField = "description" | "merchant";

export type UserRole = "admin" | "member";

export type InsightType =
  | "spending_pattern"
  | "saving_opportunity"
  | "unusual_activity"
  | "budget_alert"
  | "milestone";

export interface Household {
  id: string;
  name: string;
  settings: HouseholdSettings;
  created_at: string;
  updated_at: string;
}

export interface HouseholdSettings {
  currency: string;
  dateFormat: string;
  firstDayOfWeek: number;
  fiscalYearStart: number;
}

export interface Profile {
  id: string;
  household_id: string | null;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  preferred_language: "en" | "da";
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  household_id: string;
  owner_id: string | null;
  name: string;
  bank_name: string;
  account_type: AccountType;
  account_number_masked: string;
  currency: string;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export interface Category {
  id: string;
  household_id: string | null;
  parent_id: string | null;
  name: string;
  name_da: string;
  icon: string;
  color: string;
  type: TransactionType | null;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  children?: Category[];
}

export interface Transaction {
  id: string;
  household_id: string;
  account_id: string;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  description: string;
  merchant: string | null;
  transaction_date: string;
  imported_at: string | null;
  is_recurring: boolean;
  is_manually_added: boolean;
  notes: string | null;
  tags: string[];
  import_hash: string | null;
  categorized_by: "manual" | "rule" | "ai" | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  account?: Account;
}

export interface CategorizationRule {
  id: string;
  household_id: string;
  category_id: string;
  field: MatchField;
  match_type: MatchType;
  match_value: string;
  case_sensitive: boolean;
  priority: number;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  household_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string | null;
  end_date: string | null;
  rollover: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  spent?: number;
}

export interface Loan {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  interest_type: InterestType;
  payment_amount: number;
  payment_frequency: PaymentFrequency;
  interest_payment_amount: number | null;
  interest_payment_frequency: PaymentFrequency | null;
  start_date: string;
  expected_end_date: string | null;
  linked_account_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  linked_account?: Account;
  payments?: LoanPayment[];
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  extra_payment: number;
  balance_after: number;
  linked_transaction_id: string | null;
  is_projected: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  priority: number;
  status: ProjectStatus;
  target_date: string | null;
  icon: string;
  color: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpcomingExpense {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  amount: number;
  amount_is_estimate: boolean;
  due_date: string;
  certainty: CertaintyLevel;
  recurrence: RecurrenceType;
  recurrence_interval: number | null;
  recurrence_end_date: string | null;
  category_id: string | null;
  linked_vehicle_id: string | null;
  linked_loan_id: string | null;
  notes: string | null;
  is_paid: boolean;
  paid_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  linked_vehicle?: Vehicle;
  linked_loan?: Loan;
}

export interface Vehicle {
  id: string;
  household_id: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  variant: string | null;
  license_plate: string;
  vin: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_mileage: number;
  mileage_unit: "km" | "mi";
  fuel_type: FuelType;
  linked_loan_id: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  insurance_annual_cost: number | null;
  insurance_renewal_date: string | null;
  next_inspection_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  linked_loan?: Loan;
  maintenance_records?: VehicleMaintenance[];
}

export interface VehicleMaintenance {
  id: string;
  vehicle_id: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  mileage_at_service: number | null;
  service_date: string;
  service_provider: string | null;
  next_due_mileage: number | null;
  next_due_date: string | null;
  linked_transaction_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface MonthlySummary {
  id: string;
  household_id: string;
  year: number;
  month: number;
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  savings_rate: number;
  category_breakdown: Record<string, number>;
  merchant_breakdown: Record<string, number>;
  by_account: Record<string, { income: number; expenses: number }>;
  by_person: Record<string, { income: number; expenses: number }>;
  transaction_count: number;
  created_at: string;
  updated_at: string;
}

export interface AIInsight {
  id: string;
  household_id: string;
  type: InsightType;
  title: string;
  content: string;
  data: Record<string, unknown>;
  is_read: boolean;
  is_dismissed: boolean;
  valid_until: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  household_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: Profile;
}

export interface InviteToken {
  id: string;
  household_id: string;
  token: string;
  email: string;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

// Form types
export interface TransactionFormData {
  transaction_date: string;
  description: string;
  merchant: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  account_id: string;
  notes: string;
  tags: string[];
  is_recurring: boolean;
}

export interface BudgetFormData {
  name: string;
  category_id: string | null;
  amount: number;
  period: BudgetPeriod;
  start_date: string | null;
  end_date: string | null;
  rollover: boolean;
}

export interface LoanFormData {
  name: string;
  description: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  interest_type: InterestType;
  payment_amount: number;
  payment_frequency: PaymentFrequency;
  start_date: string;
  linked_account_id: string | null;
}

export interface ProjectFormData {
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date: string | null;
  priority: number;
  status: ProjectStatus;
  icon: string;
  color: string;
}

export interface UpcomingExpenseFormData {
  name: string;
  description: string;
  amount: number;
  amount_is_estimate: boolean;
  due_date: string;
  certainty: CertaintyLevel;
  recurrence: RecurrenceType;
  recurrence_interval: number | null;
  recurrence_end_date: string | null;
  category_id: string | null;
  linked_vehicle_id: string | null;
  linked_loan_id: string | null;
}

export interface VehicleFormData {
  nickname: string;
  make: string;
  model: string;
  year: number;
  variant: string;
  license_plate: string;
  vin: string;
  purchase_date: string | null;
  purchase_price: number | null;
  current_mileage: number;
  fuel_type: FuelType;
  linked_loan_id: string | null;
  insurance_provider: string;
  insurance_policy_number: string;
  insurance_annual_cost: number | null;
  insurance_renewal_date: string | null;
  next_inspection_date: string | null;
}

export interface AccountFormData {
  name: string;
  bank_name: string;
  account_type: AccountType;
  account_number_masked: string;
  current_balance: number;
  owner_id: string | null;
}

export interface CategoryFormData {
  name: string;
  name_da: string;
  icon: string;
  color: string;
  type: TransactionType | null;
  parent_id: string | null;
}

export interface RuleFormData {
  category_id: string;
  field: MatchField;
  match_type: MatchType;
  match_value: string;
  case_sensitive: boolean;
  priority: number;
}

// CSV Import types
export interface CSVRow {
  date: string;
  description: string;
  amount: number;
  balance?: number;
}

export interface BankFormat {
  id: string;
  name: string;
  delimiter: string;
  encoding: string;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  balanceColumn?: string;
  dateFormat: string;
  decimalSeparator: string;
  skipRows: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  income: number;
  expenses: number;
  netFlow?: number;
}

export interface CategoryBreakdown {
  category: string;
  categoryId: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

// Loan calculation types
export interface AmortizationRow {
  paymentNumber: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  extraPayment: number;
  balance: number;
}

export interface PayoffSimulation {
  originalPayoffDate: string;
  newPayoffDate: string;
  originalTotalInterest: number;
  newTotalInterest: number;
  interestSaved: number;
  monthsSaved: number;
  schedule: AmortizationRow[];
}

// AI types
export interface AICategorization {
  transaction_id: string;
  suggested_category_id: string;
  confidence: number;
  reasoning: string;
}

export interface AIQueryResponse {
  answer: string;
  data?: Record<string, unknown>;
  sources?: string[];
}

export interface AIMaintenancePrediction {
  vehicle_id: string;
  predicted_service: string;
  estimated_date: string;
  estimated_cost: number;
  confidence: number;
  reasoning: string;
}

export interface AIScenarioResult {
  description: string;
  projectedSavings: number;
  projectedPayoffDate?: string;
  monthlyImpact: number;
  recommendations: string[];
}
