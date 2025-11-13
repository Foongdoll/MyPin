import { useState } from "react";
import type { LedgerCategoryPayload } from "../../features/ledger/LedgerService";
import type { LedgerCategoryField, LedgerFlowType } from "../../shared/types/LedgerType";
import { resolveErrorMessage } from "./Ledger";
import { Plus } from "lucide-react";

type CategoryFieldDraft = {
    localId: string;
    key: string;
    label: string;
    fieldType: LedgerCategoryField["fieldType"];
    required: boolean;
    options: string;
};

type CategoryFormProps = {
    onSubmit: (payload: LedgerCategoryPayload) => Promise<unknown>;
    saving: boolean;
};

const CategoryForm = ({ onSubmit, saving }: CategoryFormProps) => {
    const [form, setForm] = useState({ name: "", description: "", defaultFlowType: "EXPENSE" as LedgerFlowType, color: "#2563eb" });
    const [fields, setFields] = useState<CategoryFieldDraft[]>([]);
    const [error, setError] = useState<string | null>(null);

    const createDraft = (): CategoryFieldDraft => ({
        localId: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        key: "",
        label: "",
        fieldType: "TEXT",
        required: false,
        options: "",
    });

    const handleFieldChange = (localId: string, patch: Partial<CategoryFieldDraft>) => {
        setFields((prev) => prev.map((field) => (field.localId === localId ? { ...field, ...patch } : field)));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.name.trim()) {
            setError("카테고리 이름을 입력해 주세요.");
            return;
        }

        const preparedFields: LedgerCategoryField[] = [];
        const keySet = new Set<string>();

        for (const field of fields) {
            if (!field.key.trim() || !field.label.trim()) {
                setError("필드의 키와 라벨을 모두 입력해 주세요.");
                return;
            }
            if (keySet.has(field.key.trim())) {
                setError("필드 키는 중복될 수 없습니다.");
                return;
            }
            keySet.add(field.key.trim());

            const options =
                field.fieldType === "SELECT"
                    ? field.options
                        .split(",")
                        .map((opt) => opt.trim())
                        .filter(Boolean)
                    : [];

            if (field.fieldType === "SELECT" && options.length === 0) {
                setError(`선택형 필드(${field.label})에는 옵션을 입력해 주세요.`);
                return;
            }

            preparedFields.push({
                key: field.key.trim(),
                label: field.label.trim(),
                fieldType: field.fieldType,
                required: field.required,
                options,
            });
        }

        const payload: LedgerCategoryPayload = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            defaultFlowType: form.defaultFlowType,
            color: form.color,
            fields: preparedFields,
        };

        try {
            await onSubmit(payload);
            setForm({ name: "", description: "", defaultFlowType: "EXPENSE", color: "#2563eb" });
            setFields([]);
            setError(null);
        } catch (submitError) {
            setError(resolveErrorMessage(submitError));
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">카테고리 만들기</p>
            <p className="text-xs text-slate-500">필요한 항목을 추가해서 맞춤형 카테고리를 구성하세요.</p>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-600">
                        이름
                        <input
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                            placeholder="예: 식비, 주식"
                        />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                        대표 색상 / 기본 유형
                        <div className="mt-1 flex items-center gap-2">
                            <input
                                type="color"
                                value={form.color}
                                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                                className="h-9 w-14 cursor-pointer rounded border border-slate-200 bg-white"
                            />
                            <select
                                value={form.defaultFlowType}
                                onChange={(e) => setForm((prev) => ({ ...prev, defaultFlowType: e.target.value as LedgerFlowType }))}
                                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                            >
                                <option value="EXPENSE">지출 카테고리</option>
                                <option value="INCOME">수입 카테고리</option>
                            </select>
                        </div>
                    </label>
                </div>
                <label className="text-xs font-medium text-slate-600">
                    설명
                    <textarea
                        rows={2}
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                        placeholder="카테고리에 대한 설명을 남겨 보세요."
                    />
                </label>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>추가 필드</span>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                            onClick={() => setFields((prev) => [...prev, createDraft()])}
                        >
                            <Plus className="h-3 w-3" />
                            필드 추가
                        </button>
                    </div>
                    {fields.length === 0 && <p className="text-xs text-slate-400">필수 정보가 있다면 필드를 추가하세요.</p>}
                    {fields.map((field) => (
                        <div key={field.localId} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                            <div className="flex items-center gap-2">
                                <input
                                    value={field.key}
                                    onChange={(e) => handleFieldChange(field.localId, { key: e.target.value })}
                                    placeholder="키 (예: ticker)"
                                    className="flex-1 rounded-lg border border-slate-200 px-2 py-1 focus:border-slate-400 focus:outline-none"
                                />
                                <input
                                    value={field.label}
                                    onChange={(e) => handleFieldChange(field.localId, { label: e.target.value })}
                                    placeholder="라벨 (예: 종목 코드)"
                                    className="flex-1 rounded-lg border border-slate-200 px-2 py-1 focus:border-slate-400 focus:outline-none"
                                />
                            </div>
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                                <select
                                    value={field.fieldType}
                                    onChange={(e) => handleFieldChange(field.localId, { fieldType: e.target.value as LedgerCategoryField["fieldType"] })}
                                    className="rounded-lg border border-slate-200 px-2 py-1 focus:border-slate-400 focus:outline-none"
                                >
                                    <option value="TEXT">텍스트</option>
                                    <option value="NUMBER">정수</option>
                                    <option value="DECIMAL">소수</option>
                                    <option value="DATE">날짜</option>
                                    <option value="SELECT">선택형</option>
                                </select>
                                <label className="flex items-center gap-1 text-xs text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => handleFieldChange(field.localId, { required: e.target.checked })}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    필수 입력
                                </label>
                            </div>
                            {field.fieldType === "SELECT" && (
                                <input
                                    value={field.options}
                                    onChange={(e) => handleFieldChange(field.localId, { options: e.target.value })}
                                    placeholder="옵션을 콤마로 구분해 입력 (예: 매수,매도)"
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 focus:border-slate-400 focus:outline-none"
                                />
                            )}
                            <div className="mt-2 text-right">
                                <button
                                    type="button"
                                    className="text-xs text-rose-500 hover:underline"
                                    onClick={() => setFields((prev) => prev.filter((item) => item.localId !== field.localId))}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {error && <p className="text-xs text-rose-600">{error}</p>}
                <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center rounded-full border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50"
                >
                    {saving ? "생성 중..." : "카테고리 생성"}
                </button>
            </form>
        </div>
    );
};

export default CategoryForm;