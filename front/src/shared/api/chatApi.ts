import api from "../lib/axios";
import type { ChatRoom, ChatRoomMember, ChatMessage } from "../types/ChatType";

const mapMember = (row: any): ChatRoomMember => ({
  userId: row.userId,
  name: row.name,
  admin: row.admin,
});

const mapRoom = (row: any): ChatRoom => ({
  roomKey: row.roomKey,
  name: row.name,
  type: row.groupRoom ? "group" : "dm",
  muted: row.muted,
  members: (row.members ?? []).map(mapMember),
  lastMessage: row.lastMessage,
  unread: row.unread ?? 0,
});

const mapMessage = (row: any): ChatMessage => ({
  id: `${row.roomId}-${row.ts}-${row.senderId ?? "system"}-${row.content?.length ?? 0}`,
  authorId: row.senderId ?? "system",
  content: row.content ?? "",
  mediaUrl: row.mediaUrl ?? undefined,
  ts: row.ts,
  type: row.mediaType ? "image" : "text",
});

export const chatApi = {
  async rooms(userId: number): Promise<ChatRoom[]> {
    const { data } = await api.get("/chat/rooms", { params: { userId } });
    return data.map(mapRoom);
  },
  async createDirect(ownerId: number, friendId: number) {
    const { data } = await api.post("/chat/rooms", {
      ownerId,
      name: "",
      groupRoom: false,
      memberIds: [friendId],
    });
    return mapRoom(data);
  },
  async createGroup(ownerId: number, name: string, memberIds: number[]) {
    const { data } = await api.post("/chat/rooms", {
      ownerId,
      name,
      groupRoom: true,
      memberIds,
    });
    return mapRoom(data);
  },
  invite(roomKey: string, requesterId: number, inviteeIds: number[]) {
    return api.post("/chat/rooms/invite", { roomKey, requesterId, inviteeIds });
  },
  leave(roomKey: string, userId: number) {
    return api.post("/chat/rooms/leave", { roomKey, userId });
  },
  mute(roomKey: string, userId: number, muted: boolean) {
    return api.post("/chat/rooms/mute", { roomKey, userId, muted });
  },
  async messages(roomKey: string, limit = 50): Promise<ChatMessage[]> {
    const { data } = await api.get("/chat/messages", { params: { roomKey, limit } });
    return data.map(mapMessage);
  },
};
