import type { BankFormat } from "@/lib/types";

export const APP_NAME = "Barlow Finance";
export const APP_DESCRIPTION = "Household financial command center";

export const DEFAULT_CURRENCY = "DKK";
export const DEFAULT_LOCALE = "da";

export const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
export const INVITE_EXPIRY_HOURS = 24;
export const MAX_PENDING_INVITES = 5;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [".csv", "text/csv", "application/vnd.ms-excel"];

export const BANK_FORMATS: BankFormat[] = [
  {
    id: "sparekassen-kronjylland",
    name: "Sparekassen Kronjylland",
    delimiter: ";",
    encoding: "utf-8",
    dateColumn: "Dato",
    descriptionColumn: "Tekst",
    amountColumn: "Beløb",
    balanceColumn: "Saldo",
    dateFormat: "DD-MM-YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
  {
    id: "danske-bank",
    name: "Danske Bank",
    delimiter: ";",
    encoding: "utf-8",
    dateColumn: "Dato",
    descriptionColumn: "Tekst",
    amountColumn: "Beløb",
    balanceColumn: "Saldo",
    dateFormat: "DD.MM.YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
  {
    id: "nordea",
    name: "Nordea",
    delimiter: ";",
    encoding: "utf-8",
    dateColumn: "Bogført",
    descriptionColumn: "Tekst",
    amountColumn: "Beløb",
    balanceColumn: "Saldo",
    dateFormat: "DD-MM-YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
  {
    id: "jyske-bank",
    name: "Jyske Bank",
    delimiter: ";",
    encoding: "utf-8",
    dateColumn: "Dato",
    descriptionColumn: "Tekst",
    amountColumn: "Beløb",
    balanceColumn: "Saldo",
    dateFormat: "DD-MM-YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
];

export const CATEGORY_COLORS = [
  "#B45309", // amber-700
  "#166534", // green-800
  "#1E40AF", // blue-800
  "#7C2D12", // orange-900
  "#4338CA", // indigo-700
  "#0F766E", // teal-700
  "#BE185D", // pink-700
  "#4D7C0F", // lime-700
  "#6D28D9", // violet-700
  "#DC2626", // red-600
];

export const CATEGORY_ICONS = [
  "wallet",
  "home",
  "car",
  "shopping-cart",
  "utensils",
  "heart",
  "gift",
  "briefcase",
  "plane",
  "gamepad-2",
  "music",
  "book",
  "dumbbell",
  "baby",
  "dog",
  "wrench",
  "zap",
  "droplet",
  "wifi",
  "phone",
  "credit-card",
  "piggy-bank",
  "trending-up",
  "building-2",
  "scissors",
  "shirt",
  "glasses",
  "stethoscope",
  "pill",
  "coffee",
];

export const DEFAULT_CATEGORIES = [
  // Income
  { name: "Salary", name_da: "Løn", icon: "briefcase", color: "#166534", type: "income" },
  { name: "Side Income", name_da: "Biindtægt", icon: "trending-up", color: "#166534", type: "income" },
  { name: "Refunds", name_da: "Refunderinger", icon: "rotate-ccw", color: "#166534", type: "income" },
  { name: "Gifts Received", name_da: "Modtagne gaver", icon: "gift", color: "#166534", type: "income" },
  { name: "Investment Income", name_da: "Investeringsafkast", icon: "chart-line", color: "#166534", type: "income" },

  // Housing
  { name: "Rent/Mortgage", name_da: "Husleje/Boliglån", icon: "home", color: "#7C2D12", type: "expense" },
  { name: "Utilities", name_da: "Forsyninger", icon: "zap", color: "#7C2D12", type: "expense" },
  { name: "Home Insurance", name_da: "Husforsikring", icon: "shield", color: "#7C2D12", type: "expense" },
  { name: "Home Maintenance", name_da: "Boligvedligeholdelse", icon: "wrench", color: "#7C2D12", type: "expense" },

  // Food
  { name: "Groceries", name_da: "Dagligvarer", icon: "shopping-cart", color: "#B45309", type: "expense" },
  { name: "Takeaway", name_da: "Takeaway", icon: "package", color: "#B45309", type: "expense" },
  { name: "Restaurants", name_da: "Restauranter", icon: "utensils", color: "#B45309", type: "expense" },
  { name: "Coffee & Snacks", name_da: "Kaffe og snacks", icon: "coffee", color: "#B45309", type: "expense" },

  // Transport
  { name: "Fuel", name_da: "Brændstof", icon: "fuel", color: "#4338CA", type: "expense" },
  { name: "Public Transport", name_da: "Offentlig transport", icon: "train", color: "#4338CA", type: "expense" },
  { name: "Car Maintenance", name_da: "Bilvedligeholdelse", icon: "car", color: "#4338CA", type: "expense" },
  { name: "Parking", name_da: "Parkering", icon: "parking-circle", color: "#4338CA", type: "expense" },
  { name: "Car Insurance", name_da: "Bilforsikring", icon: "shield-check", color: "#4338CA", type: "expense" },

  // Shopping
  { name: "Clothing", name_da: "Tøj", icon: "shirt", color: "#BE185D", type: "expense" },
  { name: "Electronics", name_da: "Elektronik", icon: "smartphone", color: "#BE185D", type: "expense" },
  { name: "Home Goods", name_da: "Boligartikler", icon: "sofa", color: "#BE185D", type: "expense" },
  { name: "Gifts Given", name_da: "Gaver givet", icon: "gift", color: "#BE185D", type: "expense" },

  // Entertainment
  { name: "Streaming", name_da: "Streaming", icon: "tv", color: "#6D28D9", type: "expense" },
  { name: "Games", name_da: "Spil", icon: "gamepad-2", color: "#6D28D9", type: "expense" },
  { name: "Events & Activities", name_da: "Begivenheder og aktiviteter", icon: "ticket", color: "#6D28D9", type: "expense" },
  { name: "Hobbies", name_da: "Hobbyer", icon: "palette", color: "#6D28D9", type: "expense" },
  { name: "Subscriptions", name_da: "Abonnementer", icon: "repeat", color: "#6D28D9", type: "expense" },

  // Health
  { name: "Medical", name_da: "Læge", icon: "stethoscope", color: "#0F766E", type: "expense" },
  { name: "Pharmacy", name_da: "Apotek", icon: "pill", color: "#0F766E", type: "expense" },
  { name: "Fitness", name_da: "Fitness", icon: "dumbbell", color: "#0F766E", type: "expense" },

  // Family
  { name: "Childcare", name_da: "Børnepasning", icon: "baby", color: "#DC2626", type: "expense" },
  { name: "Education", name_da: "Uddannelse", icon: "graduation-cap", color: "#DC2626", type: "expense" },
  { name: "Kids Activities", name_da: "Børneaktiviteter", icon: "puzzle", color: "#DC2626", type: "expense" },
  { name: "Kids Clothing", name_da: "Børnetøj", icon: "shirt", color: "#DC2626", type: "expense" },

  // Financial
  { name: "Loan Payments", name_da: "Låneafdrag", icon: "credit-card", color: "#1E40AF", type: "expense" },
  { name: "Bank Fees", name_da: "Bankgebyrer", icon: "building-2", color: "#1E40AF", type: "expense" },
  { name: "Investments", name_da: "Investeringer", icon: "trending-up", color: "#1E40AF", type: "expense" },

  // Other
  { name: "Pets", name_da: "Kæledyr", icon: "dog", color: "#4D7C0F", type: "expense" },
  { name: "Personal Care", name_da: "Personlig pleje", icon: "scissors", color: "#4D7C0F", type: "expense" },
  { name: "Miscellaneous", name_da: "Diverse", icon: "more-horizontal", color: "#78716C", type: "expense" },
  { name: "Transfer", name_da: "Overførsel", icon: "arrow-left-right", color: "#1E40AF", type: "transfer" },
];

export const CERTAINTY_COLORS: Record<string, string> = {
  certain: "#166534",
  expected: "#1E40AF",
  predicted: "#A16207",
  planned: "#B45309",
  considering: "#78716C",
};

export const PROJECT_COLORS = [
  "#B45309",
  "#166534",
  "#1E40AF",
  "#6D28D9",
  "#DC2626",
  "#0F766E",
  "#BE185D",
  "#4D7C0F",
];

export const PROJECT_ICONS = [
  "home",
  "car",
  "plane",
  "gift",
  "heart",
  "star",
  "zap",
  "umbrella",
  "sun",
  "moon",
  "mountain",
  "palmtree",
  "camera",
  "music",
  "book",
  "graduation-cap",
  "baby",
  "dog",
  "bike",
  "tent",
];

export const FUEL_TYPES = [
  { value: "petrol", label: "Petrol", label_da: "Benzin" },
  { value: "diesel", label: "Diesel", label_da: "Diesel" },
  { value: "electric", label: "Electric", label_da: "Elektrisk" },
  { value: "hybrid", label: "Hybrid", label_da: "Hybrid" },
  { value: "pluginHybrid", label: "Plug-in Hybrid", label_da: "Plug-in hybrid" },
];

export const MAINTENANCE_TYPES = [
  { value: "oil", label: "Oil Change", label_da: "Olieskift" },
  { value: "tires", label: "Tires", label_da: "Dæk" },
  { value: "brakes", label: "Brakes", label_da: "Bremser" },
  { value: "service", label: "Regular Service", label_da: "Almindelig service" },
  { value: "repair", label: "Repair", label_da: "Reparation" },
  { value: "inspection", label: "Inspection", label_da: "Syn" },
  { value: "other", label: "Other", label_da: "Andet" },
];

export const PAYMENT_FREQUENCIES = [
  { value: "weekly", label: "Weekly", label_da: "Ugentlig" },
  { value: "biweekly", label: "Bi-weekly", label_da: "Hver anden uge" },
  { value: "monthly", label: "Monthly", label_da: "Månedlig" },
  { value: "quarterly", label: "Quarterly", label_da: "Kvartalsvis" },
  { value: "yearly", label: "Yearly", label_da: "Årlig" },
];

export const RECURRENCE_TYPES = [
  { value: "once", label: "One-time", label_da: "Engangs" },
  { value: "weekly", label: "Weekly", label_da: "Ugentlig" },
  { value: "biweekly", label: "Bi-weekly", label_da: "Hver anden uge" },
  { value: "monthly", label: "Monthly", label_da: "Månedlig" },
  { value: "quarterly", label: "Quarterly", label_da: "Kvartalsvis" },
  { value: "yearly", label: "Yearly", label_da: "Årlig" },
];

export const CERTAINTY_LEVELS = [
  { value: "certain", label: "Certain", label_da: "Sikker" },
  { value: "expected", label: "Expected", label_da: "Forventet" },
  { value: "predicted", label: "Predicted", label_da: "Forudsagt" },
  { value: "planned", label: "Planned", label_da: "Planlagt" },
  { value: "considering", label: "Considering", label_da: "Overvejer" },
];

export const BUDGET_PERIODS = [
  { value: "monthly", label: "Monthly", label_da: "Månedlig" },
  { value: "quarterly", label: "Quarterly", label_da: "Kvartalsvis" },
  { value: "yearly", label: "Yearly", label_da: "Årlig" },
];

export const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking", label_da: "Lønkonto" },
  { value: "savings", label: "Savings", label_da: "Opsparingskonto" },
  { value: "credit", label: "Credit Card", label_da: "Kreditkort" },
  { value: "investment", label: "Investment", label_da: "Investering" },
  { value: "loan", label: "Loan", label_da: "Lån" },
];

export const PROJECT_STATUSES = [
  { value: "active", label: "Active", label_da: "Aktiv" },
  { value: "paused", label: "Paused", label_da: "På pause" },
  { value: "completed", label: "Completed", label_da: "Fuldført" },
  { value: "cancelled", label: "Cancelled", label_da: "Annulleret" },
];

export const MATCH_TYPES = [
  { value: "contains", label: "Contains", label_da: "Indeholder" },
  { value: "startsWith", label: "Starts with", label_da: "Starter med" },
  { value: "endsWith", label: "Ends with", label_da: "Slutter med" },
  { value: "equals", label: "Equals", label_da: "Er lig med" },
  { value: "regex", label: "Regex", label_da: "Regex" },
];

export const MATCH_FIELDS = [
  { value: "description", label: "Description", label_da: "Beskrivelse" },
  { value: "merchant", label: "Merchant", label_da: "Forretning" },
];

// Alias for bank formats for use in import wizard
export const SUPPORTED_BANKS = BANK_FORMATS;
