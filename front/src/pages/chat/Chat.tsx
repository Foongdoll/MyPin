
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BellOff,
  Check,
  Clock,
  Mail,
  Menu,
  MoreVertical,
  Paperclip,
  PhoneOff,
  Plus,
  Send,
  Slash,
  Smile,
  Trash2,
  UserPlus,

  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { chatApi } from "../../shared/api/chatApi";
import { friendApi } from "../../shared/api/friendApi";
import { notificationApi } from "../../shared/api/notificationApi";
import { useSessionStore } from "../../state/session.store";
import { useWebSocket, useWsChannel, type WsMessage } from "../../app/provider/WebSocketProvider";
import type {
  ChatMessage,
  ChatRoom,
  Friend,
  FriendRequest,
  PresenceStatus,
  ScheduledItem,
} from "../../shared/types/ChatType";

type NotificationToast = {
  id: string;
  roomKey: string;
  roomName: string;
  preview: string;
  ts: number;
};

const normalizeMessage = (payload: WsMessage): ChatMessage => {
  const ts = typeof payload.ts === "number" ? payload.ts : Date.now();
  const sender = typeof payload.senderId === "string" ? payload.senderId : "system";
  const roomId = typeof payload.roomId === "string" ? payload.roomId : "room";
  const content = typeof payload.content === "string" ? payload.content : "";
  return {
    id: `${roomId}-${ts}-${sender}-${content.length}`,
    authorId: sender,
    content,
    ts,
    type: payload.mediaType ? "image" : "text",
    mediaUrl: typeof payload.mediaUrl === "string" ? payload.mediaUrl : undefined,
    scheduled: Boolean(payload.scheduled),
  };
};

