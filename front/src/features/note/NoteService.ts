import type { Comment, NoteDetail } from "../../shared/types/NoteType";

const BASE = "/api";

export const NoteService = {
    async list(params: { cat?: string; q?: string; tag?: string; page?: number; size?: number }) {
        const qs = new URLSearchParams();
        if (params.cat) qs.set("cat", params.cat);
        if (params.q) qs.set("q", params.q);
        if (params.tag) qs.set("tag", params.tag);
        qs.set("page", String(params.page ?? 1));
        qs.set("size", String(params.size ?? 12));
        const res = await fetch(`${BASE}/notes?${qs.toString()}`);
        if (!res.ok) throw new Error("노트 목록 조회 실패");
        return res.json();
    },

    async get(id: string): Promise<NoteDetail> {
        const res = await fetch(`${BASE}/notes/${id}`);
        if (!res.ok) throw new Error("노트 조회 실패");
        return res.json() as Promise<NoteDetail>;
    },


    async create(payload: Partial<NoteDetail>) {
        const res = await fetch(`${BASE}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("노트 생성 실패");
        return res.json();
    },

    async update(id: string, payload: Partial<NoteDetail>) {
        const res = await fetch(`${BASE}/notes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("노트 수정 실패");
        return res.json();
    },

    async like(id: string): Promise<{ liked: boolean; likes: number }> {
        const res = await fetch(`${BASE}/notes/${id}/like`, { method: "POST" });
        if (!res.ok) throw new Error("좋아요 처리 실패");
        return res.json() as Promise<{ liked: boolean; likes: number }>;
    },

    async comments(id: string): Promise<Comment[]> {
        const res = await fetch(`${BASE}/notes/${id}/comments`);
        if (!res.ok) throw new Error("댓글 목록 조회 실패");
        return res.json() as Promise<Comment[]>; // ✅ 여기서 타입 고정
    },

    async addComment(id: string, content: string): Promise<Comment> {
        const res = await fetch(`${BASE}/notes/${id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error("댓글 작성 실패");
        return res.json() as Promise<Comment>; // ✅ 타입 고정
    },



    async deleteComment(id: string, commentId: string) {
        const res = await fetch(`${BASE}/notes/${id}/comments/${commentId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("댓글 삭제 실패");
    },

    async uploadImage(file: File) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${BASE}/files`, { method: "POST", body: form });
        if (!res.ok) throw new Error("이미지 업로드 실패");
        return res.json() as Promise<{ url: string }>;
    },

    async categoryTree() {
        const res = await fetch(`${BASE}/categories`);
        if (!res.ok) throw new Error("카테고리 조회 실패");
        return res.json();
    },

    async saveCategory(id: string, name: string) {
        const res = await fetch(`${BASE}/categories/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error("카테고리 저장 실패");
        return res.json();
    },
};