# Barlow Farmhouse Finance - Development Guidelines

## NO SHORTCUTS POLICY
- Never write TODO comments
- Never create placeholder code
- Implement every feature completely
- Write all translations for both languages
- Include all error handling and loading states

## SECURITY FIRST
This is a FINANCE APP. Security is mandatory:
- RLS on every table
- Input validation on every endpoint
- Secure headers configured
- No sensitive data in logs
- Rate limiting on API routes
- Audit logging for sensitive actions

## Project Overview
Household finance management for a Danish family (Ed and wife). Full transparency between spouses. DKK currency only. Bilingual: English and Danish with toggle.

## Tech Stack
- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS 4
- Supabase (Auth + PostgreSQL)
- next-intl (i18n)
- Lucide React (icons ONLY)
- Recharts (charts)
- Claude API (AI features)
- date-fns (dates)
- Zod (validation)
- React Hook Form (forms)
- Vercel (deployment)

## Design System: "Modern Farmhouse"

### Colors (CSS Variables)
```css
:root {
  --bg-primary: #FAFAF8;
  --bg-secondary: #F5F4F0;
  --bg-tertiary: #ECEAE3;
  --bg-card: #FFFFFF;
  --bg-hover: #F0EEE8;
  --text-primary: #1C1917;
  --text-secondary: #57534E;
  --text-tertiary: #A8A29E;
  --border-default: #E7E5E0;
  --border-strong: #D6D3CD;
  --accent-primary: #B45309;
  --accent-primary-hover: #92400E;
  --accent-secondary: #166534;
  --accent-secondary-hover: #14532D;
  --accent-danger: #B91C1C;
  --accent-danger-hover: #991B1B;
  --accent-info: #1E40AF;
  --accent-warning: #A16207;
  --income: #166534;
  --expense: #B91C1C;
  --transfer: #1E40AF;
  --chart-1: #B45309;
  --chart-2: #166534;
  --chart-3: #1E40AF;
  --chart-4: #7C2D12;
  --chart-5: #4338CA;
  --chart-6: #0F766E;
  --chart-7: #BE185D;
  --chart-8: #4D7C0F;
}

.dark {
  --bg-primary: #0C0A09;
  --bg-secondary: #1C1917;
  --bg-tertiary: #292524;
  --bg-card: #1C1917;
  --bg-hover: #292524;
  --text-primary: #FAFAF9;
  --text-secondary: #A8A29E;
  --text-tertiary: #78716C;
  --border-default: #292524;
  --border-strong: #44403C;
  --accent-primary: #D97706;
  --accent-primary-hover: #F59E0B;
  --accent-secondary: #22C55E;
  --accent-secondary-hover: #4ADE80;
  --accent-danger: #EF4444;
  --accent-danger-hover: #F87171;
  --accent-info: #3B82F6;
  --accent-warning: #EAB308;
  --income: #22C55E;
  --expense: #EF4444;
  --transfer: #3B82F6;
}
```

### Typography
- Headings: "Fraunces" (Google Fonts) - serif, elegant
- Body: "DM Sans" (Google Fonts) - clean, readable
- Numbers/Money: "DM Mono" - monospace for alignment

### Layout
- Sidebar: 280px, collapsible to 72px
- Max content: 1440px centered
- Must scale fluidly at ANY window size
- Use CSS clamp() for fluid sizing
- Minimum: 1024px width

### Icons
- ONLY Lucide React
- 16px inline, 20px buttons, 24px navigation
- Stroke width 1.5

### Components
- Cards: bg-card border-default rounded-xl shadow-sm p-6
- Primary buttons: bg-accent-primary text-white rounded-lg
- Secondary buttons: border-default bg-transparent rounded-lg
- Inputs: bg-secondary border-default rounded-lg focus:ring-accent-primary

## File Structure

