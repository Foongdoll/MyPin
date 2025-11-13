export type LedgerFlowType = "INCOME" | "EXPENSE";

export type LedgerCategoryFieldType = "TEXT" | "NUMBER" | "DECIMAL" | "DATE" | "SELECT";

export type LedgerTransactionSort = "DATE_DESC" | "DATE_ASC" | "AMOUNT_DESC" | "AMOUNT_ASC";

export interface LedgerCategoryField {
  key: string;
  label: string;
  fieldType: LedgerCategoryFieldType;
  required: boolean;
  options?: string[];
}

export interface LedgerCategory {
  id: number;
  name: string;
  description?: string | null;
  defaultFlowType: LedgerFlowType;
  color?: string | null;
  fields: LedgerCategoryField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LedgerTransaction {
  id: number;
  flowType: LedgerFlowType;
  transactionDate: string;
  amount: number;
  memo?: string | null;
  wallet?: string | null;
  category: LedgerCategory;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface LedgerTransactionListResponse {
  items: LedgerTransaction[];
  total: number;
  totalIncome: number;
  totalExpense: number;
}

export interface LedgerCategoryBreakdown {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

export interface LedgerDailySummary {
  date: string;
  income: number;
  expense: number;
}

export interface LedgerOverviewResponse {
  totalIncome: number;
  totalExpense: number;
  netChange: number;
  categoryBreakdown: LedgerCategoryBreakdown[];
  dailySummaries: LedgerDailySummary[];
  recentTransactions: LedgerTransaction[];
}

export interface LedgerTransactionFilters {
  startDate: string;
  endDate: string;
  categoryId?: number | null;
  keyword?: string;
  flowType?: LedgerFlowType | "ALL";
  page: number;
  size: number;
  sort: LedgerTransactionSort;
}

export interface LedgerTransactionPayload {
  categoryId: number;
  flowType?: LedgerFlowType;
  transactionDate: string;
  amount: number;
  memo?: string;
  wallet?: string;
  metadata?: Record<string, unknown>;
}

export interface LedgerOverviewParams {
  startDate?: string;
  endDate?: string;
  categoryId?: number | null;
}
