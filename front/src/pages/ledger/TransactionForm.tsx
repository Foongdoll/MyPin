import { useEffect, useMemo, useState } from "react";
import type { LedgerCategory, LedgerFlowType, LedgerTransactionPayload } from "../../shared/types/LedgerType";
import { format } from "date-fns";
import { convertMetadataValue, renderMetadataInput, resolveErrorMessage } from "./Ledger";

type TransactionFormProps = {
    categories: LedgerCategory[];
    onSubmit: (payload: LedgerTransactionPayload) => Promise<unknown>;

    saving: boolean;
    defaultDate: string;
};

const TransactionForm = ({ categories, onSubmit, saving, defaultDate }: TransactionFormProps) => {
    const safeDate = defaultDate || format(new Date(), "yyyy-MM-dd");
    const [form, setForm] = useState({
        categoryId: "",
        flowType: "EXPENSE" as LedgerFlowType,
        transactionDate: safeDate,
        amount: "",
        memo: "",
        wallet: "",
    });
    const [metadataDraft, setMetadataDraft] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setForm((prev) => ({ ...prev, transactionDate: defaultDate || prev.transactionDate }));
    }, [defaultDate]);

    const selectedCategory = useMemo(
        () => categories.find((cat) => cat.id === Number(form.categoryId)),
        [categories, form.categoryId]
    );

    const handleChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleCategoryChange = (value: string) => {
        const target = categories.find((cat) => cat.id === Number(value));
        setMetadataDraft({});
        setForm((prev) => ({
            ...prev,
            categoryId: value,
            flowType: target?.defaultFlowType ?? prev.flowType,
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.categoryId) {
            setError("카테고리를 선택해 주세요.");
            return;
        }
        const amountValue = Number(form.amount);
        if (!Number.isFinite(amountValue) || amountValue <= 0) {
            setError("금액은 0보다 큰 숫자여야 합니다.");
            return;
        }

        const metadataPayload: Record<string, unknown> = {};
        if (selectedCategory) {
            for (const field of selectedCategory.fields) {
                const rawValue = metadataDraft[field.key];
                if (!rawValue) {
                    if (field.required) {
                        setError(`${field.label} 항목을 입력해 주세요.`);
                        return;
                    }
                    continue;
                }
                const converted = convertMetadataValue(field, rawValue);
                if (converted === undefined || Number.isNaN(converted)) {
                    setError(`${field.label} 값의 형식을 확인해 주세요.`);
                    return;
                }
                metadataPayload[field.key] = converted;
            }
        }

        const payload: LedgerTransactionPayload = {
            categoryId: Number(form.categoryId),
            flowType: form.flowType,
            transactionDate: form.transactionDate,
            amount: amountValue,
            memo: form.memo.trim() || undefined,
            wallet: form.wallet.trim() || undefined,
            metadata: metadataPayload,
        };

        try {
            await onSubmit(payload);
            setForm({
                categoryId: "",
                flowType: "EXPENSE",
                transactionDate: defaultDate || safeDate,
                amount: "",
                memo: "",
                wallet: "",
            });
            setMetadataDraft({});
            setError(null);
        } catch (submitError) {
            setError(resolveErrorMessage(submitError));
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">새 내역 추가</p>
            <p className="text-xs text-slate-500">수입/지출을 빠르게 기록하세요.</p>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-600">
                        카테고리
                        <select
                            value={form.categoryId}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                        >
                            <option value="">카테고리 선택</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                        거래일
                        <input
                            type="date"
                            value={form.transactionDate}
                            onChange={(e) => handleChange("transactionDate", e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                        />
                    </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-600">
                        금액
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) => handleChange("amount", e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                            placeholder="예: 50000"
                        />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                        지갑/계좌
                        <input
                            value={form.wallet}
                            onChange={(e) => handleChange("wallet", e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                            placeholder="예: 국민, 토스"
                        />
                    </label>
                </div>
                <label className="text-xs font-medium text-slate-600">
                    메모
                    <textarea
                        rows={2}
                        value={form.memo}
                        onChange={(e) => handleChange("memo", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                        placeholder="자세한 내용을 메모로 남겨 보세요."
                    />
                </label>
                <div>
                    <p className="text-xs font-medium text-slate-600">구분</p>
                    <div className="mt-1 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-500">
                        {["INCOME", "EXPENSE"].map((flow) => {
                            const isActive = form.flowType === flow;
                            return (
                                <button
                                    type="button"
                                    key={flow}
                                    onClick={() => handleChange("flowType", flow as LedgerFlowType)}
                                    className={`rounded-full px-4 py-1 ${isActive ? "bg-white text-slate-900 shadow-sm" : ""}`}
                                >
                                    {flow === "INCOME" ? "수입" : "지출"}
                                </button>
                            );
                        })}
                    </div>
                </div>
                {selectedCategory && selectedCategory.fields.length > 0 && (
                    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-600">추가 항목</p>
                        {selectedCategory.fields.map((field) => (
                            <label key={field.key} className="text-xs font-medium text-slate-600">
                                {field.label}
                                {field.required && <span className="ml-1 text-rose-500">*</span>}
                                {renderMetadataInput(field, metadataDraft[field.key] ?? "", (value) =>
                                    setMetadataDraft((prev) => ({ ...prev, [field.key]: value }))
                                )}
                            </label>
                        ))}
                    </div>
                )}
                {error && <p className="text-xs text-rose-600">{error}</p>}
                <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
                >
                    {saving ? "저장 중..." : "내역 저장"}
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;