const formatTimestamp = (ts: number) => format(new Date(ts), "a h:mm");
const Chat = () => {
  const sessionUser = useSessionStore((state) => state.user);
  const userId = sessionUser?.uuid ?? null;
  const queryClient = useQueryClient();
  const { status, send } = useWebSocket();

  const [activeTab, setActiveTab] = useState<"friends" | "chats">("friends");
  const [selectedRoomKey, setSelectedRoomKey] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageMap, setMessageMap] = useState<Record<string, ChatMessage[]>>({});
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);
  const [presence, setPresence] = useState<PresenceStatus>("online");
  const [showDmModal, setShowDmModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showScheduleMessageModal, setShowScheduleMessageModal] = useState(false);
  const [showScheduleMailModal, setShowScheduleMailModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  const roomsRef = useRef<ChatRoom[]>([]);
  const loadedRooms = useRef(new Set<string>());

  useEffect(() => {
    const openDm = () => setShowDmModal(true);
    const openGroup = () => setShowGroupModal(true);
    const openScheduleMessage = () => setShowScheduleMessageModal(true);
    const openScheduleMail = () => setShowScheduleMailModal(true);

    window.addEventListener("chat:create-dm", openDm);
    window.addEventListener("chat:create-group", openGroup);
    window.addEventListener("chat:schedule-message", openScheduleMessage);
    window.addEventListener("chat:schedule-mail", openScheduleMail);

    return () => {
      window.removeEventListener("chat:create-dm", openDm);
      window.removeEventListener("chat:create-group", openGroup);
      window.removeEventListener("chat:schedule-message", openScheduleMessage);
      window.removeEventListener("chat:schedule-mail", openScheduleMail);
    };
  }, []);

  const {
    data: friends = [],
    refetch: refetchFriends,
  } = useQuery({
    queryKey: ["chat", "friends", userId],
    queryFn: () => friendApi.list(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 15,
  });

  const {
    data: blockedFriends = [],
    refetch: refetchBlocked,
  } = useQuery({
    queryKey: ["chat", "friends", "blocked", userId],
    queryFn: () => friendApi.blocked(userId!),
    enabled: Boolean(userId),
  });

  const {
    data: incomingRequests = [],
    refetch: refetchIncoming,
  } = useQuery({
    queryKey: ["chat", "friends", "incoming", userId],
    queryFn: () => friendApi.incoming(userId!),
    enabled: Boolean(userId),
  });

  const {
    data: outgoingRequests = [],
    refetch: refetchOutgoing,
  } = useQuery({
    queryKey: ["chat", "friends", "outgoing", userId],
    queryFn: () => friendApi.outgoing(userId!),
    enabled: Boolean(userId),
  });

  const {
    data: rooms = [],
    refetch: refetchRooms,
    isFetching: roomsLoading,
  } = useQuery({
    queryKey: ["chat", "rooms", userId],
    queryFn: () => chatApi.rooms(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 10,
  });

  const {
    data: scheduledItems = [],
    refetch: refetchSchedules,
  } = useQuery({
    queryKey: ["chat", "scheduled"],
    queryFn: () => notificationApi.list(),
  });

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    if (!rooms.length) {
      setSelectedRoomKey(null);
      return;
    }
    if (!selectedRoomKey) {
      setSelectedRoomKey(rooms[0].roomKey);
    }
  }, [rooms, selectedRoomKey]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.roomKey === selectedRoomKey) ?? null,
    [rooms, selectedRoomKey],
  );

  useEffect(() => {
    if (!selectedRoom) return;
    if (loadedRooms.current.has(selectedRoom.roomKey)) return;
    loadedRooms.current.add(selectedRoom.roomKey);
    chatApi.messages(selectedRoom.roomKey).then((msgs) => {
      setMessageMap((prev) => ({
        ...prev,
        [selectedRoom.roomKey]: msgs,
      }));
    });
  }, [selectedRoom]);

  useEffect(() => {
    if (!selectedRoom) return;
    setNotifications((prev) => prev.filter((toast) => toast.roomKey !== selectedRoom.roomKey));
    queryClient.setQueryData<ChatRoom[]>(["chat", "rooms", userId], (current) =>
      current?.map((room) =>
        room.roomKey === selectedRoom.roomKey ? { ...room, unread: 0 } : room,
      ),
    );
  }, [selectedRoom, queryClient, userId]);

  useEffect(() => {
    if (status !== "open" || rooms.length === 0) return;
    rooms.forEach((room) => {
      send({ type: "chat.join", roomId: room.roomKey });
    });
    return () => {
      rooms.forEach((room) => {
        send({ type: "chat.leave", roomId: room.roomKey });
      });
    };
  }, [status, rooms, send]);

  const handleIncomingMessage = useCallback(
    (payload: WsMessage) => {
      if (payload.type !== "chat.message" || typeof payload.roomId !== "string") {
        return;
      }
      const roomKey = payload.roomId as string;
      const normalized = normalizeMessage(payload);
      setMessageMap((prev) => ({
        ...prev,
        [roomKey]: [...(prev[roomKey] ?? []), normalized],
      }));
      queryClient.setQueryData<ChatRoom[]>(["chat", "rooms", userId], (current) =>
        current?.map((room) => {
          if (room.roomKey !== roomKey) return room;
          const unread = room.roomKey === selectedRoomKey ? 0 : (room.unread ?? 0) + 1;
          return { ...room, lastMessage: normalized, unread };
        }),
      );
      if (roomKey !== selectedRoomKey) {
        const roomMeta = roomsRef.current.find((room) => room.roomKey === roomKey);
        if (roomMeta && !roomMeta.muted) {
          setNotifications((prev) => [
            ...prev,
            {
              id: normalized.id,
              roomKey,
              roomName: roomMeta.name,
              preview: normalized.content,
              ts: normalized.ts,
            },
          ]);
        }
      }
    },
    [queryClient, selectedRoomKey, userId],
  );

  useWsChannel("chat.message", handleIncomingMessage);

  const handleSendMessage = () => {
    if (!selectedRoom || !userId || !messageDraft.trim()) return;
    const content = messageDraft.trim();
    send({ type: "chat.send", roomId: selectedRoom.roomKey, content });
    setMessageDraft("");
  };

  const handlePresenceChange = async (next: PresenceStatus) => {
    if (!userId) return;
    await friendApi.setPresence(userId, next);
    setPresence(next);
  };

  const handleAcceptRequest = async (fromUserId: number) => {
    if (!userId) return;
    await friendApi.accept(userId, fromUserId);
    refetchFriends();
    refetchIncoming();
  };

  const handleRejectRequest = async (fromUserId: number) => {
    if (!userId) return;
    await friendApi.reject(userId, fromUserId);
    refetchIncoming();
  };

  const handleCancelRequest = async (targetId: number) => {
    if (!userId) return;
    await friendApi.cancelRequest(userId, targetId);
    refetchOutgoing();
  };

  const handleBlockFriend = async (friendId: number) => {
    if (!userId) return;
    await friendApi.block(userId, friendId);
    refetchFriends();
    refetchBlocked();
  };

  const handleUnblockFriend = async (friendId: number) => {
    if (!userId) return;
    await friendApi.unblock(userId, friendId);
    refetchBlocked();
  };

  const createDmRoom = useCallback(
    async (targetId: number) => {
      if (!userId) return null;
      const room = await chatApi.createDirect(userId, targetId);
      await refetchRooms();
      setSelectedRoomKey(room.roomKey);
      return room;
    },
    [userId, refetchRooms],
  );

  const handleCreateDm = async (targetId: number) => {
    const room = await createDmRoom(targetId);
    if (room) {
      setShowDmModal(false);
    }
  };

  const handleQuickDm = (targetId: number) => {
    void createDmRoom(targetId);
  };

  const handleCreateGroup = async (name: string, memberIds: number[]) => {
    if (!userId) return;
    const room = await chatApi.createGroup(userId, name, memberIds);
    await refetchRooms();
    setSelectedRoomKey(room.roomKey);
    setShowGroupModal(false);
  };

  const handleInviteMembers = async (roomKey: string, ids: number[]) => {
    if (!userId || !ids.length) return;
    await chatApi.invite(roomKey, userId, ids);
    refetchRooms();
  };

  const handleLeaveRoom = async (roomKey: string) => {
    if (!userId) return;
    await chatApi.leave(roomKey, userId);
    refetchRooms();
    if (selectedRoomKey === roomKey) {
      setSelectedRoomKey(null);
    }
  };

  const handleToggleMute = async (roomKey: string, muted: boolean) => {
    if (!userId) return;
    await chatApi.mute(roomKey, userId, muted);
    refetchRooms();
  };

  const handleScheduleMessage = async (roomKey: string, message: string, scheduledAt: number) => {
    if (!userId) return;
    await notificationApi.scheduleChat(roomKey, userId, message, scheduledAt);
    refetchSchedules();
    setShowScheduleMessageModal(false);
  };

  const handleScheduleMail = async (
    recipients: string[],
    subject: string,
    body: string,
    scheduledAt: number,
  ) => {
    await notificationApi.scheduleEmail(recipients, subject, body, scheduledAt);
    refetchSchedules();
    setShowScheduleMailModal(false);
  };

  const scheduleForRoom = useMemo(() => {
    if (!selectedRoom) return [];
    return scheduledItems.filter((item) => item.roomKey === selectedRoom.roomKey);
  }, [scheduledItems, selectedRoom]);

  const lastMessageByRoom = useMemo(() => {
    const map: Record<string, ChatMessage | undefined> = {};
    Object.entries(messageMap).forEach(([roomKey, list]) => {
      if (list.length > 0) {
        map[roomKey] = list[list.length - 1];
      }
    });
    return map;
  }, [messageMap]);

  const currentMessages = selectedRoom ? messageMap[selectedRoom.roomKey] ?? [] : [];

  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl bg-white text-sm text-slate-500">
        채팅 기능을 사용하려면 먼저 로그인하세요.
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-64px)] min-h-[520px] gap-3 bg-slate-50 p-2 md:gap-4 md:p-4">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="h-full w-[80%] max-w-xs rounded-r-3xl bg-white shadow-xl">
            <SidebarPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedRoomKey={selectedRoom?.roomKey ?? null}
              onSelectRoom={(room) => {
                setSelectedRoomKey(room.roomKey);
                setIsSidebarOpen(false);
              }}
              friends={friends}
              incomingRequests={incomingRequests}
              outgoingRequests={outgoingRequests}
              blockedFriends={blockedFriends}
              rooms={rooms}
              roomsLoading={roomsLoading}
              lastMessages={lastMessageByRoom}
              presence={presence}
              onPresenceChange={handlePresenceChange}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequest={handleRejectRequest}
              onCancelRequest={handleCancelRequest}
              onStartDm={handleQuickDm}
              onBlockFriend={handleBlockFriend}
              onUnblockFriend={handleUnblockFriend}
              onOpenAddFriend={() => setShowAddFriendModal(true)}
            />
          </div>
          <button className="flex-1 bg-black/30" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      <aside className="hidden h-full w-[280px] flex-col rounded-3xl bg-white shadow-sm md:flex">
        <SidebarPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedRoomKey={selectedRoom?.roomKey ?? null}
          onSelectRoom={(room) => setSelectedRoomKey(room.roomKey)}
          friends={friends}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          blockedFriends={blockedFriends}
          rooms={rooms}
          roomsLoading={roomsLoading}
          lastMessages={lastMessageByRoom}
          presence={presence}
          onPresenceChange={handlePresenceChange}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onCancelRequest={handleCancelRequest}
          onStartDm={handleQuickDm}
          onBlockFriend={handleBlockFriend}
          onUnblockFriend={handleUnblockFriend}
          onOpenAddFriend={() => setShowAddFriendModal(true)}
        />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col rounded-3xl bg-white shadow-sm">
        <ChatHeader
          room={selectedRoom}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onLeaveRoom={() => selectedRoom && handleLeaveRoom(selectedRoom.roomKey)}
          onToggleMute={(muted) => selectedRoom && handleToggleMute(selectedRoom.roomKey, muted)}
        />

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-slate-50/80 px-3 py-3 sm:px-6 sm:py-4">
          {selectedRoom ? (
            currentMessages.length ? (
              currentMessages.map((message, idx) => {
                const previous = currentMessages[idx - 1];
                const showDivider =
                  !previous ||
                  new Date(previous.ts).toDateString() !== new Date(message.ts).toDateString();
                return (
                  <div key={message.id}>
                    {showDivider && <DateDivider label={format(new Date(message.ts), "PPP") } />}
                    <MessageBubble
                      message={message}
                      room={selectedRoom}
                      currentUserId={String(userId)}
                    />
                  </div>
                );
              })
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                아직 메시지가 없습니다.
              </div>
            )
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              채팅방을 선택해주세요.
            </div>
          )}
        </div>

        <MessageInput
          disabled={!selectedRoom}
          value={messageDraft}
          onChange={setMessageDraft}
          onSend={handleSendMessage}
          onOpenScheduleMessage={() => setShowScheduleMessageModal(true)}
          onOpenScheduleMail={() => setShowScheduleMailModal(true)}
        />
      </main>

      <aside className="hidden h-full w-[300px] flex-col rounded-3xl bg-white shadow-sm lg:flex">
        <ChatInfoPanel
          room={selectedRoom}
          scheduledItems={scheduleForRoom}
          onInviteMembers={handleInviteMembers}
          onLeaveRoom={() => selectedRoom && handleLeaveRoom(selectedRoom.roomKey)}
          onToggleMute={(muted) => selectedRoom && handleToggleMute(selectedRoom.roomKey, muted)}
          onScheduleMessage={(message, ts) => selectedRoom && handleScheduleMessage(selectedRoom.roomKey, message, ts)}
          onScheduleMail={() => setShowScheduleMailModal(true)}
          onCancelSchedule={(id) => notificationApi.cancel(id).then(() => refetchSchedules())}
        />
      </aside>

      <NotificationStack
        notifications={notifications}
        onSelect={(roomKey) => {
          setSelectedRoomKey(roomKey);
          setIsSidebarOpen(false);
        }}
      />

      <CreateDmModal
        open={showDmModal}
        friends={friends}
        onClose={() => setShowDmModal(false)}
        onCreate={handleCreateDm}
      />
      <CreateGroupModal
        open={showGroupModal}
        friends={friends}
        onClose={() => setShowGroupModal(false)}
        onCreate={handleCreateGroup}
      />
      <ScheduleMessageModal
        open={showScheduleMessageModal}
        roomName={selectedRoom?.name ?? "선택된 채팅방"}
        disabled={!selectedRoom}
        onClose={() => setShowScheduleMessageModal(false)}
        onSchedule={(message, ts) => selectedRoom && handleScheduleMessage(selectedRoom.roomKey, message, ts)}
      />
      <ScheduleMailModal
        open={showScheduleMailModal}
        onClose={() => setShowScheduleMailModal(false)}
        onSchedule={handleScheduleMail}
      />
      <AddFriendModal
        open={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onSubmit={async (targetId) => {                
          if (!userId) return;
          await friendApi.sendRequest(userId, targetId);
          refetchOutgoing();
          setShowAddFriendModal(false);
        }}
      />
    </div>
  );
};
type SidebarProps = {
  activeTab: "friends" | "chats";
  setActiveTab: (tab: "friends" | "chats") => void;
  selectedRoomKey: string | null;
  onSelectRoom: (room: ChatRoom) => void;
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  blockedFriends: Friend[];
  rooms: ChatRoom[];
  roomsLoading: boolean;
  lastMessages: Record<string, ChatMessage | undefined>;
  presence: PresenceStatus;
  onPresenceChange: (status: PresenceStatus) => void;
  onAcceptRequest: (fromUserId: number) => void;
  onRejectRequest: (fromUserId: number) => void;
  onCancelRequest: (targetUserId: number) => void;
  onStartDm: (friendId: number) => void;
  onBlockFriend: (friendId: number) => void;
  onUnblockFriend: (friendId: number) => void;
  onOpenAddFriend: () => void;
};

