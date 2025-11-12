import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, ChevronLeft, Eye, Image as ImageIcon, Layers, Pencil, Plus, Save, Tag, Upload } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NoteService from "../../features/note/NoteService";
import type { NoteDetail as NoteDetailType, NoteSectionBlock } from "../../shared/types/NoteType";
import { flattenCategories } from "../../features/note/utils";
import { useSessionStore } from "../../state/session.store";

type SectionForm = NoteSectionBlock & { localId: string };
type NoteFormState = {
  title: string;
  snippet: string;
  content: string;
  coverImageUrl?: string;
  author: string;
  date?: string;
  categoryId?: number | null;
  tags: string[];
  sections: SectionForm[];
};

const emptyState = (author: string) => ({
  title: "",
  snippet: "",
  content: "",
  coverImageUrl: "",
  author,
  date: new Date().toISOString().slice(0, 10),
  categoryId: undefined,
  tags: [],
  sections: [],
});

const NotesFormAndDetailPreview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"form" | "detail">(
    (searchParams.get("tab") as "form" | "detail") ?? "form"
  );
  const noteId = searchParams.get("id");
  const queryClient = useQueryClient();
  const sessionUser = useSessionStore((state) => state.user);

  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setTab((searchParams.get("tab") as "form" | "detail") ?? "form");
  }, [searchParams]);

  const noteQuery = useQuery({
    queryKey: ["note", "detail", noteId],
    queryFn: () => NoteService.fetchNote(noteId!),
    enabled: Boolean(noteId),
  });

  const categoriesQuery = useQuery({
    queryKey: ["note", "categories"],
    queryFn: NoteService.fetchCategories,
    staleTime: 1000 * 60 * 5,
  });
  const flatCategories = useMemo(() => flattenCategories(categoriesQuery.data ?? []), [categoriesQuery.data]);

  const [formState, setFormState] = useState<NoteFormState>(() => emptyState(sessionUser?.name ?? ""));
  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    if (noteQuery.data) {
      const note = noteQuery.data;
      setFormState({
        title: note.title ?? "",
        snippet: note.snippet ?? "",
        content: note.content ?? "",
        coverImageUrl: note.coverImageUrl ?? "",
        author: note.author ?? sessionUser?.name ?? "",
        date: note.date ?? undefined,
        categoryId: note.categoryId ?? undefined,
        tags: note.tags ?? [],
        sections: (note.sections ?? []).map((section, index) => ({
          ...section,
          description: section.description ?? "",
          sortOrder: section.sortOrder ?? index,
          localId: crypto.randomUUID(),
        })),
      });
    } else {
      setFormState(emptyState(sessionUser?.name ?? ""));
    }
  }, [noteQuery.data, sessionUser?.name]);

  const updateForm = <K extends keyof NoteFormState>(key: K, value: NoteFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddSection = () => {
    setFormState((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { localId: crypto.randomUUID(), title: "", description: "", imageUrl: "", sortOrder: prev.sections.length },
      ],
    }));
  };

  const updateSection = (localId: string, patch: Partial<SectionForm>) => {
    setFormState((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.localId === localId ? { ...section, ...patch } : section)),
    }));
  };

  const removeSection = (localId: string) => {
    setFormState((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.localId !== localId),
    }));
  };

  const moveSection = (localId: string, direction: "up" | "down") => {
    setFormState((prev) => {
      const index = prev.sections.findIndex((section) => section.localId === localId);
      if (index < 0) return prev;
      const newSections = [...prev.sections];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSections.length) return prev;
      const temp = newSections[index];
      newSections[index] = newSections[targetIndex];
      newSections[targetIndex] = temp;
      return { ...prev, sections: newSections };
    });
  };

  const addTag = () => {
    const next = tagDraft.trim();
    if (!next || formState.tags.includes(next)) return;
    setFormState((prev) => ({ ...prev, tags: [...prev.tags, next] }));
    setTagDraft("");
  };

  const removeTag = (tag: string) => {
    setFormState((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleTabChange = (next: "form" | "detail") => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    if (noteId) params.set("id", noteId);
    setSearchParams(params, { replace: true });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formState.title.trim()) {
        throw new Error("제목을 입력해주세요.");
      }
      if (!formState.categoryId) {
        throw new Error("카테고리를 선택해주세요.");
      }
      const payload = {
        title: formState.title.trim(),
        snippet: formState.snippet?.trim() ?? "",
        content: formState.content ?? "",
        coverImageUrl: formState.coverImageUrl,
        author: formState.author?.trim() || sessionUser?.name || "익명",
        date: formState.date,
        categoryId: formState.categoryId,
        tags: formState.tags,
        sections: formState.sections.map((section, index) => ({
          title: section.title ?? "",
          description: section.description ?? "",
          imageUrl: section.imageUrl ?? "",
          sortOrder: index,
        })),
      };
      return noteId ? NoteService.updateNote(noteId, payload) : NoteService.createNote(payload);
    },
    onSuccess: (data) => {
      setStatus({ type: "success", message: "노트를 저장했습니다." });
      queryClient.invalidateQueries({ queryKey: ["note", "list"] });
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: ["note", "detail", data.id.toString()] });
        setSearchParams({ tab: "detail", id: data.id.toString() }, { replace: true });
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.";
      setStatus({ type: "error", message });
    },
  });

  const handleSave = () => saveMutation.mutate();

  const assetUpload = useMutation({
    mutationFn: (file: File) => NoteService.uploadAsset(file),
  });

  const handleFileUpload = async (file: File) => {
    const { url } = await assetUpload.mutateAsync(file);
    return url;
  };

  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleCoverPick = () => coverInputRef.current?.click();

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleFileUpload(file);
      updateForm("coverImageUrl", url);
    } catch (error) {
      setStatus({ type: "error", message: "이미지 업로드에 실패했습니다." });
    } finally {
      event.target.value = "";
    }
  };

  const handleInsertInlineImage = async (file: File) => {
    const url = await handleFileUpload(file);
    updateForm("content", `${formState.content}\n\n![image](${url})\n`);
    setStatus({ type: "success", message: "본문에 이미지를 추가했습니다." });
  };

  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  const detail = noteQuery.data;

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="h-14 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur" />
      <div className="mx-auto w-full max-w-[90%] px-4 py-8 lg:max-w-[80%]">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTabChange("form")}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              tab === "form"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            작성하기
          </button>
          <button
            onClick={() => handleTabChange("detail")}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              tab === "detail"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            상세보기
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/notes"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
              목록으로
            </Link>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        {status && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm ${
              status.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {status.message}
          </div>
        )}

        {tab === "form" ? (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                <div className="space-y-5 md:col-span-8">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">제목</label>
                    <input
                      value={formState.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                      placeholder="노트 제목을 입력하세요"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-300 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">요약 (스니펫)</label>
                    <textarea
                      rows={3}
                      value={formState.snippet}
                      onChange={(e) => updateForm("snippet", e.target.value)}
                      placeholder="목록에 노출될 간단한 설명을 입력하세요"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-300 focus:bg-white"
                    />
                  </div>
                  <div data-color-mode="light">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Layers className="h-4 w-4" /> 본문 (Markdown 지원)
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white">
                      <MDEditor value={formState.content} onChange={(value) => updateForm("content", value ?? "")} />
                    </div>
                    <div className="mt-2">
                      <input
                        ref={inlineInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            await handleInsertInlineImage(file);
                          } catch (error) {
                            setStatus({ type: "error", message: "이미지 업로드에 실패했습니다." });
                          } finally {
                            e.target.value = "";
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => inlineInputRef.current?.click()}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <ImageIcon className="h-4 w-4" /> 본문에 이미지 삽입
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-5 md:col-span-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">대표 이미지</label>
                    <div className="space-y-3">
                      {formState.coverImageUrl ? (
                        <img
                          src={formState.coverImageUrl}
                          alt="cover"
                          className="h-40 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                          이미지가 없습니다.
                        </div>
                      )}
                      <input
                        ref={coverInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleCoverChange}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCoverPick}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          <Upload className="h-4 w-4" />
                          업로드
                        </button>
                        {formState.coverImageUrl && (
                          <button
                            type="button"
                            onClick={() => updateForm("coverImageUrl", "")}
                            className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
                          >
                            제거
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">카테고리</label>
                    <select
                      value={formState.categoryId ?? ""}
                      onChange={(e) => updateForm("categoryId", e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    >
                      <option value="">카테고리를 선택하세요</option>
                      {flatCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {`${"─ ".repeat(cat.depth)}${cat.label}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">작성자</label>
                      <input
                        value={formState.author}
                        onChange={(e) => updateForm("author", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">작성일</label>
                      <input
                        type="date"
                        value={formState.date ?? ""}
                        onChange={(e) => updateForm("date", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">태그</label>
                      <div className="flex items-center gap-2">
                        <input
                          value={tagDraft}
                          onChange={(e) => setTagDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                          placeholder="태그 입력 후 Enter"
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          추가
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formState.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600"
                          >
                            #{tag}
                            <button onClick={() => removeTag(tag)} type="button" className="text-slate-400">
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <ImageIcon className="h-4 w-4" />
                  섹션(주제 · 이미지 · 설명)
                </div>
                <button
                  onClick={handleAddSection}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  섹션 추가
                </button>
              </div>
              {formState.sections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                  아직 추가된 섹션이 없습니다. 주제별로 이미지를 첨부해 내용을 정리해보세요.
                </div>
              ) : (
                <div className="space-y-4">
                  {formState.sections.map((section, index) => (
                    <SectionEditor
                      key={section.localId}
                      section={section}
                      index={index}
                      onChange={updateSection}
                      onRemove={removeSection}
                      onMove={moveSection}
                      onUpload={handleFileUpload}
                      uploading={assetUpload.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <DetailView detail={detail} isLoading={noteQuery.isLoading} />
        )}
      </div>
    </div>
  );
};

type SectionEditorProps = {
  section: SectionForm;
  index: number;
  onChange: (id: string, patch: Partial<SectionForm>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onUpload: (file: File) => Promise<string>;
  uploading: boolean;
};

const SectionEditor = ({ section, index, onChange, onRemove, onMove, onUpload, uploading }: SectionEditorProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await onUpload(file);
      onChange(section.localId, { imageUrl: url });
    } catch {
      // handled upstream
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">섹션 #{index + 1}</p>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => onMove(section.localId, "up")}
            className="rounded-full border border-slate-200 px-2 py-1 text-slate-500 hover:bg-slate-50"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(section.localId, "down")}
            className="rounded-full border border-slate-200 px-2 py-1 text-slate-500 hover:bg-slate-50"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onRemove(section.localId)}
            className="rounded-full border border-rose-200 px-3 py-1 text-rose-500 hover:bg-rose-50"
          >
            삭제
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">주제</label>
          <input
            value={section.title ?? ""}
            onChange={(e) => onChange(section.localId, { title: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            placeholder="섹션 제목"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">이미지</label>
          <div className="flex items-center gap-2">
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
            <button
              type="button"
              onClick={handlePick}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
              {uploading ? "업로드 중..." : "이미지 선택"}
            </button>
            {section.imageUrl && (
              <a
                href={section.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 underline"
              >
                보기
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-600">설명 (Markdown 가능)</label>
        <textarea
          rows={4}
          value={section.description ?? ""}
          onChange={(e) => onChange(section.localId, { description: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          placeholder="이미지 설명, 배경, 추가 노트를 작성하세요."
        />
      </div>
    </div>
  );
};

const DetailView = ({ detail, isLoading }: { detail?: NoteDetailType; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        노트를 불러오는 중입니다.
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
        저장된 노트가 없습니다. 먼저 노트를 작성하고 저장해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{detail.date ?? "미정"}</span>
              <span>
                {detail.categoryTop} {detail.categorySub ? `/ ${detail.categorySub}` : ""}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{detail.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{detail.snippet}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {detail.views?.toLocaleString() ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {detail.date ?? "-"}
              </span>
            </div>
          </div>
          <Link
            to={`/note/detail?tab=form&id=${detail.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" /> 수정하기
          </Link>
        </div>
      </div>
      {detail.coverImageUrl && (
        <img
          src={detail.coverImageUrl}
          alt="cover"
          className="w-full rounded-2xl border border-slate-200 object-cover shadow-sm"
        />
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <article className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="prose prose-slate max-w-none">
            {detail.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.content}</ReactMarkdown>
            ) : (
              <p className="text-sm text-slate-400">본문 내용이 없습니다.</p>
            )}
          </div>
        </article>
        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-2 text-sm text-slate-600">
            <p className="font-semibold">작성 정보</p>
            <p>작성자: {detail.author ?? "-"}</p>
            <p>카테고리: {detail.categoryPath ?? "-"}</p>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-800">
              <Tag className="h-4 w-4" />
              태그
            </p>
            <div className="flex flex-wrap gap-2">
              {detail.tags?.length ? (
                detail.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                    #{tag}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">등록된 태그가 없습니다.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
      {detail.sections?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">섹션</h3>
          {detail.sections.map((section, idx) => (
            <div key={`${section.title}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-base font-semibold text-slate-800">{section.title || `섹션 ${idx + 1}`}</h4>
              {section.imageUrl && (
                <img src={section.imageUrl} alt={section.title ?? "section"} className="mt-3 w-full rounded-xl object-cover" />
              )}
              {section.description && (
                <div className="prose prose-slate mt-3 max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.description}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesFormAndDetailPreview;
