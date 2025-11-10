import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { ScheduleComment } from "../../shared/types/ScheduleType";

type Props = {
  open: boolean;
  comments: ScheduleComment[];
  focusedCommentId?: string | null;
  currentUser: string;
  onClose: () => void;
  onEdit: (commentId: string, nextContent: string) => Promise<void> | void;
  onDelete: (commentId: string) => Promise<void> | void;
  pendingAction?: { type: "edit" | "delete"; id: string | number | null } | null;
};

export default function ExpandedCommentTooltip({
  open,
  comments,
  focusedCommentId,
  currentUser,
  onClose,
  onEdit,
  onDelete,
  pendingAction,
}: Props) {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setDraft("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !focusedCommentId) return;
    const element = document.querySelector<HTMLElement>(`[data-comment-id="${focusedCommentId}"]`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [open, focusedCommentId, comments.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const pendingId = pendingAction?.id != null ? String(pendingAction.id) : null;
  const isPending = (type: "edit" | "delete", id: string | number) =>
    pendingAction?.type === type && pendingId === String(id);
  const visibleComments = useMemo(() => comments ?? [], [comments]);
  if (typeof window === "undefined") return null;

  const startEditing = (comment: ScheduleComment) => {
    setEditingId(comment.id);
    setDraft(comment.content);
  };

  const handleSave = async () => {
    if (editingId == null) return;
    await onEdit(String(editingId), draft.trim());
    setEditingId(null);
    setDraft("");
  };

  const handleDelete = async (commentId: string | number) => {
    await onDelete(String(commentId));
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            className="relative z-10 w-[min(760px,94vw)] max-h-[80vh] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-100"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">댓글</p>
                <p className="text-lg font-semibold text-slate-900">
                  총 {visibleComments.length.toLocaleString()}개의 댓글
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-3">
              {visibleComments.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">아직 댓글이 없습니다.</p>
              ) : (
                visibleComments.map((comment) => {
                  const commentId = String(comment.id);
                  const isMine = comment.author === currentUser;
                  const isEditing = editingId === comment.id;
                  return (
                    <div
                      key={comment.id}
                      data-comment-id={commentId}
                      className={`rounded-2xl border p-4 shadow-sm transition ${
                        focusedCommentId === commentId ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-100"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {isMine && (
                          <div className="flex gap-2 text-xs">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50"
                                  onClick={() => {
                                    setEditingId(null);
                                    setDraft("");
                                  }}
                                  disabled={isPending("edit", commentId)}
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  className="rounded-full bg-blue-600 px-3 py-1 text-white shadow disabled:opacity-50"
                                  onClick={handleSave}
                                  disabled={isPending("edit", commentId) || !draft.trim()}
                                >
                                  {isPending("edit", commentId) ? "저장 중..." : "저장"}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50"
                                  onClick={() => startEditing(comment)}
                                >
                                  수정
                                </button>
                                <button
                                  type="button"
                                  className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                  onClick={() => handleDelete(commentId)}
                                  disabled={isPending("delete", commentId)}
                                >
                                  {isPending("delete", commentId) ? "삭제 중..." : "삭제"}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-sm text-slate-700">
                        {isEditing ? (
                          <textarea
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            rows={4}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
