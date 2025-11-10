import { useEffect, useMemo, useState } from "react";
import type { Folder, Note } from "../../shared/types/NoteType";
import { TreeNode } from "../../features/note/Tree";
import useNote from "../../features/note/useNote";
import NoteDetail from "./NoteDetail";
import NoteEditor from "./NoteEditor";
import { Plus } from "lucide-react";


const cx = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");
const Notes = () => {
  const {
    FOLDERS,
    NOTES,
    activeCategory,
    allTags,
    breadcrumb,
    filtered,
    folders,
    notes,
    page,
    pageData,
    pageSize,
    query,
    resetCategory,
    selectCategory,
    setActiveCategory,
    setPage,
    setQuery,
    setQueryAndReset,
    setSortAndReset,
    setSortKey,
    setTagFilter,
    setTagFilterAndReset,
    sortKey,
    start,
    tagFilter,
    afterSaved,
    closeDetail,
    detailId,
    editorOpen,
    openDetail,
    openEdit,
    closeEditor,
    editNote,
    totalPages } = useNote();



  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white/80 backdrop-blur">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-800">카테고리</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {FOLDERS.map((f) => (
            <div key={f.id} className="mb-1">
              <TreeNode
                node={f}
                activePath={activeCategory}
                onSelect={(path) => {                  
                  setActiveCategory(path);
                  setPage(1);
                }}
              />
            </div>
          ))}

          {/* 전체 보기 */}
          <button
            className={cx(
              "mt-3 w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100",
              activeCategory.length === 0 && "bg-blue-50 ring-1 ring-blue-200"
            )}
            onClick={() => {
              setActiveCategory([]);
              setPage(1);
            }}
          >
            전체 보기
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {/* 상단 바 */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/60 backdrop-blur px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* 모바일에서 사이드바 토글(디자인용) */}
              <button
                className="md:hidden rounded-lg border border-slate-200 px-3 py-2"
                title="카테고리 토글"
                onClick={() => {
                  // 실제 토글 로직은 레이아웃에 따라 다를 수 있어 디자인만 제공
                  alert("모바일 사이드바 토글(디자인용)");
                }}
              >
                카테고리
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">노트</h1>
            </div>

            <div className="hidden md:flex text-sm text-slate-500">
              {breadcrumb}
            </div>
          </div>
        </div>

        {/* 툴바: 검색/필터/정렬 */}
        <div className="px-4 pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="검색 (제목, 내용)"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              </div>

              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={tagFilter}
                onChange={(e) => {
                  setTagFilter(e.target.value);
                  setPage(1);
                }}
                title="태그 필터"
              >
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                title="정렬"
              >
                <option value="recent">최신순</option>
                <option value="title">제목순</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 active:scale-[0.99]"
                onClick={() => alert("새 노트 만들기(디자인용)")}
              >
                새 노트
              </button>
            </div>
          </div>
        </div>

        <section className="px-4 pb-4 pt-4">
          {pageData.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
              <p className="text-slate-500">조건에 맞는 노트가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pageData.map((n) => (
                <article key={n.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{n.title}</h3>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                      {n.date}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{n.excerpt}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">{n.categoryPath.join(" / ")}</div>
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50" onClick={() => openDetail(n.id)}>
                        열기
                      </button>
                      <button className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50" onClick={() => openEdit({ id: n.id, title: n.title, content: "", categoryId: "", tags: [] })}>
                        수정
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* 페이징 */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
            <div className="flex items-center gap-1">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-sm">
                {page}
              </span>
              <span className="text-sm text-slate-500">/ {totalPages}</span>
            </div>
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </button>
          </div>
        </section>

        {/* 모달들 */}
        {detailId && (
          <NoteDetail
            noteId={detailId}
            onClose={closeDetail}
            onEdit={(note) => { closeDetail(); openEdit(note); }}
          />
        )}

        <NoteEditor
          open={editorOpen}
          onClose={closeEditor}
          initial={editNote ?? undefined}
          onSaved={afterSaved}
        />

      </main>
    </div>
  );
};

export default Notes;