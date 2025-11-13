import api from "../../shared/lib/axios";
import type { ApiResponse } from "../../shared/lib/axios/types";
import type {
  LedgerCategory,
  LedgerOverviewParams,
  LedgerOverviewResponse,
  LedgerTransaction,
  LedgerTransactionFilters,
  LedgerTransactionListResponse,
  LedgerTransactionPayload,
} from "../../shared/types/LedgerType";

const responseBody = <T>(res: ApiResponse<T>): T => res?.data ?? ({} as T);

export type LedgerCategoryPayload = {
  name: string;
  description?: string | null;
  defaultFlowType: LedgerCategory["defaultFlowType"];
  color?: string | null;
  fields: LedgerCategory["fields"];
};

const LedgerService = {
  async fetchCategories() {
    const { data } = await api.get<ApiResponse<LedgerCategory[]>>("/ledger/categories");
    return responseBody(data);
  },

  async createCategory(payload: LedgerCategoryPayload) {
    const { data } = await api.post<ApiResponse<LedgerCategory>>("/ledger/categories", payload);
    return responseBody(data);
  },

  async updateCategory(id: number, payload: LedgerCategoryPayload) {
    const { data } = await api.put<ApiResponse<LedgerCategory>>(`/ledger/categories/${id}`, payload);
    return responseBody(data);
  },

  async deleteCategory(id: number) {
    await api.delete<ApiResponse<void>>(`/ledger/categories/${id}`);
  },

  async fetchTransactions(filters: LedgerTransactionFilters) {
    const params: Record<string, string | number | undefined | null> = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: filters.page,
      size: filters.size,
      sort: filters.sort,
      keyword: filters.keyword?.trim() || undefined,
      categoryId: filters.categoryId ?? undefined,
      flowType: filters.flowType && filters.flowType !== "ALL" ? filters.flowType : undefined,
    };
    const { data } = await api.get<ApiResponse<LedgerTransactionListResponse>>("/ledger/transactions", { params });
    return responseBody(data);
  },

  async createTransaction(payload: LedgerTransactionPayload) {
    const { data } = await api.post<ApiResponse<LedgerTransaction>>("/ledger/transactions", payload);
    return responseBody(data);
  },

  async updateTransaction(id: number, payload: LedgerTransactionPayload) {
    const { data } = await api.put<ApiResponse<LedgerTransaction>>(`/ledger/transactions/${id}`, payload);
    return responseBody(data);
  },

  async deleteTransaction(id: number) {
    await api.delete<ApiResponse<void>>(`/ledger/transactions/${id}`);
  },

  async fetchOverview(params: LedgerOverviewParams) {
    const { data } = await api.get<ApiResponse<LedgerOverviewResponse>>("/ledger/overview", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        categoryId: params.categoryId ?? undefined,
      },
    });
    return responseBody(data);
  },
};

export default LedgerService;
