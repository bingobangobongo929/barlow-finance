-- Barlow Farmhouse Finance - Initial Database Schema
-- Version: 1.0.0
-- Date: 2026-01-13

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HOUSEHOLDS TABLE
-- ============================================================================
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{
    "currency": "DKK",
    "dateFormat": "dd-MM-yyyy",
    "firstDayOfWeek": 1,
    "fiscalYearStart": 1
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'da')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_household ON profiles(household_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit', 'investment', 'loan')),
  account_number_masked TEXT NOT NULL,
  currency TEXT DEFAULT 'DKK',
  current_balance DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_household ON accounts(household_id);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_da TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'circle',
  color TEXT NOT NULL DEFAULT '#78716C',
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
  is_system BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_household ON categories(household_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_type ON categories(type);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  description TEXT NOT NULL,
  merchant TEXT,
  transaction_date DATE NOT NULL,
  imported_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  is_manually_added BOOLEAN DEFAULT false,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  import_hash TEXT,
  categorized_by TEXT CHECK (categorized_by IN ('manual', 'rule', 'ai')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_household_date ON transactions(household_id, transaction_date DESC);
CREATE INDEX idx_transactions_household_category ON transactions(household_id, category_id);
CREATE INDEX idx_transactions_import_hash ON transactions(import_hash);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ============================================================================
-- CATEGORIZATION RULES TABLE
-- ============================================================================
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  field TEXT NOT NULL CHECK (field IN ('description', 'merchant')),
  match_type TEXT NOT NULL CHECK (match_type IN ('contains', 'startsWith', 'endsWith', 'equals', 'regex')),
  match_value TEXT NOT NULL,
  case_sensitive BOOLEAN DEFAULT false,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rules_household ON categorization_rules(household_id);
CREATE INDEX idx_rules_active ON categorization_rules(household_id, is_active) WHERE is_active = true;

-- ============================================================================
-- BUDGETS TABLE
-- ============================================================================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
  start_date DATE,
  end_date DATE,
  rollover BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budgets_household ON budgets(household_id);
CREATE INDEX idx_budgets_active ON budgets(household_id, is_active) WHERE is_active = true;

-- ============================================================================
-- LOANS TABLE
-- ============================================================================
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  original_amount DECIMAL(15, 2) NOT NULL,
  current_balance DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 3) NOT NULL,
  interest_type TEXT NOT NULL CHECK (interest_type IN ('fixed', 'variable')),
  payment_amount DECIMAL(15, 2) NOT NULL,
  payment_frequency TEXT NOT NULL CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  interest_payment_amount DECIMAL(15, 2),
  interest_payment_frequency TEXT CHECK (interest_payment_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  expected_end_date DATE,
  linked_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loans_household ON loans(household_id);
CREATE INDEX idx_loans_active ON loans(household_id, is_active) WHERE is_active = true;

-- ============================================================================
-- LOAN PAYMENTS TABLE
-- ============================================================================
CREATE TABLE loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  principal_amount DECIMAL(15, 2) NOT NULL,
  interest_amount DECIMAL(15, 2) NOT NULL,
  extra_payment DECIMAL(15, 2) DEFAULT 0,
  balance_after DECIMAL(15, 2) NOT NULL,
  linked_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  is_projected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id, payment_date DESC);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) DEFAULT 0,
  monthly_contribution DECIMAL(15, 2) DEFAULT 0,
  priority INT DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  target_date DATE,
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT '#B45309',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_household ON projects(household_id);
CREATE INDEX idx_projects_status ON projects(household_id, status);

-- ============================================================================
-- UPCOMING EXPENSES TABLE
-- ============================================================================
CREATE TABLE upcoming_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  amount_is_estimate BOOLEAN DEFAULT false,
  due_date DATE NOT NULL,
  certainty TEXT NOT NULL CHECK (certainty IN ('certain', 'expected', 'predicted', 'planned', 'considering')),
  recurrence TEXT NOT NULL DEFAULT 'once' CHECK (recurrence IN ('once', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  recurrence_interval INT,
  recurrence_end_date DATE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  linked_vehicle_id UUID,
  linked_loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  notes TEXT,
  is_paid BOOLEAN DEFAULT false,
  paid_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upcoming_household_date ON upcoming_expenses(household_id, due_date) WHERE NOT is_paid;
CREATE INDEX idx_upcoming_unpaid ON upcoming_expenses(household_id, is_paid) WHERE NOT is_paid;

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  variant TEXT,
  license_plate TEXT NOT NULL,
  vin TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(15, 2),
  current_mileage INT DEFAULT 0,
  mileage_unit TEXT DEFAULT 'km' CHECK (mileage_unit IN ('km', 'mi')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'pluginHybrid')),
  linked_loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_annual_cost DECIMAL(15, 2),
  insurance_renewal_date DATE,
  next_inspection_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_household ON vehicles(household_id);

-- Add foreign key for upcoming_expenses.linked_vehicle_id after vehicles table exists
ALTER TABLE upcoming_expenses ADD CONSTRAINT fk_upcoming_vehicle
  FOREIGN KEY (linked_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

-- ============================================================================
-- VEHICLE MAINTENANCE TABLE
-- ============================================================================
CREATE TABLE vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('oil', 'tires', 'brakes', 'service', 'repair', 'inspection', 'other')),
  description TEXT NOT NULL,
  cost DECIMAL(15, 2) NOT NULL,
  mileage_at_service INT,
  service_date DATE NOT NULL,
  service_provider TEXT,
  next_due_mileage INT,
  next_due_date DATE,
  linked_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_vehicle ON vehicle_maintenance(vehicle_id, service_date DESC);

-- ============================================================================
-- MONTHLY SUMMARIES TABLE
-- ============================================================================
CREATE TABLE monthly_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  total_income DECIMAL(15, 2) DEFAULT 0,
  total_expenses DECIMAL(15, 2) DEFAULT 0,
  net_cash_flow DECIMAL(15, 2) DEFAULT 0,
  savings_rate DECIMAL(5, 2) DEFAULT 0,
  category_breakdown JSONB DEFAULT '{}',
  merchant_breakdown JSONB DEFAULT '{}',
  by_account JSONB DEFAULT '{}',
  by_person JSONB DEFAULT '{}',
  transaction_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, year, month)
);

