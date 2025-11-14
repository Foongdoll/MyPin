import api from "../lib/axios";
import type { ScheduledItem } from "../types/ChatType";

const mapItem = (row: any): ScheduledItem => ({
  id: row.id,
  type: row.type === "EMAIL" ? "email" : "chat",
  roomKey: row.roomKey ?? undefined,
  subject: row.emailSubject ?? undefined,
  message: row.message ?? row.emailBody ?? "",
  recipients: row.recipients ?? [],
  scheduledAt: row.scheduledAt,
  status: row.status,
});

export const notificationApi = {
  async list(): Promise<ScheduledItem[]> {
    const { data } = await api.get("/notifications/scheduled");
    return data.map(mapItem);
  },
  scheduleChat(roomKey: string, senderId: number, message: string, scheduledAt: number) {
    return api.post("/notifications/scheduled", {
      type: "CHAT_MESSAGE",
      roomKey,
      senderId,
      message,
      scheduledAt,
    });
  },
  scheduleEmail(recipients: string[], subject: string, body: string, scheduledAt: number) {
    return api.post("/notifications/scheduled", {
      type: "EMAIL",
      recipients,
      emailSubject: subject,
      emailBody: body,
      scheduledAt,
    });
  },
  cancel(id: number) {
    return api.delete(`/notifications/scheduled/${id}`);
  },
};
