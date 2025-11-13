import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { AxiosError } from "axios";
import LedgerService, { type LedgerCategoryPayload } from "../../features/ledger/LedgerService";
import type { ApiResponse } from "../../shared/lib/axios/types";
import type {
  LedgerCategoryField,
  LedgerDailySummary,
  LedgerOverviewResponse,
  LedgerTransactionFilters,
  LedgerTransactionListResponse,
  LedgerTransactionPayload,
} from "../../shared/types/LedgerType";
import TransactionForm from "./TransactionForm";
import CategoryForm from "./CategoryForm";

const numberFormatter = new Intl.NumberFormat("ko-KR");
const formatCurrency = (value?: number | null) => `${numberFormatter.format(value ?? 0)}원`;

const today = new Date();
const defaultStart = format(startOfMonth(today), "yyyy-MM-dd");
const defaultEnd = format(endOfMonth(today), "yyyy-MM-dd");

const defaultFilters: LedgerTransactionFilters = {
  startDate: defaultStart,
  endDate: defaultEnd,
  categoryId: undefined,
  keyword: "",
  flowType: "ALL",
  page: 1,
  size: 10,
  sort: "DATE_DESC",
};

type LedgerTab = "overview" | "transactions" | "calendar" | "reports";

type StatusMessage = { type: "success" | "error"; message: string };

