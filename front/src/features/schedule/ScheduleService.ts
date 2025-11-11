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


const body = <T>(res: ApiResponse<T>): T => (res as any)?.data as T;

const ScheduleService = {
  async fetchSchedules(params?: ScheduleListParams) {
    const { data } = await api.get<ApiResponse<ScheduleListResponse>>("/schedules", { params });
    return body(data);
  },

  async createSchedule(payload: ScheduleCreatePayload) {
    const { data } = await api.post<ApiResponse<Schedule>>("/schedules", payload);
    return body(data);
  },

  async updateSchedule(scheduleNo: number, payload: ScheduleUpdatePayload) {
    const { data } = await api.put<ApiResponse<Schedule>>(`/schedules/${scheduleNo}`, payload);
    return body(data);
  },

  async deleteSchedule(scheduleNo: number) {
    await api.delete<ApiResponse<void>>(`/schedules/${scheduleNo}`);
    return; // void
  },

  async fetchScheduleComments(scheduleNo: number) {
    const { data } = await api.get<ApiResponse<ScheduleComment[]>>(`/schedules/${scheduleNo}/comments`);
    return body(data) ?? ([] as ScheduleComment[]);
  },

  async addScheduleComment(scheduleNo: number, payload: ScheduleCommentPayload) {
    const { data } = await api.post<ApiResponse<ScheduleComment>>(`/schedules/${scheduleNo}/comments`, payload);
    return body(data);
  },

  async updateScheduleComment(
    scheduleNo: number,
    commentId: string | number,
    payload: ScheduleCommentUpdatePayload
  ) {
    const { data } = await api.put<ApiResponse<ScheduleComment>>(
      `/schedules/${scheduleNo}/comments/${commentId}`,
      payload
    );
    return body(data);
  },

  async deleteScheduleComment(scheduleNo: number, commentId: string | number, author: string) {
    await api.delete<ApiResponse<void>>(`/schedules/${scheduleNo}/comments/${commentId}`, { params: { author } });
    return; // void
  },

  async fetchScheduleReaction(scheduleNo: number) {
    const { data } = await api.get<ApiResponse<ScheduleReactionState>>(`/schedules/${scheduleNo}/likes`);
    return body(data);
  },

  async toggleScheduleLike(scheduleNo: number) {
    const { data } = await api.post<ApiResponse<ScheduleReactionState>>(`/schedules/${scheduleNo}/likes/toggle`);
    return body(data);
  },

  async fetchCalendarSummary(month: string) {
    const { data } = await api.get<ApiResponse<ScheduleCalendarResponse>>("/schedules/calendar", { params: { month } });
    return body(data);
  },
};

export default ScheduleService;
