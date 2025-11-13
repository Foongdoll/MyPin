// Chat.tsx
import { useState } from "react";
import {  
  MoreVertical,
  Plus,
  Paperclip,
  Smile,
  Send,
  Clock,
  Mail,
  UserPlus,
  Trash2,
  Slash,
  PhoneOff,
  Menu,
} from "lucide-react";
import type { ChatRoom, Friend, Message } from "../../shared/types/ChatType";

const mockFriends: Friend[] = [
  { id: 1, name: "희둥", status: "online" },
  { id: 2, name: "동료 A", status: "busy" },
  { id: 3, name: "친구 B", status: "offline" },
];

const mockRooms: ChatRoom[] = [
  { id: 10, name: "희둥", type: "dm", lastMessage: "내일 송도 ㄱ?", unread: 2 },
  { id: 11, name: "개발자 스터디방", type: "group", lastMessage: "리뷰 올렸어요", unread: 0 },
];

const mockMessages: Message[] = [
  {
    id: 1,
    author: "other",
    name: "희둥",
    content: "오늘 송도 일정 어때? 😊",
    time: "오후 1:05",
    type: "text",
  },
  {
    id: 2,
    author: "me",
    content: "좋지! 숙소는 예약해놨어 🙌",
    time: "오후 1:06",
    type: "text",
  },
  {
    id: 3,
    author: "me",
    content: "[이미지 미리보기 자리]",
    time: "오후 1:06",
    type: "image",
  },
  {
    id: 4,
    author: "me",
    content: "내일 오전 9시에 자동으로 보내질 메시지입니다.",
    time: "예약 · 내일 오전 9:00",
    type: "text",
    scheduled: true,
  },
];