const Ledger = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(defaultFilters);
  const [activeTab, setActiveTab] = useState<LedgerTab>("overview");
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [calendarCursor, setCalendarCursor] = useState(startOfMonth(parseISO(defaultStart)));

  const [isTransactionForm, setIsTransactionForm] = useState<boolean>(false);
  const [isCategoryForm, setIsCategoryForm] = useState<boolean>(false);

  const categoriesQuery = useQuery({
    queryKey: ["ledger", "categories"],
    queryFn: LedgerService.fetchCategories,
  });
  const categories = categoriesQuery.data ?? [];

  const overviewQuery = useQuery({
    queryKey: ["ledger", "overview", filters.startDate, filters.endDate, filters.categoryId ?? "all"],
    queryFn: () =>
      LedgerService.fetchOverview({
        startDate: filters.startDate,
        endDate: filters.endDate,
        categoryId: filters.categoryId ?? undefined,
      }),
  });

  const transactionsQuery = useQuery({
    queryKey: [
      "ledger",
      "transactions",
      filters.startDate,
      filters.endDate,
      filters.categoryId ?? "all",
      filters.keyword ?? "",
      filters.flowType ?? "ALL",
      filters.page,
      filters.size,
      filters.sort,
    ],
    queryFn: () => LedgerService.fetchTransactions(filters),
  });

  const transactionMutation = useMutation({
    mutationFn: (payload: LedgerTransactionPayload) => LedgerService.createTransaction(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ledger"] });
      setStatus({ type: "success", message: "거래를 추가했습니다." });
    },
    onError: (error) => setStatus({ type: "error", message: resolveErrorMessage(error) }),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: number) => LedgerService.deleteTransaction(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ledger"] });
      setStatus({ type: "success", message: "거래를 삭제했습니다." });
    },
    onError: (error) => setStatus({ type: "error", message: resolveErrorMessage(error) }),
  });

  const categoryMutation = useMutation({
    mutationFn: (payload: LedgerCategoryPayload) => LedgerService.createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ledger", "categories"] });
      setStatus({ type: "success", message: "카테고리를 추가했습니다." });
    },
    onError: (error) => setStatus({ type: "error", message: resolveErrorMessage(error) }),
  });

  const setFilter = (patch: Partial<LedgerTransactionFilters>, resetPage = true) => {
    setFilters((prev) => ({
      ...prev,
      ...patch,
      page: resetPage ? 1 : patch.page ?? prev.page,
    }));
  };

  const overview = overviewQuery.data;
  const transactions = transactionsQuery.data;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">가계부</h1>
          <p className="mt-1 text-sm text-slate-500">기간을 지정하고 실시간 데이터로 수입/지출을 관리하세요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <label className="flex flex-col">
            <span>시작일</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilter({ startDate: e.target.value || defaultStart })}
              className="h-9 rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="flex flex-col">
            <span>종료일</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilter({ endDate: e.target.value || defaultEnd })}
              className="h-9 rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="flex flex-col">
            <span>카테고리</span>
            <select
              value={filters.categoryId ?? ""}
              onChange={(e) => setFilter({ categoryId: e.target.value ? Number(e.target.value) : undefined })}
              className="h-9 rounded-lg border border-slate-200 px-3"
            >
              <option value="">전체</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span>유형</span>
            <select
              value={filters.flowType ?? "ALL"}
              onChange={(e) => setFilter({ flowType: e.target.value as LedgerTransactionFilters["flowType"] })}
              className="h-9 rounded-lg border border-slate-200 px-3"
            >
              <option value="ALL">전체</option>
              <option value="INCOME">수입</option>
              <option value="EXPENSE">지출</option>
            </select>
          </label>
          <label className="flex flex-col">
            <span>검색</span>
            <input
              value={filters.keyword ?? ""}
              onChange={(e) => setFilter({ keyword: e.target.value })}
              placeholder="메모/지갑"
              className="h-9 rounded-lg border border-slate-200 px-3"
            />
          </label>
        </div>
      </header>

      {status && (
        <div
          className={
            "mb-4 rounded-2xl px-4 py-3 text-sm " +
            (status.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-rose-200 bg-rose-50 text-rose-700")
          }
        >
          <div className="flex items-center justify-between">
            <span>{status.message}</span>
            <button className="text-xs underline" onClick={() => setStatus(null)}>
              닫기
            </button>
          </div>
        </div>
      )}

      <nav className="mb-4 flex gap-2 text-sm">
        {(
          [
            { value: "overview", label: "개요" },
            { value: "transactions", label: "내역" },
            { value: "calendar", label: "캘린더" },
            { value: "reports", label: "리포트" },
          ] as { value: LedgerTab; label: string }[]
        ).map((tab) => {
          const selected = activeTab === tab.value;
          const className = selected
            ? "rounded-t-lg px-4 py-2 font-medium bg-white text-blue-600 shadow"
            : "rounded-t-lg px-4 py-2 font-medium text-slate-500 hover:bg-slate-100";
          return (
            <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)} className={className}>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "overview" && <OverviewSection data={overview} loading={overviewQuery.isLoading} />}
      {activeTab === "transactions" && (
        <TransactionsSection
          data={transactions}
          loading={transactionsQuery.isLoading}
          filters={filters}
          onChangePage={(page) => setFilter({ page }, false)}
          onDelete={(id) => deleteTransactionMutation.mutate(id)}
        />
      )}
      {activeTab === "calendar" && (
        <CalendarSection summaries={overview?.dailySummaries ?? []} cursor={calendarCursor} onCursorChange={setCalendarCursor} />
      )}
      {activeTab === "reports" && <ReportsSection overview={overview} />}

      <section className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setIsTransactionForm(true)}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
        >
          가계부 작성
        </button>

        <button
          type="button"
          onClick={() => setIsCategoryForm(true)}
          className="rounded-full border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
        >
          카테고리 작성
        </button>
      </section>

      {/* 모달 – 새 내역 추가 */}
      {isTransactionForm && (
        <LedgerModal onClose={() => setIsTransactionForm(false)}>
          <TransactionForm
            categories={categories}
            onSubmit={(payload) => transactionMutation.mutateAsync(payload)}
            saving={transactionMutation.isPending}
            defaultDate={filters.startDate}
          />
        </LedgerModal>
      )}

      {/* 모달 – 카테고리 생성 */}
      {isCategoryForm && (
        <LedgerModal onClose={() => setIsCategoryForm(false)}>
          <CategoryForm
            onSubmit={(payload) => categoryMutation.mutateAsync(payload)}
            saving={categoryMutation.isPending}
          />
        </LedgerModal>
      )}

    </div>
  );
};

