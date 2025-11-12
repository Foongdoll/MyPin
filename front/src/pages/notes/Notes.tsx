import {
  ChevronDown,
  ChevronRight,
  Filter,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  SortAsc,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useNote from "../../features/note/useNote";
import type { CategoryNode, NoteSummary, CategoryCreatePayload } from "../../shared/types/NoteType";
import type { FlatCategory } from "../../features/note/utils";
import { useState } from "react";

const INDENT = 14;

const Notes = () => {
  const navigate = useNavigate();
  const {
    q,
    setQ,
    notes,
    sort,
    setSort,
    selectedCategory,
    selectCategory,
    categories,
    isCategoriesLoading,
    open,
    setOpen,
    page,
    setPage,
    totalPages,
    total,
    isNotesLoading,
    flatCategories,
    createCategory,
    isCreatingCategory,
  } = useNote();

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);

  const toggleNode = (id: number) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (nodes: CategoryNode[], depth = 1) =>
    nodes.map((node) => {
      const hasChildren = node.children?.length > 0;
      const isOpen = open[node.id] ?? node.depth <= 2;
      const isSelected = selectedCategory.path === node.path;
      return (
        <div key={node.id} className="mb-1" style={{ marginLeft: depth === 1 ? 0 : INDENT }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="inline-block w-6" />
            )}
            <button
              type="button"
              onClick={() => selectCategory(node)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-left text-sm ${
                isSelected ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {node.label}
            </button>
          </div>
          {hasChildren && isOpen && (
            <div className="ml-4 mt-1">{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });

  const handleCategorySubmit = async (payload: CategoryCreatePayload) => {
    await createCategory(payload);
    setCategoryModalOpen(false);
  };

  const notesEmpty = !isNotesLoading && notes.length === 0;

  return (
    <div className="w-full bg-slate-50">
      <div className="h-14 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur" />
      <div className="mx-auto flex w-full max-w-[80%] gap-6 px-4 py-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-16 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">카테고리</p>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" /> 추가
              </button>
            </div>
            {isCategoriesLoading ? (
              <p className="text-xs text-slate-400">카테고리를 불러오는 중...</p>
            ) : (
              <nav className="flex flex-col">
                <button
                  type="button"
                  onClick={() => selectCategory(null)}
                  className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                    !selectedCategory.path ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  전체 보기
                </button>
                {categories.map((group) => (
                  <div key={group.id}>{renderTree([group])}</div>
                ))}
              </nav>
            )}
          </div>
        </aside>

        <main className="flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">노트</h2>
                <span className="text-xs text-slate-400">{total.toLocaleString()}건</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
                  onClick={() => navigate("/note/detail?tab=form")}
                >
                  <Plus className="h-4 w-4" /> 새 노트
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="relative flex min-w-[260px] flex-1 items-center">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-10 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <Filter className="h-4 w-4" />
                  {selectedCategory.label ?? "전체"}
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  onClick={() => setSort(sort === "최신순" ? "오래된순" : "최신순")}
                >
                  <SortAsc className="h-4 w-4" />
                  {sort}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 min-h-[320px] rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
            {isNotesLoading ? (
              <div className="flex h-60 items-center justify-center text-sm text-slate-400">노트를 불러오는 중...</div>
            ) : notesEmpty ? (
              <div className="flex h-60 flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-medium text-slate-600">등록된 노트가 없습니다.</p>
                <p className="text-xs text-slate-400">새 노트를 작성해 지식을 정리해보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              이전
            </button>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              다음
            </button>
          </div>
        </main>
      </div>

      <CategoryModal
        open={isCategoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSubmit={handleCategorySubmit}
        categories={flatCategories}
        submitting={isCreatingCategory}
      />
    </div>
  );
};

const NoteCard = ({ note }: { note: NoteSummary }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <h3 className="line-clamp-1 text-[17px] font-bold text-slate-900">{note.title}</h3>
        <p className="mt-1 text-xs text-slate-400">
          {note.categoryTop} {note.categorySub ? `/ ${note.categorySub}` : ""}
        </p>
      </div>
      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
        {note.date ?? "미정"}
      </span>
    </div>
    <p className="mt-3 line-clamp-2 text-sm text-slate-500">{note.snippet}</p>
    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
      <span>작성자 {note.author ?? "-"}</span>
      <div className="flex items-center gap-2">
        <Link
          to={`/note/detail?tab=form&id=${note.id}`}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-slate-50"
        >
          <Pencil className="h-3.5 w-3.5" /> 수정
        </Link>
        <Link
          to={`/note/detail?tab=detail&id=${note.id}`}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-slate-50"
        >
          <NotebookPen className="h-3.5 w-3.5" /> 상세
        </Link>
      </div>
    </div>
  </article>
);

type CategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CategoryCreatePayload) => Promise<void>;
  categories: FlatCategory[];
  submitting: boolean;
};

const CategoryModal = ({ open, onClose, onSubmit, categories, submitting }: CategoryModalProps) => {
  const [form, setForm] = useState<{ label: string; code: string; parentId: string; sortOrder: string }>({
    label: "",
    code: "",
    parentId: "",
    sortOrder: "0",
  });
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setForm({ label: "", code: "", parentId: "", sortOrder: "0" });
    setError(null);
  };

  const handleClose = () => {
    if (!submitting) {
      reset();
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.label.trim() || !form.code.trim()) {
      setError("레이블과 코드를 모두 입력해주세요.");
      return;
    }
    setError(null);
    await onSubmit({
      label: form.label.trim(),
      code: form.code.trim(),
      parentId: form.parentId ? Number(form.parentId) : undefined,
      sortOrder: Number(form.sortOrder) || 0,
    });
    reset();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">카테고리 추가</h3>
        <p className="mt-1 text-xs text-slate-400">코드는 고유해야 하며 영문/숫자를 추천합니다.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">라벨</label>
            <input
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="예) React"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">코드</label>
            <input
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="예) react"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">부모 카테고리</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="">(루트)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {`${"─ ".repeat(cat.depth)}${cat.label}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">정렬 순서</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "저장 중..." : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Notes;