```
barlow-finance/
├── messages/
│   ├── en.json
│   └── da.json
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── invite/[token]/page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── transactions/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── import/page.tsx
│   │   │       │   └── categorize/page.tsx
│   │   │       ├── budgets/page.tsx
│   │   │       ├── analytics/page.tsx
│   │   │       ├── loans/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── projects/page.tsx
│   │   │       ├── calendar/page.tsx
│   │   │       ├── vehicles/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── upcoming/page.tsx
│   │   │       └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── auth/callback/route.ts
│   │   │   ├── transactions/
│   │   │   │   ├── route.ts
│   │   │   │   └── import/route.ts
│   │   │   └── ai/
│   │   │       ├── categorize/route.ts
│   │   │       ├── insights/route.ts
│   │   │       ├── query/route.ts
│   │   │       ├── maintenance/route.ts
│   │   │       └── scenario/route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── charts/
│   │   ├── features/
│   │   └── providers/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── ai/
│   │   ├── csv/
│   │   ├── calculations/
│   │   ├── utils/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── constants/
│   │   └── security/
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── request.ts
│   │   └── navigation.ts
│   └── middleware.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── public/
├── .env.local.example
├── CLAUDE.md
├── README.md
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Database Schema

### households
id UUID PK, name TEXT, settings JSONB, created_at, updated_at

### profiles
id UUID PK FK(auth.users), household_id FK, email, display_name, avatar_url, role, preferred_language TEXT DEFAULT 'en', created_at, updated_at

### accounts
id UUID PK, household_id FK, owner_id FK(profiles), name, bank_name, account_type, account_number_masked TEXT, currency DEFAULT 'DKK', current_balance DECIMAL, is_active, created_at, updated_at

### categories
id UUID PK, household_id FK, parent_id FK(self), name TEXT, name_da TEXT, icon, color, type, is_system, sort_order, created_at

### transactions
id UUID PK, household_id FK, account_id FK, category_id FK, amount DECIMAL, type, description, merchant, transaction_date DATE, imported_at, is_recurring, is_manually_added, notes, tags TEXT[], import_hash, categorized_by, created_at, updated_at

INDEXES: (household_id, transaction_date DESC), (household_id, category_id), (import_hash)

### categorization_rules
id UUID PK, household_id FK, category_id FK, field, match_type, match_value, case_sensitive, priority, is_active, created_at

### budgets
id UUID PK, household_id FK, category_id FK, name, amount DECIMAL, period, start_date, end_date, rollover BOOLEAN, is_active, created_at, updated_at

### loans
id UUID PK, household_id FK, name, description, original_amount DECIMAL, current_balance DECIMAL, interest_rate DECIMAL, interest_type, payment_amount DECIMAL, payment_frequency, interest_payment_amount DECIMAL, interest_payment_frequency, start_date, expected_end_date, linked_account_id FK, notes, is_active, created_at, updated_at

### loan_payments
id UUID PK, loan_id FK, payment_date, principal_amount DECIMAL, interest_amount DECIMAL, extra_payment DECIMAL, balance_after DECIMAL, linked_transaction_id FK, is_projected BOOLEAN, created_at

### projects
id UUID PK, household_id FK, name, description, target_amount DECIMAL, current_amount DECIMAL, monthly_contribution DECIMAL, priority INT, status, target_date, icon, color, notes, created_at, updated_at

### upcoming_expenses
id UUID PK, household_id FK, name, description, amount DECIMAL, amount_is_estimate BOOLEAN, due_date DATE, certainty, recurrence, recurrence_interval INT, recurrence_end_date, category_id FK, linked_vehicle_id FK, linked_loan_id FK, notes, is_paid BOOLEAN, paid_transaction_id FK, paid_at, created_at, updated_at

INDEX: (household_id, due_date) WHERE NOT is_paid

### vehicles
id UUID PK, household_id FK, nickname, make, model, year INT, variant, license_plate, vin, purchase_date, purchase_price DECIMAL, current_mileage INT, mileage_unit DEFAULT 'km', fuel_type, linked_loan_id FK, insurance_provider, insurance_policy_number, insurance_annual_cost DECIMAL, insurance_renewal_date, next_inspection_date, notes, is_active, created_at, updated_at

### vehicle_maintenance
id UUID PK, vehicle_id FK, type, description, cost DECIMAL, mileage_at_service INT, service_date DATE, service_provider, next_due_mileage INT, next_due_date DATE, linked_transaction_id FK, notes, created_at

### monthly_summaries
id UUID PK, household_id FK, year INT, month INT, total_income DECIMAL, total_expenses DECIMAL, net_cash_flow DECIMAL, savings_rate DECIMAL, category_breakdown JSONB, merchant_breakdown JSONB, by_account JSONB, by_person JSONB, transaction_count INT, created_at, updated_at
UNIQUE(household_id, year, month)

### ai_insights
id UUID PK, household_id FK, type, title, content, data JSONB, is_read BOOLEAN, is_dismissed BOOLEAN, valid_until, created_at

### audit_logs
id UUID PK, household_id FK, user_id FK(profiles), action TEXT, entity_type TEXT, entity_id UUID, old_value JSONB, new_value JSONB, ip_address INET, user_agent TEXT, created_at

INDEX: (household_id, created_at DESC)

### invite_tokens
id UUID PK, household_id FK, token TEXT UNIQUE, email TEXT, created_by FK(profiles), expires_at TIMESTAMPTZ, used_at TIMESTAMPTZ, created_at

INDEX: (token) WHERE used_at IS NULL

### ROW LEVEL SECURITY
Enable on EVERY table. Users can only access their household's data. Test thoroughly.

## API Security Patterns

### Every API route MUST:
```typescript
// 1. Verify authentication
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 2. Verify household membership
const { data: profile } = await supabase
  .from('profiles')
  .select('household_id')
  .eq('id', user.id)
  .single();

