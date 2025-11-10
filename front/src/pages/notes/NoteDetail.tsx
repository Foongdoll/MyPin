// src/features/note/components/NoteDetail.tsx
import { useEffect, useState } from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import remarkGfm from "remark-gfm";
import { NoteService } from "../../features/note/NoteService";
import type { Comment, NoteDetail as NoteDetailType } from "../../shared/types/NoteType";

type Props = { noteId: string; onClose: () => void; onEdit: (note: NoteDetailType) => void };

export default function NoteDetail({ noteId, onClose, onEdit }: Props) {
  const [note, setNote] = useState<NoteDetailType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [pending, setPending] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    (async () => {
      const [n, c] = await Promise.all([NoteService.get(noteId), NoteService.comments(noteId)]);
      setNote(n);
      setComments(c);
    })();
  }, [noteId]);

  const like = async () => {
    if (!note) return;
    const res = await NoteService.like(note.id);
    setNote({ ...note, liked: res.liked, likes: res.likes });
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setPending(true);
    try {
      const created = await NoteService.addComment(noteId, comment.trim()); // NoteComment
      setComments((prev) => [created, ...prev]); // ✅ 같은 타입끼리 prepend → 안전
      setComment("");
    } finally {
      setPending(false);
    }
  };

  if (!note) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
        <div className="rounded-xl bg-white p-6 w-full max-w-3xl">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="rounded-2xl bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold">{note.title}</h2>
            <div className="text-xs text-slate-500">{note.categoryPath.join(" / ")}</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => onEdit(note)}>수정</button>
            <button className="rounded-md border px-3 py-1.5 text-sm" onClick={onClose}>닫기</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* 본문 */}
          <div className="p-5 overflow-auto">
            <div data-color-mode="light" className="prose max-w-none">
              {/* @uiw/react-markdown-preview 는 children이 아니라 source 사용 */}
              <MarkdownPreview source={note.content || ""} remarkPlugins={[remarkGfm]} />
            </div>
          </div>

          {/* 측면: 좋아요 / 댓글 */}
          <aside className="border-l p-4 space-y-3 lg:block">
            <button
              onClick={like}
              className={`w-full rounded-xl px-4 py-2 text-sm font-semibold border ${note.liked ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-white text-slate-700"}`}
            >
              ❤ 좋아요 {note.likes}
            </button>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">댓글</h4>
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                  placeholder="댓글을 입력하세요"
                />
                <button
                  disabled={pending}
                  onClick={addComment}
                  className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm disabled:opacity-50"
                >
                  등록
                </button>
              </div>

              <div className="divide-y border rounded-md">
                {comments.length === 0 && <div className="p-3 text-sm text-slate-500">첫 댓글을 남겨보세요.</div>}
                {comments.map((c) => (
                  <div key={c.id} className="p-3 text-sm">
                    
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{c.author}</div>
                      <div className="text-xs text-slate-400">{c.createdAt}</div>
                    </div>
                    <p className="mt-1">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
