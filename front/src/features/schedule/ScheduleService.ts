import api from "../../shared/lib/axios";
import type { ApiResponse } from "../../shared/lib/axios/types";
import type {
  Schedule,
  ScheduleListParams,
  ScheduleListResponse,
  ScheduleCreatePayload,
  ScheduleUpdatePayload,
  ScheduleComment,
  ScheduleCommentPayload,
  ScheduleCommentUpdatePayload,
  ScheduleReactionState,
  ScheduleCalendarResponse,
} from "../../shared/types/ScheduleType";

function unwrapResponse<T>(response: ApiResponse<T>, fallback?: T): T {
  if (!response.success) {
    throw new Error(response.message ?? "요청을 처리하지 못했습니다.");
  }
  if (response.data === undefined || response.data === null) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(response.message ?? "요청 결과가 비어 있습니다.");
  }
  return response.data;
}

const ScheduleService = {
  async fetchSchedules(params?: ScheduleListParams) {
    const { data } = await api.get<ApiResponse<ScheduleListResponse>>("/schedules", { params });
    return unwrapResponse(data);
  },

  async createSchedule(payload: ScheduleCreatePayload) {
    const { data } = await api.post<ApiResponse<Schedule>>("/schedules", payload);
    return unwrapResponse(data);
  },

  async updateSchedule(scheduleNo: number, payload: ScheduleUpdatePayload) {
    const { data } = await api.put<ApiResponse<Schedule>>(`/schedules/${scheduleNo}`, payload);
    return unwrapResponse(data);
  },

  async deleteSchedule(scheduleNo: number) {
    const { data } = await api.delete<ApiResponse<void>>(`/schedules/${scheduleNo}`);
    return unwrapResponse(data, undefined);
  },

  async fetchScheduleComments(scheduleNo: number) {
    const { data } = await api.get<ApiResponse<ScheduleComment[]>>(`/schedules/${scheduleNo}/comments`);
    return unwrapResponse(data, [] as ScheduleComment[]);
  },

  async addScheduleComment(scheduleNo: number, payload: ScheduleCommentPayload) {
    const { data } = await api.post<ApiResponse<ScheduleComment>>(`/schedules/${scheduleNo}/comments`, payload);
    return unwrapResponse(data);
  },

  async updateScheduleComment(scheduleNo: number, commentId: string | number, payload: ScheduleCommentUpdatePayload) {
    const { data } = await api.put<ApiResponse<ScheduleComment>>(
      `/schedules/${scheduleNo}/comments/${commentId}`,
      payload
    );
    return unwrapResponse(data);
  },

  async deleteScheduleComment(scheduleNo: number, commentId: string | number, author: string) {
    const { data } = await api.delete<ApiResponse<void>>(`/schedules/${scheduleNo}/comments/${commentId}`, {
      params: { author },
    });
    return unwrapResponse(data, undefined);
  },

  async fetchScheduleReaction(scheduleNo: number) {
    const { data } = await api.get<ApiResponse<ScheduleReactionState>>(`/schedules/${scheduleNo}/likes`);
    return unwrapResponse(data);
  },

  async toggleScheduleLike(scheduleNo: number) {
    const { data } = await api.post<ApiResponse<ScheduleReactionState>>(`/schedules/${scheduleNo}/likes/toggle`);
    return unwrapResponse(data);
  },

  async fetchCalendarSummary(month: string) {
    const { data } = await api.get<ApiResponse<ScheduleCalendarResponse>>("/schedules/calendar", {
      params: { month },
    });
    return unwrapResponse(data);
  },
};

export default ScheduleService;
