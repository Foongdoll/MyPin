import api from "../../shared/lib/axios";
import type { ApiResponse } from "../../shared/lib/axios/types";
import type {
  AssetUploadResponse,
  CategoryCreatePayload,
  CategoryNode,
  NoteDetail,
  NoteListParams,
  NoteListResponse,
  NotePayload,
} from "../../shared/types/NoteType";

const responseBody = <T>(res: ApiResponse<T>): T => (res?.data ?? ({} as T));

const NoteService = {
  async fetchNotes(params: NoteListParams) {
    const { data } = await api.get<ApiResponse<NoteListResponse>>("/note", {
      params,
    });
    return responseBody(data);
  },

  async fetchNote(id: string | number) {
    const { data } = await api.get<ApiResponse<NoteDetail>>(`/note/${id}`);
    return responseBody(data);
  },

  async createNote(payload: NotePayload) {
    const { data } = await api.post<ApiResponse<NoteDetail>>("/note", payload);
    return responseBody(data);
  },

  async updateNote(id: string | number, payload: Partial<NotePayload>) {
    const { data } = await api.put<ApiResponse<NoteDetail>>(`/note/${id}`, payload);
    return responseBody(data);
  },

  async deleteNote(id: string | number) {
    await api.delete<ApiResponse<void>>(`/note/${id}`);
  },

  async fetchCategories() {
    const { data } = await api.get<ApiResponse<CategoryNode[]>>("/note/categories");
    return responseBody(data);
  },

  async createCategory(payload: CategoryCreatePayload) {
    const { data } = await api.post<ApiResponse<CategoryNode>>("/note/categories", payload);
    return responseBody(data);
  },

  async uploadAsset(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<ApiResponse<AssetUploadResponse>>("/note/assets", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return responseBody(data);
  },
};

export default NoteService;
