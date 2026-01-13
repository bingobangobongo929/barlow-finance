import { BANK_FORMATS } from "@/lib/constants";
import { parseDanishDate, generateImportHash, parseAmount } from "@/lib/utils";
import type { BankFormat, CSVRow, TransactionType } from "@/lib/types";

export interface ParsedTransaction {
  transaction_date: string;
  description: string;
  amount: number;
  type: TransactionType;
  import_hash: string;
  balance?: number;
}

interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
  skippedRows: number;
}

/**
 * Detect the bank format from CSV content
 */
export function detectBankFormat(content: string): BankFormat | null {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    return null;
  }

  const headerLine = lines[0].toLowerCase();

  for (const format of BANK_FORMATS) {
    const delimiter = format.delimiter;
    const headers = headerLine.split(delimiter).map((h) => h.trim());

    // Check if the required columns exist
    const hasDate = headers.some(
      (h) =>
        h.includes("dato") || h.includes("bogført") || h.includes("date")
    );
    const hasAmount = headers.some(
      (h) => h.includes("beløb") || h.includes("amount")
    );
    const hasText = headers.some(
      (h) => h.includes("tekst") || h.includes("text") || h.includes("beskrivelse")
    );

    if (hasDate && hasAmount && hasText) {
      // Try to match specific bank format by header names
      if (headerLine.includes("bogført") && headerLine.includes("rentedato")) {
        return BANK_FORMATS.find((f) => f.id === "nordea") || format;
      }

      // Default to detecting by delimiter and structure
      const testRow = lines[1]?.split(delimiter);
      if (testRow) {
        // Check date format to identify bank
        const dateStr = testRow[0]?.trim();
        if (dateStr) {
          if (dateStr.includes(".")) {
            return BANK_FORMATS.find((f) => f.id === "danske-bank") || format;
          }
          if (dateStr.includes("-")) {
            return format;
          }
        }
      }

      return format;
    }
  }

  return null;
}

/**
 * Parse CSV content using the specified bank format
 */
export function parseCSV(
  content: string,
  format: BankFormat
): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  let skippedRows = 0;

  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length <= format.skipRows) {
    return { transactions, errors: ["File is empty or has no data rows"], skippedRows };
  }

  // Parse header line to find column indexes
  const headerLine = lines[format.skipRows];
  const headers = parseCSVLine(headerLine, format.delimiter);

  const columnIndexes = {
    date: findColumnIndex(headers, format.dateColumn),
    description: findColumnIndex(headers, format.descriptionColumn),
    amount: findColumnIndex(headers, format.amountColumn),
    balance: format.balanceColumn
      ? findColumnIndex(headers, format.balanceColumn)
      : -1,
  };

  if (columnIndexes.date === -1) {
    errors.push(`Could not find date column: ${format.dateColumn}`);
    return { transactions, errors, skippedRows };
  }

  if (columnIndexes.description === -1) {
    errors.push(`Could not find description column: ${format.descriptionColumn}`);
    return { transactions, errors, skippedRows };
  }

  if (columnIndexes.amount === -1) {
    errors.push(`Could not find amount column: ${format.amountColumn}`);
    return { transactions, errors, skippedRows };
  }

  // Parse data rows
  for (let i = format.skipRows + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    try {
      const values = parseCSVLine(line, format.delimiter);

      const dateStr = values[columnIndexes.date]?.trim();
      const description = values[columnIndexes.description]?.trim();
      const amountStr = values[columnIndexes.amount]?.trim();
      const balanceStr =
        columnIndexes.balance !== -1
          ? values[columnIndexes.balance]?.trim()
          : undefined;

      if (!dateStr || !description || !amountStr) {
        skippedRows++;
        continue;
      }

      // Parse date
      const date = parseDanishDate(dateStr);
      if (!date) {
        errors.push(`Row ${i + 1}: Invalid date format: ${dateStr}`);
        skippedRows++;
        continue;
      }

      // Parse amount (Danish format uses comma as decimal separator)
      const amount = parseAmount(amountStr, "da");
      if (isNaN(amount)) {
        errors.push(`Row ${i + 1}: Invalid amount format: ${amountStr}`);
        skippedRows++;
        continue;
      }

      // Parse balance if available
      const balance = balanceStr ? parseAmount(balanceStr, "da") : undefined;

      // Determine transaction type
      const type: TransactionType = amount >= 0 ? "income" : "expense";

      // Generate import hash for duplicate detection
      const importHash = generateImportHash(
        date.toISOString().split("T")[0],
        amount,
        description
      );

      transactions.push({
        transaction_date: date.toISOString().split("T")[0],
        description,
        amount: Math.abs(amount),
        type,
        import_hash: importHash,
        balance,
      });
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
      skippedRows++;
    }
  }

  return { transactions, errors, skippedRows };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Find the index of a column by name (case-insensitive)
 */
function findColumnIndex(headers: string[], columnName: string): number {
  const lowerColumnName = columnName.toLowerCase();
  return headers.findIndex(
    (h) =>
      h.toLowerCase().trim() === lowerColumnName ||
      h.toLowerCase().trim().includes(lowerColumnName)
  );
}

/**
 * Check for duplicate transactions based on import hash
 */
export function findDuplicates(
  newTransactions: ParsedTransaction[],
  existingHashes: Set<string>
): {
  unique: ParsedTransaction[];
  duplicates: ParsedTransaction[];
} {
  const unique: ParsedTransaction[] = [];
  const duplicates: ParsedTransaction[] = [];

  for (const transaction of newTransactions) {
    if (existingHashes.has(transaction.import_hash)) {
      duplicates.push(transaction);
    } else {
      unique.push(transaction);
    }
  }

  return { unique, duplicates };
}

/**
 * Validate CSV file content
 */
export function validateCSVFile(
  content: string,
  maxSizeBytes: number = 5 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: "File is empty" };
  }

  if (content.length > maxSizeBytes) {
    return { valid: false, error: "File is too large" };
  }

  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { valid: false, error: "File must have at least a header and one data row" };
  }

  return { valid: true };
}

/**
 * Convert file to string, handling different encodings
 */
export async function readFileAsText(file: File): Promise<string> {
  // Try UTF-8 first
  try {
    const textUtf8 = await file.text();
    // Check if it decoded properly (no replacement characters)
    if (!textUtf8.includes("\uFFFD")) {
      return textUtf8;
    }
  } catch {
    // Fall through to try ISO-8859-1
  }

  // Try ISO-8859-1 (Latin-1) for older Danish bank exports
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsText(file, "ISO-8859-1");
  });
}