const SidebarPanel = ({
  activeTab,
  setActiveTab,
  selectedRoomKey,
  onSelectRoom,
  friends,
  incomingRequests,
  outgoingRequests,
  blockedFriends,
  rooms,
  roomsLoading,
  lastMessages,
  presence,
  onPresenceChange,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onStartDm,
  onBlockFriend,
  onUnblockFriend,
  onOpenAddFriend,
}: SidebarProps) => {
  return (
    <div className="flex h-full flex-col rounded-3xl bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="inline-flex gap-1 rounded-full bg-slate-100 p-1 text-xs font-medium">
          {(["friends", "chats"] as const).map((tab) => (
            <button
              key={tab}
              className={`rounded-full px-3 py-1 ${
                activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "friends" ? "친구" : "채팅"}
            </button>
          ))}
        </div>
        <button
          className="rounded-full bg-blue-50 p-2 text-blue-500 hover:bg-blue-100"
          title="친구 추가"
          onClick={onOpenAddFriend}
        >
          <UserPlus className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-slate-100 px-4 py-2">
        <input
          placeholder={activeTab === "friends" ? "친구 검색" : "채팅방 검색"}
          className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {activeTab === "friends" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold">나의 상태</span>
              <select
                value={presence}
                onChange={(e) => onPresenceChange(e.target.value as PresenceStatus)}
                className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                <option value="online">온라인</option>
                <option value="busy">자리비움</option>
                <option value="offline">오프라인</option>
              </select>
            </div>

            <section>
              <p className="mb-1 text-[11px] font-semibold text-slate-500">받은 친구 요청</p>
              <div className="space-y-2">
                {incomingRequests.length === 0 && (
                  <p className="text-[11px] text-slate-400">새로운 요청이 없습니다.</p>
                )}
                {incomingRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{req.requesterName}</p>
                      <p className="text-[10px] text-slate-400">
                        {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="rounded-full bg-emerald-50 p-1 text-emerald-500"
                        onClick={() => onAcceptRequest(req.requesterId)}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-full bg-rose-50 p-1 text-rose-500"
                        onClick={() => onRejectRequest(req.requesterId)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-1 text-[11px] font-semibold text-slate-500">보낸 요청</p>
              <div className="space-y-1">
                {outgoingRequests.length === 0 && (
                  <p className="text-[11px] text-slate-400">보낸 요청이 없습니다.</p>
                )}
                {outgoingRequests.map((req) => (
                  <div key={req.requestId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-slate-900">{req.receiverName}</p>
                      <p className="text-[10px] text-slate-400">대기 중</p>
                    </div>
                    <button
                      className="text-[11px] text-rose-500"
                      onClick={() => onCancelRequest(req.receiverId)}
                    >
                      취소
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-1 text-[11px] font-semibold text-slate-500">친구</p>
              <FriendList friends={friends} onStartDm={onStartDm} onBlock={onBlockFriend} />
            </section>

            <section>
              <p className="mb-1 text-[11px] font-semibold text-slate-500">차단됨</p>
              <BlockedFriendList friends={blockedFriends} onUnblock={onUnblockFriend} />
            </section>
          </div>
        ) : (
          <ChatRoomList
            rooms={rooms}
            selectedKey={selectedRoomKey}
            onSelect={onSelectRoom}
            loading={roomsLoading}
            lastMessages={lastMessages}
          />
        )}
      </div>
    </div>
  );
};
type FriendListProps = {
  friends: Friend[];
  onStartDm: (friendId: number) => void;
  onBlock: (friendId: number) => void;
};

const FriendList = ({ friends, onStartDm, onBlock }: FriendListProps) => {
  if (friends.length === 0) {
    return <p className="text-[11px] text-slate-400">친구가 없습니다.</p>;
  }
  return (
    <ul className="space-y-1 text-sm">
      {friends.map((friend) => (
        <li key={friend.id} className="group flex items-center justify-between rounded-2xl px-3 py-2 hover:bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 text-xs font-semibold text-white">
              {friend.name.slice(0, 2)}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                  friend.presence === "online"
                    ? "bg-emerald-400"
                    : friend.presence === "busy"
                    ? "bg-amber-400"
                    : "bg-slate-400"
                }`}
              />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-900">{friend.name}</p>
              <p className="text-[11px] text-slate-400">
                {friend.presence === "online"
                  ? "온라인"
                  : friend.presence === "busy"
                  ? "자리비움"
                  : "오프라인"}
              </p>
            </div>
          </div>
          <FriendContextMenu friendId={friend.id} onStartDm={onStartDm} onBlock={onBlock} />
        </li>
      ))}
    </ul>
  );
};

