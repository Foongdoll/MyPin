import api from "../../shared/lib/axios";
import type { ApiResponse } from "../../shared/lib/axios/types";
import type {
  Schedule,
  ScheduleListParams,
  ScheduleListResponse,
  ScheduleCreatePayload,
  ScheduleComment,
  ScheduleCommentPayload,
  ScheduleReactionState,
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

  async fetchScheduleComments(scheduleNo: number) {
    const { data } = await api.get<ApiResponse<ScheduleComment[]>>(`/schedules/${scheduleNo}/comments`);
    return unwrapResponse(data, [] as ScheduleComment[]);
  },

  async addScheduleComment(scheduleNo: number, payload: ScheduleCommentPayload) {
    const { data } = await api.post<ApiResponse<ScheduleComment>>(`/schedules/${scheduleNo}/comments`, payload);
    return unwrapResponse(data);
  },

  async fetchScheduleReaction(scheduleNo: number) {
    const { data } = await api.get<ApiResponse<ScheduleReactionState>>(`/schedules/${scheduleNo}/likes`);
    return unwrapResponse(data);
  },

  async toggleScheduleLike(scheduleNo: number) {
    const { data } = await api.post<ApiResponse<ScheduleReactionState>>(`/schedules/${scheduleNo}/likes/toggle`);
    return unwrapResponse(data);
  },
};

export default ScheduleService;
