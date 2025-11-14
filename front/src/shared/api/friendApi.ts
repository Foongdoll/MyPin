import api from "../lib/axios";
import type { Friend, FriendRequest, PresenceStatus } from "../types/ChatType";

const toPresence = (serverStatus: string): PresenceStatus => {
  switch (serverStatus) {
    case "ONLINE":
      return "online";
    case "BUSY":
      return "busy";
    default:
      return "offline";
  }
};

const mapFriend = (row: any): Friend => ({
  id: row.friendId,
  name: row.friendName,
  presence: toPresence(row.presenceStatus),
  relationshipStatus: row.relationshipStatus,
  blocked: row.blocked,
});

const mapRequest = (row: any): FriendRequest => ({
  requestId: row.requestId,
  requesterId: row.requesterId,
  requesterName: row.requesterName,
  receiverId: row.receiverId,
  receiverName: row.receiverName,
  status: row.status,
  createdAt: row.createdAt,
});

export const friendApi = {
  async list(userId: number): Promise<Friend[]> {
    const { data } = await api.get("/friends", { params: { myUserId: userId } });
    return data.map(mapFriend);
  },
  async blocked(userId: number): Promise<Friend[]> {
    const { data } = await api.get("/friends/blocked", { params: { myUserId: userId } });
    return data.map(mapFriend);
  },
  async incoming(userId: number): Promise<FriendRequest[]> {
    const { data } = await api.get("/friends/requests/incoming", { params: { myUserId: userId } });
    return data.map(mapRequest);
  },
  async outgoing(userId: number): Promise<FriendRequest[]> {
    const { data } = await api.get("/friends/requests/outgoing", { params: { myUserId: userId } });
    return data.map(mapRequest);
  },
  sendRequest(fromUserId: number, toUserId: number) {
    return api.post("/friends/request", null, { params: { fromUserId, toUserId } });
  },
  cancelRequest(fromUserId: number, toUserId: number) {
    return api.delete("/friends/request", { params: { fromUserId, toUserId } });
  },
  accept(myUserId: number, fromUserId: number) {
    return api.post("/friends/accept", null, { params: { myUserId, fromUserId } });
  },
  reject(myUserId: number, fromUserId: number) {
    return api.post("/friends/reject", null, { params: { myUserId, fromUserId } });
  },
  block(myUserId: number, targetUserId: number) {
    return api.post("/friends/block", null, { params: { myUserId, targetUserId } });
  },
  unblock(myUserId: number, targetUserId: number) {
    return api.post("/friends/unblock", null, { params: { myUserId, targetUserId } });
  },
  setPresence(myUserId: number, status: PresenceStatus) {
    const mapped = status === "busy" ? "BUSY" : status === "online" ? "ONLINE" : "OFFLINE";
    return api.patch("/friends/presence", null, { params: { myUserId, status: mapped } });
  },
};
