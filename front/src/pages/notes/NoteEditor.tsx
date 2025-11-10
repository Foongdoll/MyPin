import { useEffect, useState } from "react";
import MarkdownEditor from "./MarkDownEditor";
import { NoteService } from "../../features/note/NoteService";
import type { NoteDetail } from "../../shared/types/NoteType";

type Props = {
    open: boolean;
    onClose: () => void;
    initial?: Partial<NoteDetail>; // 수정 시 NoteDetail 전달
    onSaved?: (id: string) => void;
};

export default function NoteEditor({ open, onClose, initial, onSaved }: Props) {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [content, setContent] = useState(initial?.content ?? "");
    const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
    const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
    const [cats, setCats] = useState<any[]>([]);
    const isEdit = !!initial?.id;

    useEffect(() => {
        if (!open) return;
        setTitle(initial?.title ?? "");
        setContent(initial?.content ?? "");
        setCategoryId(initial?.categoryId ?? "");
        setTags((initial?.tags ?? []).join(", "));
        NoteService.categoryTree().then(setCats).catch(() => setCats([]));
    }, [open, initial]);

    const save = async () => {
        const payload = {
            title,
            content,
            categoryId: categoryId || undefined,
            tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        };
        const res = isEdit
            ? await NoteService.update(initial!.id!, payload)
            : await NoteService.create(payload);
        onSaved?.(res.id);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
            <div className="rounded-2xl bg-white w-full max-w-5xl max-h-[92vh] overflow-auto shadow-2xl">
                <div className="flex items-center justify-between border-b px-5 py-3">
                    <h3 className="text-lg font-semibold">{isEdit ? "노트 수정" : "새 노트"}</h3>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm">취소</button>
                        <button onClick={save} className="rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm">저장</button>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="제목"
                    />

                    {/* 카테고리 & 태그 */}
                    <div className="flex flex-col gap-3 md:flex-row">
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="rounded-md border px-3 py-2 text-sm md:w-64"
                        >
                            <option value="">카테고리 선택</option>
                            {cats.map((c) => (
                                <option key={c.id} value={c.id}>{c.path || c.name}</option>
                            ))}
                        </select>

                        <input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="flex-1 rounded-md border px-3 py-2 text-sm"
                            placeholder="태그(쉼표로 구분)"
                        />
                    </div>

                    {/* 마크다운 에디터 */}
                    <MarkdownEditor value={content} onChange={setContent} />

                    {/* 간단 카테고리 편집 (이름 변경) */}
                    {categoryId && (
                        <CategoryInlineEditor
                            categoryId={categoryId}
                            onSaved={() => NoteService.categoryTree().then(setCats)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function CategoryInlineEditor({ categoryId, onSaved }: { categoryId: string; onSaved: () => void; }) {
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        // 선택한 카테고리의 기존 이름을 서버에서 가져와도 되고,
        // categoryTree() 목록을 전달받아 찾는 방식도 가능. 여기선 단순 입력만 제공.
        setName("");
    }, [categoryId]);

    const save = async () => {
        if (!name.trim()) return;
        setBusy(true);
        try {
            await NoteService.saveCategory(categoryId, name.trim());
            onSaved();
            setName("");
            alert("카테고리를 수정했습니다.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mt-4 rounded-md border p-3 space-y-2">
            <div className="text-sm font-medium">카테고리 이름 변경</div>
            <div className="flex gap-2">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 rounded-md border px-3 py-2 text-sm"
                    placeholder="새 카테고리 이름"
                />
                <button
                    disabled={busy}
                    onClick={save}
                    className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                >
                    저장
                </button>
            </div>
        </div>
    );
}