CREATE INDEX idx_summaries_household_period ON monthly_summaries(household_id, year DESC, month DESC);

-- ============================================================================
-- AI INSIGHTS TABLE
-- ============================================================================
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('spending_pattern', 'saving_opportunity', 'unusual_activity', 'budget_alert', 'milestone')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_household ON ai_insights(household_id, created_at DESC);
CREATE INDEX idx_insights_active ON ai_insights(household_id, is_dismissed) WHERE NOT is_dismissed;

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_household ON audit_logs(household_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ============================================================================
-- INVITE TOKENS TABLE
-- ============================================================================
CREATE TABLE invite_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invites_token ON invite_tokens(token) WHERE used_at IS NULL;
CREATE INDEX idx_invites_household ON invite_tokens(household_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upcoming_expenses_updated_at BEFORE UPDATE ON upcoming_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_summaries_updated_at BEFORE UPDATE ON monthly_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's household_id
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID AS $$
  SELECT household_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- HOUSEHOLDS POLICIES
CREATE POLICY "Users can view their household" ON households
  FOR SELECT USING (id = get_user_household_id());

CREATE POLICY "Users can update their household" ON households
  FOR UPDATE USING (id = get_user_household_id());

CREATE POLICY "Users can insert households" ON households
  FOR INSERT WITH CHECK (true);

-- PROFILES POLICIES
CREATE POLICY "Users can view profiles in their household" ON profiles
  FOR SELECT USING (household_id = get_user_household_id() OR id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ACCOUNTS POLICIES
CREATE POLICY "Users can view accounts in their household" ON accounts
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can insert accounts in their household" ON accounts
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update accounts in their household" ON accounts
  FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Users can delete accounts in their household" ON accounts
  FOR DELETE USING (household_id = get_user_household_id());

-- CATEGORIES POLICIES (includes system categories with null household_id)
CREATE POLICY "Users can view categories" ON categories
  FOR SELECT USING (household_id IS NULL OR household_id = get_user_household_id());

CREATE POLICY "Users can insert categories in their household" ON categories
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update their categories" ON categories
  FOR UPDATE USING (household_id = get_user_household_id() AND NOT is_system);

CREATE POLICY "Users can delete their categories" ON categories
  FOR DELETE USING (household_id = get_user_household_id() AND NOT is_system);

-- TRANSACTIONS POLICIES
CREATE POLICY "Users can view transactions in their household" ON transactions
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can insert transactions in their household" ON transactions
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update transactions in their household" ON transactions
  FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Users can delete transactions in their household" ON transactions
  FOR DELETE USING (household_id = get_user_household_id());

-- CATEGORIZATION_RULES POLICIES
CREATE POLICY "Users can view rules in their household" ON categorization_rules
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can insert rules in their household" ON categorization_rules
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update rules in their household" ON categorization_rules
  FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Users can delete rules in their household" ON categorization_rules
  FOR DELETE USING (household_id = get_user_household_id());

-- BUDGETS POLICIES
CREATE POLICY "Users can view budgets in their household" ON budgets
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can insert budgets in their household" ON budgets
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update budgets in their household" ON budgets
  FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Users can delete budgets in their household" ON budgets
  FOR DELETE USING (household_id = get_user_household_id());

-- LOANS POLICIES
CREATE POLICY "Users can view loans in their household" ON loans
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can insert loans in their household" ON loans
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update loans in their household" ON loans
  FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Users can delete loans in their household" ON loans
  FOR DELETE USING (household_id = get_user_household_id());

-- LOAN_PAYMENTS POLICIES
CREATE POLICY "Users can view loan payments for their loans" ON loan_payments
  FOR SELECT USING (loan_id IN (SELECT id FROM loans WHERE household_id = get_user_household_id()));

CREATE POLICY "Users can insert loan payments for their loans" ON loan_payments
  FOR INSERT WITH CHECK (loan_id IN (SELECT id FROM loans WHERE household_id = get_user_household_id()));

CREATE POLICY "Users can update loan payments for their loans" ON loan_payments
  FOR UPDATE USING (loan_id IN (SELECT id FROM loans WHERE household_id = get_user_household_id()));

CREATE POLICY "Users can delete loan payments for their loans" ON loan_payments
  FOR DELETE USING (loan_id IN (SELECT id FROM loans WHERE household_id = get_user_household_id()));

-- PROJECTS POLICIES
CREATE POLICY "Users can view projects in their household" ON projects
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can insert projects in their household" ON projects
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update projects in their household" ON projects
  FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Users can delete projects in their household" ON projects
  FOR DELETE USING (household_id = get_user_household_id());

-- UPCOMING_EXPENSES POLICIES
CREATE POLICY "Users can view upcoming expenses in their household" ON upcoming_expenses
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can insert upcoming expenses in their household" ON upcoming_expenses
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update upcoming expenses in their household" ON upcoming_expenses
  FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Users can delete upcoming expenses in their household" ON upcoming_expenses
  FOR DELETE USING (household_id = get_user_household_id());

-- VEHICLES POLICIES
CREATE POLICY "Users can view vehicles in their household" ON vehicles
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can insert vehicles in their household" ON vehicles
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update vehicles in their household" ON vehicles
  FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Users can delete vehicles in their household" ON vehicles
  FOR DELETE USING (household_id = get_user_household_id());

-- VEHICLE_MAINTENANCE POLICIES
CREATE POLICY "Users can view maintenance for their vehicles" ON vehicle_maintenance
  FOR SELECT USING (vehicle_id IN (SELECT id FROM vehicles WHERE household_id = get_user_household_id()));

CREATE POLICY "Users can insert maintenance for their vehicles" ON vehicle_maintenance
  FOR INSERT WITH CHECK (vehicle_id IN (SELECT id FROM vehicles WHERE household_id = get_user_household_id()));

CREATE POLICY "Users can update maintenance for their vehicles" ON vehicle_maintenance
  FOR UPDATE USING (vehicle_id IN (SELECT id FROM vehicles WHERE household_id = get_user_household_id()));

CREATE POLICY "Users can delete maintenance for their vehicles" ON vehicle_maintenance
  FOR DELETE USING (vehicle_id IN (SELECT id FROM vehicles WHERE household_id = get_user_household_id()));

-- MONTHLY_SUMMARIES POLICIES
CREATE POLICY "Users can view summaries in their household" ON monthly_summaries
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can insert summaries in their household" ON monthly_summaries
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update summaries in their household" ON monthly_summaries
  FOR UPDATE USING (household_id = get_user_household_id());

-- AI_INSIGHTS POLICIES
CREATE POLICY "Users can view insights in their household" ON ai_insights
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can update insights in their household" ON ai_insights
  FOR UPDATE USING (household_id = get_user_household_id());

-- AUDIT_LOGS POLICIES
CREATE POLICY "Users can view audit logs in their household" ON audit_logs
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- INVITE_TOKENS POLICIES
CREATE POLICY "Users can view invites for their household" ON invite_tokens
  FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can insert invites for their household" ON invite_tokens
  FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update invites for their household" ON invite_tokens
  FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Anyone can view valid invite tokens by token" ON invite_tokens
  FOR SELECT USING (used_at IS NULL AND expires_at > NOW());

-- ============================================================================
-- DEFAULT SYSTEM CATEGORIES (inserted without household_id)
-- ============================================================================
INSERT INTO categories (household_id, name, name_da, icon, color, type, is_system, sort_order) VALUES
-- Income categories
(NULL, 'Salary', 'Løn', 'briefcase', '#166534', 'income', true, 1),
(NULL, 'Side Income', 'Biindtægt', 'trending-up', '#166534', 'income', true, 2),
(NULL, 'Refunds', 'Refunderinger', 'rotate-ccw', '#166534', 'income', true, 3),
(NULL, 'Gifts Received', 'Modtagne gaver', 'gift', '#166534', 'income', true, 4),
(NULL, 'Investment Income', 'Investeringsafkast', 'chart-line', '#166534', 'income', true, 5),

-- Housing expenses
(NULL, 'Rent/Mortgage', 'Husleje/Boliglån', 'home', '#7C2D12', 'expense', true, 10),
(NULL, 'Utilities', 'Forsyninger', 'zap', '#7C2D12', 'expense', true, 11),
(NULL, 'Home Insurance', 'Husforsikring', 'shield', '#7C2D12', 'expense', true, 12),
(NULL, 'Home Maintenance', 'Boligvedligeholdelse', 'wrench', '#7C2D12', 'expense', true, 13),

-- Food expenses
(NULL, 'Groceries', 'Dagligvarer', 'shopping-cart', '#B45309', 'expense', true, 20),
(NULL, 'Takeaway', 'Takeaway', 'package', '#B45309', 'expense', true, 21),
(NULL, 'Restaurants', 'Restauranter', 'utensils', '#B45309', 'expense', true, 22),
(NULL, 'Coffee & Snacks', 'Kaffe og snacks', 'coffee', '#B45309', 'expense', true, 23),

-- Transport expenses
(NULL, 'Fuel', 'Brændstof', 'fuel', '#4338CA', 'expense', true, 30),
(NULL, 'Public Transport', 'Offentlig transport', 'train', '#4338CA', 'expense', true, 31),
(NULL, 'Car Maintenance', 'Bilvedligeholdelse', 'car', '#4338CA', 'expense', true, 32),
(NULL, 'Parking', 'Parkering', 'parking-circle', '#4338CA', 'expense', true, 33),
(NULL, 'Car Insurance', 'Bilforsikring', 'shield-check', '#4338CA', 'expense', true, 34),

-- Shopping expenses
(NULL, 'Clothing', 'Tøj', 'shirt', '#BE185D', 'expense', true, 40),
(NULL, 'Electronics', 'Elektronik', 'smartphone', '#BE185D', 'expense', true, 41),
(NULL, 'Home Goods', 'Boligartikler', 'sofa', '#BE185D', 'expense', true, 42),
(NULL, 'Gifts Given', 'Gaver givet', 'gift', '#BE185D', 'expense', true, 43),

-- Entertainment expenses
(NULL, 'Streaming', 'Streaming', 'tv', '#6D28D9', 'expense', true, 50),
(NULL, 'Games', 'Spil', 'gamepad-2', '#6D28D9', 'expense', true, 51),
(NULL, 'Events & Activities', 'Begivenheder og aktiviteter', 'ticket', '#6D28D9', 'expense', true, 52),
(NULL, 'Hobbies', 'Hobbyer', 'palette', '#6D28D9', 'expense', true, 53),
(NULL, 'Subscriptions', 'Abonnementer', 'repeat', '#6D28D9', 'expense', true, 54),

-- Health expenses
(NULL, 'Medical', 'Læge', 'stethoscope', '#0F766E', 'expense', true, 60),
(NULL, 'Pharmacy', 'Apotek', 'pill', '#0F766E', 'expense', true, 61),
(NULL, 'Fitness', 'Fitness', 'dumbbell', '#0F766E', 'expense', true, 62),

-- Family expenses
(NULL, 'Childcare', 'Børnepasning', 'baby', '#DC2626', 'expense', true, 70),
(NULL, 'Education', 'Uddannelse', 'graduation-cap', '#DC2626', 'expense', true, 71),
(NULL, 'Kids Activities', 'Børneaktiviteter', 'puzzle', '#DC2626', 'expense', true, 72),
(NULL, 'Kids Clothing', 'Børnetøj', 'shirt', '#DC2626', 'expense', true, 73),

-- Financial expenses
(NULL, 'Loan Payments', 'Låneafdrag', 'credit-card', '#1E40AF', 'expense', true, 80),
(NULL, 'Bank Fees', 'Bankgebyrer', 'building-2', '#1E40AF', 'expense', true, 81),
(NULL, 'Investments', 'Investeringer', 'trending-up', '#1E40AF', 'expense', true, 82),

-- Other expenses
(NULL, 'Pets', 'Kæledyr', 'dog', '#4D7C0F', 'expense', true, 90),
(NULL, 'Personal Care', 'Personlig pleje', 'scissors', '#4D7C0F', 'expense', true, 91),
(NULL, 'Miscellaneous', 'Diverse', 'more-horizontal', '#78716C', 'expense', true, 99),

-- Transfer
(NULL, 'Transfer', 'Overførsel', 'arrow-left-right', '#1E40AF', 'transfer', true, 100);