const OverviewSection = ({ data, loading }: { data?: LedgerOverviewResponse; loading: boolean }) => {
  if (loading) {
    return <Placeholder message="개요 데이터를 불러오는 중입니다." />;
  }
  if (!data) {
    return <Placeholder message="표시할 개요 데이터가 없습니다." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SummaryCard title="기간 수입" value={formatCurrency(data.totalIncome)} tone="positive" subtitle="현금 · 급여 등" />
      <SummaryCard title="기간 지출" value={formatCurrency(data.totalExpense)} tone="negative" subtitle="생활비 및 투자" />
      <SummaryCard title="순 변화" value={formatCurrency(data.netChange)} tone={data.netChange >= 0 ? "positive" : "negative"} subtitle={data.netChange >= 0 ? "흑자" : "적자"} />
      <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
        <h3 className="text-base font-semibold text-slate-900">카테고리별 지출</h3>
        <div className="mt-4 space-y-2">
          {data.categoryBreakdown.length === 0 && <p className="text-sm text-slate-400">지출이 없습니다.</p>}
          {data.categoryBreakdown.map((item) => (
            <div key={item.categoryId}>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{item.categoryName}</span>
                <span>
                  {formatCurrency(item.totalAmount)} · {item.percentage}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-500" style={{ width: item.percentage + "%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">최근 거래</h3>
        <div className="mt-4 space-y-3 text-xs">
          {data.recentTransactions.length === 0 && <p className="text-slate-400">최근 거래가 없습니다.</p>}
          {data.recentTransactions.map((tx) => {
            const amountClass = tx.flowType === "INCOME" ? "text-[13px] font-semibold text-emerald-600" : "text-[13px] font-semibold text-rose-500";
            return (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{tx.category.name}</p>
                  <p className="max-w-[200px] truncate text-[11px] text-slate-500">{tx.memo || "-"}</p>
                </div>
                <div className="text-right">
                  <p className={amountClass}>
                    {tx.flowType === "INCOME" ? "+" : "-"}
                    {numberFormatter.format(tx.amount)}
                  </p>
                  <p className="text-[11px] text-slate-400">{tx.transactionDate}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

type TransactionsSectionProps = {
  data?: LedgerTransactionListResponse;
  loading: boolean;
  filters: LedgerTransactionFilters;
  onChangePage: (page: number) => void;
  onDelete: (id: number) => void;
};

const TransactionsSection = ({ data, loading, filters, onChangePage, onDelete }: TransactionsSectionProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        내역을 불러오는 중이에요...
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <Placeholder message="조건에 맞는 가계부 내역이 아직 없습니다." />;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / filters.size));
  const canPrev = filters.page > 1;
  const canNext = filters.page < totalPages;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard title="기간 총 수입" value={formatCurrency(data.totalIncome)} tone="positive" subtitle="조회 기간 내 총 유입" />
        <SummaryCard title="기간 총 지출" value={formatCurrency(data.totalExpense)} tone="negative" subtitle="조회 기간 내 총 유출" />
        <SummaryCard
          title="순 변동"
          value={formatCurrency((data.totalIncome ?? 0) - (data.totalExpense ?? 0))}
          tone={(data.totalIncome ?? 0) - (data.totalExpense ?? 0) >= 0 ? "positive" : "negative"}
          subtitle="총 수입 - 총 지출"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">날짜</th>
              <th className="px-3 py-2 font-medium">카테고리 / 메모</th>
              <th className="px-3 py-2 font-medium">지갑</th>
              <th className="px-3 py-2 font-medium text-right">금액</th>
              <th className="px-3 py-2 font-medium text-center">구분</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((tx) => {
              const amountClass =
                tx.flowType === "INCOME" ? "text-right font-semibold text-emerald-600" : "text-right font-semibold text-rose-600";
              return (
                <tr key={tx.id} className="border-t border-slate-100">
                  <td className="px-3 py-3 text-sm text-slate-600">{tx.transactionDate}</td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900">{tx.category.name}</p>
                    <p className="text-xs text-slate-500">{tx.memo || "-"}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600">{tx.wallet || "-"}</td>
                  <td className={`px-3 py-3 ${amountClass}`}>{`${tx.flowType === "INCOME" ? "+" : "-"}${formatCurrency(tx.amount)}`}</td>
                  <td className="px-3 py-3 text-center text-xs font-semibold text-slate-600">
                    {tx.flowType === "INCOME" ? "수입" : "지출"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs font-medium text-rose-600 hover:underline"
                      onClick={() => {
                        if (window.confirm("해당 내역을 삭제할까요?")) {
                          onDelete(tx.id);
                        }
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
        <p>
          총 {data.total.toLocaleString()}건 · 페이지 {filters.page}/{totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs"
            disabled={!canPrev}
            onClick={() => onChangePage(filters.page - 1)}
          >
            이전
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs"
            disabled={!canNext}
            onClick={() => onChangePage(filters.page + 1)}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

type CalendarSectionProps = {
  summaries: LedgerDailySummary[];
  cursor: Date;
  onCursorChange: (next: Date) => void;
};

const CalendarSection = ({ summaries, cursor, onCursorChange }: CalendarSectionProps) => {
  const summaryMap = useMemo(() => {
    const map: Record<string, LedgerDailySummary> = {};
    summaries.forEach((summary) => {
      map[summary.date] = summary;
    });
    return map;
  }, [summaries]);

  const days = useMemo(() => {
    const rangeStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const rangeEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  }, [cursor]);

  const monthLabel = format(cursor, "yyyy년 MM월");
  const todayKey = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">캘린더</p>
          <p className="text-xl font-semibold text-slate-900">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            onClick={() => onCursorChange(startOfMonth(subMonths(cursor, 1)))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            onClick={() => onCursorChange(startOfMonth(addMonths(cursor, 1)))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 text-sm">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const summary = summaryMap[key];
          const inCurrentMonth = day.getMonth() === cursor.getMonth();
          const income = summary?.income ?? 0;
          const expense = summary?.expense ?? 0;
          const net = income - expense;
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={`rounded-xl border p-2 text-xs shadow-sm ${inCurrentMonth ? "border-slate-100 bg-slate-50" : "border-transparent bg-slate-100/40 text-slate-400"
                } ${isToday ? "ring-2 ring-blue-400" : ""}`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span>{day.getDate()}</span>
                <span className={net >= 0 ? "text-emerald-600" : "text-rose-600"}>{net === 0 ? "" : net > 0 ? "▲" : "▼"}</span>
              </div>
              <div className="mt-1 space-y-0.5 text-[11px]">
                <p className="text-emerald-600">+{numberFormatter.format(income)}</p>
                <p className="text-rose-600">-{numberFormatter.format(expense)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReportsSection = ({ overview }: { overview?: LedgerOverviewResponse }) => {
  if (!overview) {
    return <Placeholder message="보고서를 만들 데이터가 아직 부족해요." />;
  }

  const leaders = overview.categoryBreakdown.slice(0, 4);
  const totalDays = overview.dailySummaries.length || 1;
  const sumIncome = overview.dailySummaries.reduce((acc, day) => acc + (day.income ?? 0), 0);
  const sumExpense = overview.dailySummaries.reduce((acc, day) => acc + (day.expense ?? 0), 0);
  const bestDay = overview.dailySummaries.reduce(
    (acc, summary) => {
      const net = (summary.income ?? 0) - (summary.expense ?? 0);
      if (!acc || net > acc.net) {
        return { net, summary };
      }
      return acc;
    },
    null as { net: number; summary: LedgerDailySummary } | null
  );
  const worstDay = overview.dailySummaries.reduce(
    (acc, summary) => {
      const net = (summary.income ?? 0) - (summary.expense ?? 0);
      if (!acc || net < acc.net) {
        return { net, summary };
      }
      return acc;
    },
    null as { net: number; summary: LedgerDailySummary } | null
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">주요 지출 카테고리</p>
        {leaders.length === 0 && <p className="text-xs text-slate-400">아직 지출 데이터가 없어요.</p>}
        {leaders.map((item) => (
          <div key={item.categoryId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
            <div>
              <p className="font-semibold text-slate-800">{item.categoryName}</p>
              <p className="text-xs text-slate-500">{item.percentage}%</p>
            </div>
            <p className="text-sm font-semibold text-rose-600">-{formatCurrency(item.totalAmount)}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">일간 통계</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">평균 수입</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(sumIncome / totalDays)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">평균 지출</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(sumExpense / totalDays)}</p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="text-xs text-slate-500">가장 많이 아낀 날</p>
          {bestDay ? (
            <p className="font-semibold text-emerald-600">
              {bestDay.summary.date} · +{formatCurrency(bestDay.net)}
            </p>
          ) : (
            <p className="text-xs text-slate-400">데이터가 부족합니다.</p>
          )}
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="text-xs text-slate-500">가장 많이 쓴 날</p>
          {worstDay ? (
            <p className="font-semibold text-rose-600">
              {worstDay.summary.date} · {formatCurrency(worstDay.net)}
            </p>
          ) : (
            <p className="text-xs text-slate-400">데이터가 부족합니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};


type SummaryCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  tone?: "positive" | "negative" | "neutral";
};

const SummaryCard = ({ title, value, subtitle, tone = "neutral" }: SummaryCardProps) => {
  const toneClass =
    tone === "positive"
      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
      : tone === "negative"
        ? "border-rose-100 bg-rose-50 text-rose-800"
        : "border-slate-100 bg-white text-slate-900";
  return (
    <div className={`rounded-2xl border ${toneClass} p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};

const Placeholder = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">{message}</div>
);

export const resolveErrorMessage = (error: unknown) => {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (isAxiosError<ApiResponse>(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && data.message) {
      return data.message;
    }
    return error.response?.statusText || "요청 처리 중 오류가 발생했습니다.";
  }
  return "요청 처리 중 문제가 발생했습니다. 다시 시도해 주세요.";
};

const isAxiosError = <T,>(error: unknown): error is AxiosError<T> =>
  Boolean(error) && typeof error === "object" && (error as AxiosError).isAxiosError === true;

export const convertMetadataValue = (field: LedgerCategoryField, rawValue: string) => {
  if (!rawValue) return undefined;
  switch (field.fieldType) {
    case "NUMBER":
      return Number.parseInt(rawValue, 10);
    case "DECIMAL":
      return Number(rawValue);
    default:
      return rawValue;
  }
};

export const renderMetadataInput = (
  field: LedgerCategoryField,
  value: string,
  onChange: (next: string) => void
) => {
  if (field.fieldType === "SELECT") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
      >
        <option value="">선택</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  const inputProps = {
    value,
    onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    className: "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none",
  };

  if (field.fieldType === "NUMBER") {
    return <input type="number" {...inputProps} />;
  }
  if (field.fieldType === "DECIMAL") {
    return <input type="number" step="0.01" {...inputProps} />;
  }
  if (field.fieldType === "DATE") {
    return <input type="date" {...inputProps} />;
  }
  return <input type="text" {...inputProps} />;
};

type LedgerModalProps = {
  children: ReactNode;
  onClose: () => void;
};

const LedgerModal = ({ children, onClose }: LedgerModalProps) => {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-slate-50 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()} // 안쪽 클릭 시 닫히지 않게
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 hover:bg-slate-200"
        >
          닫기
        </button>
        {children}
      </div>
    </div>
  );
};


export default Ledger;