if (!profile?.household_id) {
  return NextResponse.json({ error: 'No household' }, { status: 403 });
}

// 3. Validate input with Zod
const validation = schema.safeParse(body);
if (!validation.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}

// 4. Rate limit check
const rateLimitResult = await checkRateLimit(user.id, 'endpoint-name');
if (!rateLimitResult.allowed) {
  return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
}

// 5. Perform operation with household_id filter
// 6. Log sensitive actions to audit_logs
// 7. Return sanitized response
```

## Formatting Standards
- Currency: Danish format (1.234,56 kr.)
- Dates: DD-MM-YYYY or locale-aware
- Numbers: Danish separators (comma decimal, period thousand)
- Account numbers: Always masked (****1234)

## Component Type Usage (CRITICAL)

These component prop patterns are established and MUST be followed:

### Modal Component
```tsx
// CORRECT - use isOpen
<Modal isOpen={showModal} onClose={() => setShowModal(false)}>

// WRONG - 'open' doesn't exist
<Modal open={showModal}>
```

### Button Component
```tsx
// Valid variants: "default", "secondary", "ghost", "danger", "success", "link"
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>

// WRONG - these variants don't exist
<Button variant="primary">   // Use "default" instead
<Button variant="outline">   // Use "secondary" instead

// Button does NOT support asChild - use styled Link instead:
<Link
  href="/path"
  className="inline-flex items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
>
  Link Text
</Link>
```

### Type Imports for Form Data
When using enum types in state, use inline imports:
```tsx
// CORRECT
const [formData, setFormData] = useState({
  fuel_type: "petrol" as import("@/lib/types").FuelType,
  type: "oil" as import("@/lib/types").MaintenanceType,
  recurrence: "once" as import("@/lib/types").RecurrenceType,
});

// For interface props
interface FormProps {
  formData: {
    type: import('@/lib/types').MaintenanceType;
    // ...
  };
}
```

### Database Field Mappings
- Vehicle: `nickname` (not `name`)
- Vehicle Maintenance: `type` (not `maintenance_type`), `service_date` (not `scheduled_date`)
- Upcoming Expense: `recurrence` (not `is_recurring`/`recurring_frequency`)
- Category: `name` (not `name_en`)

### Zod Validation
```tsx
// CORRECT - z.record requires two arguments
z.record(z.string(), z.unknown())

// WRONG
z.record(z.unknown())
```

### useRef with NodeJS.Timeout
```tsx
// CORRECT - must initialize with null
const timeoutRef = useRef<NodeJS.Timeout | null>(null);

// WRONG
const timeoutRef = useRef<NodeJS.Timeout>();
```

## Remember
- Check CLAUDE.md before EVERY file
- NO TODO comments
- NO placeholder code
- Complete implementation only
- Both EN and DA translations
- Security on every endpoint
- Audit sensitive actions
- Mask sensitive display data
- Test compilation frequently