const Chat = () => {
  const [activeTab, setActiveTab] = useState<"friends" | "chats">("friends");
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(mockRooms[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    // 모바일에선 방 선택하면 사이드바 닫기
    setIsSidebarOpen(false);
  };

  return (
    <div className="relative flex h-[calc(100vh-64px)] min-h-[500px] gap-3 bg-slate-50 p-2 md:gap-4 md:p-4">
      {/* 모바일: 사이드바 오버레이 */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="h-full w-[80%] max-w-xs rounded-r-3xl bg-white shadow-xl">
            <SidebarPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedRoom={selectedRoom}
              onSelectRoom={handleSelectRoom}
            />
          </div>
          <button
            className="flex-1 bg-black/30"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

      {/* 데스크탑: 왼쪽 고정 패널 */}
      <aside className="hidden h-full w-[260px] flex-col rounded-3xl bg-white shadow-sm md:flex">
        <SidebarPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedRoom={selectedRoom}
          onSelectRoom={handleSelectRoom}
        />
      </aside>

      {/* 가운데: 채팅 영역 */}
      <main className="flex min-w-0 flex-1 flex-col rounded-3xl bg-white shadow-sm">
        <ChatHeader
          room={selectedRoom}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-slate-50/80 px-3 py-3 sm:px-6 sm:py-4">
          <DateDivider label="오늘" />
          {mockMessages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>

        <MessageInput />
      </main>

      {/* 오른쪽: 채팅 정보 & 예약 목록 (lg 이상에서만) */}
      <aside className="hidden h-full w-[260px] flex-col rounded-3xl bg-white shadow-sm lg:flex">
        <ChatInfoPanel room={selectedRoom} />
      </aside>
    </div>
  );
};

/* ----- 공통: 왼쪽 사이드바 패널 ----- */

type SidebarProps = {
  activeTab: "friends" | "chats";
  setActiveTab: (tab: "friends" | "chats") => void;
  selectedRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
};

const SidebarPanel = ({
  activeTab,
  setActiveTab,
  selectedRoom,
  onSelectRoom,
}: SidebarProps) => {
  return (
    <div className="flex h-full flex-col rounded-3xl bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="inline-flex gap-1 rounded-full bg-slate-100 p-1 text-xs font-medium">
          <button
            className={`rounded-full px-3 py-1 ${
              activeTab === "friends"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
            onClick={() => setActiveTab("friends")}
          >
            친구
          </button>
          <button
            className={`rounded-full px-3 py-1 ${
              activeTab === "chats"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
            onClick={() => setActiveTab("chats")}
          >
            채팅
          </button>
        </div>
        <button
          className="rounded-full bg-blue-50 p-2 text-blue-500 hover:bg-blue-100"
          title="친구 추가"
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

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {activeTab === "friends" ? (
          <FriendList friends={mockFriends} />
        ) : (
          <ChatRoomList
            rooms={mockRooms}
            selected={selectedRoom}
            onSelect={onSelectRoom}
          />
        )}
      </div>
    </div>
  );
};

/* ----- 왼쪽 패널: 친구/채팅 리스트 ----- */

const FriendList = ({ friends }: { friends: Friend[] }) => {
  return (
    <ul className="space-y-1 text-sm">
      {friends.map((f) => (
        <li
          key={f.id}
          className="group flex items-center justify-between rounded-2xl px-3 py-2 hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 text-xs font-semibold text-white">
              {f.name.slice(0, 2)}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                  f.status === "online"
                    ? "bg-emerald-400"
                    : f.status === "busy"
                    ? "bg-amber-400"
                    : "bg-slate-400"
                }`}
              />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-900">{f.name}</p>
              <p className="text-[11px] text-slate-400">
                {f.status === "online"
                  ? "온라인"
                  : f.status === "busy"
                  ? "자리 비움"
                  : "오프라인"}
              </p>
            </div>
          </div>
          <FriendContextMenu />
        </li>
      ))}
    </ul>
  );
};

const FriendContextMenu = () => {
  // 실제 드롭다운 로직은 나중에 구현
  return (
    <button className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
      <MoreVertical className="h-4 w-4" />
    </button>
  );
};

const ChatRoomList = ({
  rooms,
  selected,
  onSelect,
}: {
  rooms: ChatRoom[];
  selected: ChatRoom | null;
  onSelect: (room: ChatRoom) => void;
}) => {
  return (
    <ul className="space-y-1 text-sm">
      {rooms.map((r) => {
        const active = selected?.id === r.id;
        return (
          <li
            key={r.id}
            className={`flex cursor-pointer items-center justify-between rounded-2xl px-3 py-2 ${
              active ? "bg-blue-50" : "hover:bg-slate-50"
            }`}
            onClick={() => onSelect(r)}
          >
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[13px] font-medium text-slate-900">{r.name}</p>
                {r.type === "group" && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                    그룹
                  </span>
                )}
              </div>
              <p className="max-w-[160px] truncate text-[11px] text-slate-400">
                {r.lastMessage || "대화가 없습니다."}
              </p>
            </div>
            {r.unread > 0 && (
              <span className="ml-2 min-w-[20px] rounded-full bg-blue-500 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">
                {r.unread}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

/* ----- 채팅 헤더 / 메시지 / 입력 ----- */

const ChatHeader = ({
  room,
  onOpenSidebar,
}: {
  room: ChatRoom | null;
  onOpenSidebar?: () => void;
}) => {
  if (!room) {
    return (
      <div className="flex h-14 items-center justify-center border-b border-slate-100 text-sm text-slate-400">
        왼쪽에서 채팅방을 선택하세요.
      </div>
    );
  }

  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-100 px-3 sm:px-5">
      <div className="flex items-center gap-2">
        {/* 모바일에서 사이드바 토글 버튼 */}
        {onOpenSidebar && (
          <button
            className="mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 md:hidden"
            onClick={onOpenSidebar}
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{room.name}</p>
            {room.type === "group" && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                그룹 채팅
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {room.type === "group" ? "참여자 · 알림 · 고정 메시지" : "1:1 채팅"}
          </p>
        </div>
      </div>
      <div className="hidden items-center gap-2 text-xs md:flex">
        <button className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50">
          채팅방 나가기
        </button>
        <button className="rounded-full border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const DateDivider = ({ label }: { label: string }) => (
  <div className="my-2 flex items-center justify-center">
    <span className="h-px flex-1 bg-slate-200" />
    <span className="mx-3 rounded-full bg-slate-100 px-3 py-0.5 text-[11px] text-slate-500">
      {label}
    </span>
    <span className="h-px flex-1 bg-slate-200" />
  </div>
);

const MessageBubble = ({ message }: { message: Message }) => {
  const isMe = message.author === "me";
  const alignClass = isMe ? "items-end" : "items-start";
  const bubbleClass = isMe
    ? "rounded-2xl rounded-br-sm bg-blue-500 text-white"
    : "rounded-2xl rounded-bl-sm border border-slate-100 bg-white text-slate-900";

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} gap-1`}>
      {!isMe && message.name && (
        <span className="ml-2 text-[11px] font-medium text-slate-500">
          {message.name}
        </span>
      )}
      <div className={`flex max-w-[80%] flex-col ${alignClass}`}>
        <div className={`px-3 py-2 text-[13px] shadow-sm ${bubbleClass}`}>
          {message.type === "image" ? (
            <div className="flex h-36 w-52 items-center justify-center rounded-xl bg-slate-200 text-xs text-slate-600">
              이미지 미리보기
            </div>
          ) : message.type === "video" ? (
            <div className="flex h-36 w-52 items-center justify-center rounded-xl bg-slate-200 text-xs text-slate-600">
              동영상 미리보기
            </div>
          ) : (
            <span>{message.content}</span>
          )}
          {message.scheduled && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/10 px-2 py-0.5 text-[10px]">
              <Clock className="h-3 w-3" />
              예약 메시지
            </span>
          )}
        </div>
        <span className="mt-0.5 text-[10px] text-slate-400">{message.time}</span>
      </div>
    </div>
  );
};

const MessageInput = () => {
  return (
    <div className="border-t border-slate-100 px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-2 py-2 sm:px-3">
        <button
          className="rounded-full p-2 text-slate-500 hover:bg-slate-200"
          title="이모티콘"
        >
          <Smile className="h-5 w-5" />
        </button>
        <button
          className="rounded-full p-2 text-slate-500 hover:bg-slate-200"
          title="파일 첨부"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <button
          className="rounded-full p-2 text-slate-500 hover:bg-slate-200"
          title="예약 메시지"
        >
          <Clock className="h-5 w-5" />
        </button>
        <button
          className="rounded-full p-2 text-slate-500 hover:bg-slate-200"
          title="예약 메일"
        >
          <Mail className="h-5 w-5" />
        </button>

        <input
          placeholder="메시지를 입력하세요"
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />

        <button className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/* ----- 오른쪽 정보 패널 ----- */

const ChatInfoPanel = ({ room }: { room: ChatRoom | null }) => {
  if (!room) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
        채팅방 정보를 보려면 채팅을 선택하세요.
      </div>
    );
  }

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
            {/* TODO: 참여자 목록 렌더링 */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2 py-1.5">
              <span className="text-[12px] text-slate-700">희둥</span>
              <span className="text-[10px] text-slate-400">온라인</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2 py-1.5">
              <span className="text-[12px] text-slate-700">나</span>
              <span className="text-[10px] text-slate-400">나</span>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold text-slate-500">알림 / 기타</p>
          <div className="space-y-1">
            <button className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-2 py-1.5">
              <span className="text-[12px] text-slate-700">알림 끄기</span>
              <PhoneOff className="h-3.5 w-3.5 text-slate-400" />
            </button>
            <button className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-2 py-1.5">
              <span className="text-[12px] text-slate-700">채팅방 나가기</span>
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            </button>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold text-slate-500">예약된 메시지</p>
          <div className="space-y-1">
            {/* TODO: 예약 메시지/메일 목록 */}
            <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600">
              내일 오전 9시 · “회의 링크 보내기”
            </div>
            <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600">
              12/01 오전 10시 · 예약 메일: “월간 리포트”
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

/* ----- 공통 플로팅 메뉴 (다른 페이지에서도 재활용 가능) ----- */

type FloatingItem = {
  icon: React.ReactNode;
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
