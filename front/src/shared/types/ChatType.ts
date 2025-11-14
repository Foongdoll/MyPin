export type PresenceStatus = "online" | "offline" | "busy";
export type FriendshipState = "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";

export type Friend = {
  id: number;
  name: string;
  presence: PresenceStatus;
  relationshipStatus: FriendshipState;
  blocked: boolean;
};

export type FriendRequest = {
  requestId: number;
  requesterId: number;
  requesterName: string;
  receiverId: number;
  receiverName: string;
  status: FriendshipState;
  createdAt: number;
};

export type ChatRoomMember = {
  userId: number;
  name: string;
  admin: boolean;
};

export type ChatRoom = {
  roomKey: string;
  name: string;
  type: "dm" | "group";
  muted: boolean;
  members: ChatRoomMember[];
  lastMessage?: ChatMessage;
  unread: number;
};

export type ChatMessage = {
  id: string;
  authorId: string;
  authorName?: string;
  content: string;
  ts: number;
  type: "text" | "image" | "video" | "emoji";
  mediaUrl?: string;
  scheduled?: boolean;
};

export type ScheduledItemType = "chat" | "email";

export type ScheduledItem = {
  id: number;
  type: ScheduledItemType;
  roomKey?: string;
  subject?: string;
  message: string;
  recipients?: string[];
  scheduledAt: number;
  status: "PENDING" | "SENT" | "CANCELLED";
};