const FriendContextMenu = ({
  friendId,
  onStartDm,
  onBlock,
}: {
  friendId: number;
  onStartDm: (id: number) => void;
  onBlock: (id: number) => void;
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleClick = () => setOpen(false);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [open]);

  const handleToggle = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleAction = (action: () => void) => (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    action();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={handleToggle}>
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-10 mt-1 w-40 rounded-2xl border border-slate-100 bg-white p-1 text-left shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-50"
            onClick={handleAction(() => onStartDm(friendId))}
          >
            1:1 채팅 만들기
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-[12px] text-rose-500 hover:bg-rose-50"
            onClick={handleAction(() => onBlock(friendId))}
          >
            친구 차단
          </button>
        </div>
      )}
    </div>
  );
};

const BlockedFriendList = ({
  friends,
  onUnblock,
}: {
  friends: Friend[];
  onUnblock: (id: number) => void;
}) => {
  if (friends.length === 0) {
    return <p className="text-[11px] text-slate-400">차단된 친구가 없습니다.</p>;
  }
  return (
    <ul className="space-y-1 text-sm">
      {friends.map((friend) => (
        <li key={friend.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
          <p className="text-[13px] font-medium text-slate-900">{friend.name}</p>
          <button className="text-[11px] text-blue-500" onClick={() => onUnblock(friend.id)}>
            차단 해제
          </button>
        </li>
      ))}
    </ul>
  );
};

const ChatRoomList = ({
  rooms,
  selectedKey,
  onSelect,
  loading,
  lastMessages,
}: {
  rooms: ChatRoom[];
  selectedKey: string | null;
  onSelect: (room: ChatRoom) => void;
  loading: boolean;
  lastMessages: Record<string, ChatMessage | undefined>;
}) => {
  if (loading) {
    return <p className="text-[11px] text-slate-400">채팅방을 불러오는 중...</p>;
  }
  if (rooms.length === 0) {
    return <p className="text-[11px] text-slate-400">참여 중인 채팅방이 없습니다.</p>;
  }
  return (
    <ul className="space-y-1 text-sm">
      {rooms.map((room) => {
        const active = selectedKey === room.roomKey;
        const preview = lastMessages[room.roomKey]?.content ?? "대화 시작하기";
        return (
          <li key={room.roomKey}>
            <button
              className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left ${
                active ? "border-blue-300 bg-blue-50" : "border-transparent hover:border-slate-100"
              }`}
              onClick={() => onSelect(room)}
            >
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{room.name}</p>
                <p className="text-[11px] text-slate-400">{preview}</p>
              </div>
              {room.unread > 0 && (
                <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] text-white">
                  {room.unread}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
type ChatHeaderProps = {
  room: ChatRoom | null;
  onOpenSidebar: () => void;
  onLeaveRoom: () => void;
  onToggleMute: (muted: boolean) => void;
};

const ChatHeader = ({ room, onOpenSidebar, onLeaveRoom, onToggleMute }: ChatHeaderProps) => {
  if (!room) {
    return (
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">채팅</p>
          <p className="text-[11px] text-slate-400">채팅방을 선택해주세요.</p>
        </div>
        <button className="rounded-full p-2 text-slate-500 md:hidden" onClick={onOpenSidebar}>
          <Menu className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{room.name}</p>
        <p className="text-[11px] text-slate-400">
          {room.type === "group" ? `${room.members.length}명 참여` : "1:1 대화"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          onClick={() => onToggleMute(!room.muted)}
          title={room.muted ? "알림 켜기" : "알림 끄기"}
        >
          {room.muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </button>
        <button
          className="rounded-full bg-slate-100 p-2 text-rose-500 hover:bg-slate-200"
          onClick={onLeaveRoom}
          title="채팅방 나가기"
        >
          <PhoneOff className="h-4 w-4" />
        </button>
        <button className="rounded-full p-2 text-slate-500 md:hidden" onClick={onOpenSidebar}>
          <Menu className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
const DateDivider = ({ label }: { label: string }) => (
  <div className="my-2 flex items-center gap-2 text-[11px] text-slate-400">
    <span className="h-px flex-1 bg-slate-200" />
    {label}
    <span className="h-px flex-1 bg-slate-200" />
  </div>
);
type MessageBubbleProps = {
  message: ChatMessage;
  room: ChatRoom;
  currentUserId: string;
};

const MessageBubble = ({ message, room, currentUserId }: MessageBubbleProps) => {
  const isMine = message.authorId === currentUserId;
  const authorName = isMine
    ? "나"
    : room.members.find((member) => String(member.userId) === message.authorId)?.name ??
      "시스템";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] space-y-1 text-sm ${isMine ? "text-right" : "text-left"}`}>
        {!isMine && <p className="text-[11px] text-slate-400">{authorName}</p>}
        <div
          className={`inline-block rounded-2xl px-4 py-2 text-sm ${
            isMine ? "bg-blue-500 text-white" : "bg-white text-slate-900 shadow"
          }`}
        >
          {message.content}
          {message.scheduled && (
            <span className="ml-2 rounded-full bg-white/30 px-2 py-0.5 text-[10px]">
              예약
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-400">{formatTimestamp(message.ts)}</p>
      </div>
    </div>
  );
};
type MessageInputProps = {
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onOpenScheduleMessage: () => void;
  onOpenScheduleMail: () => void;
};

const MessageInput = ({
  disabled,
  value,
  onChange,
  onSend,
  onOpenScheduleMessage,
  onOpenScheduleMail,
}: MessageInputProps) => {
  return (
    <div className="border-t border-slate-100 px-4 py-3">
      <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${disabled ? "bg-slate-50" : "bg-white"}`}>
        <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100" disabled={disabled}>
          <Paperclip className="h-5 w-5" />
        </button>
        <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100" disabled={disabled}>
          <Smile className="h-5 w-5" />
        </button>
        <button
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
          disabled={disabled}
          onClick={onOpenScheduleMessage}
        >
          <Clock className="h-5 w-5" />
        </button>
        <button
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
          disabled={disabled}
          onClick={onOpenScheduleMail}
        >
          <Mail className="h-5 w-5" />
        </button>
        <input
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={disabled ? "채팅방을 선택하면 메시지를 보낼 수 있어요." : "메시지를 입력하세요."}
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-slate-200"
          disabled={disabled || !value.trim()}
          onClick={onSend}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
type ChatInfoPanelProps = {
  room: ChatRoom | null;
  scheduledItems: ScheduledItem[];
  onInviteMembers: (roomKey: string, memberIds: number[]) => void;
  onLeaveRoom: () => void;
  onToggleMute: (muted: boolean) => void;
  onScheduleMessage: (message: string, scheduledAt: number) => void;
  onScheduleMail: () => void;
  onCancelSchedule: (id: number) => void;
};

const ChatInfoPanel = ({
  room,
  scheduledItems,
  onInviteMembers,
  onLeaveRoom,
  onToggleMute,
  onScheduleMessage,
  onScheduleMail,
  onCancelSchedule,
}: ChatInfoPanelProps) => {
  const [inviteInput, setInviteInput] = useState("");
  const [scheduleText, setScheduleText] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  if (!room) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
        채팅 정보를 보려면 채팅방을 선택하세요.
      </div>
    );
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    const ids = inviteInput
      .split(/[,\s]+/)
      .map((part) => Number(part))
      .filter((id) => Number.isFinite(id));
    if (ids.length) {
      onInviteMembers(room.roomKey, ids);
      setInviteInput("");
    }
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleText.trim() || !scheduleTime) return;
    const ts = Date.parse(scheduleTime);
    if (!Number.isFinite(ts)) return;
    onScheduleMessage(scheduleText.trim(), ts);
    setScheduleText("");
    setScheduleTime("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">채팅 정보</p>
        <p className="text-[11px] text-slate-400">{room.name}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-xs">
        <section>
          <p className="mb-2 text-[11px] font-semibold text-slate-500">참여자</p>
          <div className="space-y-1">
            {room.members.map((member) => (
              <div key={member.userId} className="flex items-center justify-between rounded-xl bg-slate-50 px-2 py-1.5">
                <span className="text-[12px] text-slate-700">{member.name}</span>
                {member.admin && <span className="text-[10px] text-blue-500">방장</span>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold text-slate-500">초대</p>
          <form onSubmit={handleInvite} className="space-y-2">
            <input
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="쉼표로 구분된 회원 ID"
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] focus:border-blue-400 focus:outline-none"
            />
            <button className="w-full rounded-xl bg-slate-900 py-1.5 text-[11px] text-white" type="submit">
              초대하기
            </button>
          </form>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold text-slate-500">알림 / 제어</p>
          <div className="space-y-1">
            <button
              className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-2 py-1.5"
              onClick={() => onToggleMute(!room.muted)}
            >
              <span className="text-[12px] text-slate-700">알림 {room.muted ? "켜기" : "끄기"}</span>
              {room.muted ? (
                <BellOff className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Bell className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>
            <button
              className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-2 py-1.5"
              onClick={onLeaveRoom}
            >
              <span className="text-[12px] text-slate-700">채팅방 나가기</span>
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            </button>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold text-slate-500">예약 메시지</p>
          <form onSubmit={handleSchedule} className="space-y-2">
            <textarea
              value={scheduleText}
              onChange={(e) => setScheduleText(e.target.value)}
              placeholder="보낼 메시지"
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] focus:border-blue-400 focus:outline-none"
              rows={2}
            />
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] focus:border-blue-400 focus:outline-none"
            />
            <button type="submit" className="w-full rounded-xl bg-blue-500 py-1.5 text-[11px] text-white">
              예약하기
            </button>
          </form>
          <div className="mt-2 space-y-1">
            {scheduledItems.length === 0 && (
              <p className="text-[11px] text-slate-400">예약된 메시지가 없습니다.</p>
            )}
            {scheduledItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-2 py-1.5">
                <div>
                  <p className="text-[11px] text-slate-700">{item.message}</p>
                  <p className="text-[10px] text-slate-400">
                    {format(new Date(item.scheduledAt), "MM/dd HH:mm")}
                  </p>
                </div>
                <button className="text-[10px] text-rose-500" onClick={() => onCancelSchedule(item.id)}>
                  취소
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold text-slate-500">예약 메일</p>
          <button className="w-full rounded-xl bg-slate-900 py-1.5 text-[11px] text-white" onClick={onScheduleMail}>
            메일 예약 만들기
          </button>
        </section>
      </div>
    </div>
  );
};
type NotificationStackProps = {
  notifications: NotificationToast[];
  onSelect: (roomKey: string) => void;
};

const NotificationStack = ({ notifications, onSelect }: NotificationStackProps) => {
  if (notifications.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-40 space-y-2">
      {notifications.slice(-3).map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex max-w-xs items-start justify-between rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur"
        >
          <div className="pr-3">
            <p className="text-xs font-semibold text-slate-900">{toast.roomName}</p>
            <p className="text-[11px] text-slate-500">{toast.preview}</p>
          </div>
          <button
            className="text-[11px] text-blue-500"
            onClick={() => onSelect(toast.roomKey)}
          >
            보기
          </button>
        </div>
      ))}
    </div>
  );
};
type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const Modal = ({ open, title, onClose, children }: ModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <button className="text-slate-400" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
type AddFriendModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (targetId: number) => void;
};

const AddFriendModal = ({ open, onClose, onSubmit }: AddFriendModalProps) => {
  const [value, setValue] = useState("");
  return (
    <Modal open={open} title="친구 요청 보내기" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const targetId = Number(value);
          if (Number.isFinite(targetId)) {
            onSubmit(targetId);
            setValue("");
          }
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="상대 회원 ID"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <button className="w-full rounded-2xl bg-blue-500 py-2 text-sm text-white" type="submit">
          요청 보내기
        </button>
      </form>
    </Modal>
  );
};
type CreateDmModalProps = {
  open: boolean;
  onClose: () => void;
  friends: Friend[];
  onCreate: (friendId: number) => void;
};

const CreateDmModal = ({ open, onClose, friends, onCreate }: CreateDmModalProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <Modal open={open} title="1:1 채팅 만들기" onClose={onClose}>
      <div className="space-y-3">
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {friends.length === 0 && (
            <p className="text-[12px] text-slate-400">친구가 없습니다.</p>
          )}
          {friends.map((friend) => (
            <label key={friend.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <input
                type="radio"
                name="dm"
                value={friend.id}
                checked={selected === friend.id}
                onChange={() => setSelected(friend.id)}
              />
              {friend.name}
            </label>
          ))}
        </div>
        <button
          className="w-full rounded-2xl bg-blue-500 py-2 text-sm text-white disabled:bg-slate-200"
          disabled={!selected}
          onClick={() => {
            if (selected) onCreate(selected);
          }}
        >
          생성
        </button>
      </div>
    </Modal>
  );
};
type CreateGroupModalProps = {
  open: boolean;
  onClose: () => void;
  friends: Friend[];
  onCreate: (name: string, memberIds: number[]) => void;
};

const CreateGroupModal = ({ open, onClose, friends, onCreate }: CreateGroupModalProps) => {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Modal open={open} title="그룹 채팅 만들기" onClose={() => {
      setSelected(new Set());
      onClose();
    }}>
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="채팅방 이름"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-slate-100 p-2">
          {friends.map((friend) => (
            <label key={friend.id} className="flex items-center gap-2 rounded-xl px-2 py-1 text-sm hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selected.has(friend.id)}
                onChange={() => toggle(friend.id)}
              />
              {friend.name}
            </label>
          ))}
        </div>
        <button
          className="w-full rounded-2xl bg-blue-500 py-2 text-sm text-white disabled:bg-slate-200"
          disabled={!name.trim() || selected.size === 0}
          onClick={() => {
            if (name.trim() && selected.size > 0) {
              onCreate(name.trim(), Array.from(selected));
              setName("");
              setSelected(new Set());
            }
          }}
        >
          생성
        </button>
      </div>
    </Modal>
  );
};
type ScheduleMessageModalProps = {
  open: boolean;
  onClose: () => void;
  roomName: string;
  disabled: boolean;
  onSchedule: (message: string, scheduledAt: number) => void;
};

const ScheduleMessageModal = ({ open, onClose, roomName, disabled, onSchedule }: ScheduleMessageModalProps) => {
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  return (
    <Modal open={open} title={`예약 메시지 · ${roomName}`} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (disabled || !text.trim() || !time) return;
          const ts = Date.parse(time);
          if (!Number.isFinite(ts)) return;
          onSchedule(text.trim(), ts);
          setText("");
          setTime("");
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          rows={3}
          disabled={disabled}
        />
        <input
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          disabled={disabled}
        />
        <button
          className="w-full rounded-2xl bg-blue-500 py-2 text-sm text-white disabled:bg-slate-200"
          type="submit"
          disabled={disabled || !text.trim() || !time}
        >
          예약하기
        </button>
      </form>
    </Modal>
  );
};
type ScheduleMailModalProps = {
  open: boolean;
  onClose: () => void;
  onSchedule: (recipients: string[], subject: string, body: string, scheduledAt: number) => void;
};

const ScheduleMailModal = ({ open, onClose, onSchedule }: ScheduleMailModalProps) => {
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [time, setTime] = useState("");

  return (
    <Modal open={open} title="예약 메일 만들기" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const emails = recipients
            .split(/[,\s]+/)
            .map((value) => value.trim())
            .filter(Boolean);
          if (!emails.length || !subject.trim() || !body.trim() || !time) return;
          const ts = Date.parse(time);
          if (!Number.isFinite(ts)) return;
          onSchedule(emails, subject.trim(), body.trim(), ts);
          setRecipients("");
          setSubject("");
          setBody("");
          setTime("");
        }}
      >
        <input
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          placeholder="수신자 이메일 (쉼표 구분)"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="제목"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="내용"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          rows={4}
        />
        <input
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <button
          className="w-full rounded-2xl bg-blue-500 py-2 text-sm text-white disabled:bg-slate-200"
          type="submit"
          disabled={!recipients || !subject.trim() || !body.trim() || !time}
        >
          예약하기
        </button>
      </form>
    </Modal>
  );
};
type FloatingItem = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

export const FloatingActionMenu = ({
  open,
  onToggle,
  items,
}: {
  open: boolean;
  onToggle: () => void;
  items: FloatingItem[];
}) => {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="pointer-events-auto mb-2 flex flex-col items-end gap-2">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1.5 text-[11px] text-slate-50 shadow-lg hover:bg-slate-900"
            >
              <span>{item.label}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800">
                {item.icon}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={onToggle}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-500"
      >
        {open ? <Slash className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
  );
};

export default Chat;

