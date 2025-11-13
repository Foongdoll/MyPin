export type Friend = {
  id: number;
  name: string;
  status: "online" | "offline" | "busy";
};

export type ChatRoom = {
  id: number;
  name: string;
  type: "dm" | "group";
  lastMessage: string;
  unread: number;
};

export type Message = {
  id: number;
  author: "me" | "other";
  name?: string;
  content: string;
  time: string;
  type: "text" | "image" | "video" | "emoji";
  scheduled?: boolean;
};
