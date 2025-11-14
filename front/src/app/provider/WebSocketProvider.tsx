import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type WsStatus = "connecting" | "open" | "closed" | "error";

export type WsMessage = {
  type: string;
  [key: string]: unknown;
};

type Listener = (msg: WsMessage) => void;

type WebSocketContextValue = {
  status: WsStatus;
  socket: WebSocket | null;
  /** JSON 메시지 전송 (연결 전이면 큐에 저장 후 연결 시 전송) */
  send: (msg: WsMessage) => void;
  /** raw string 전송이 필요하면 이걸 써도 됨 */
  sendRaw: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  /** 타입별 메시지 리스너 등록 */
  addListener: (type: string, listener: Listener) => void;
  removeListener: (type: string, listener: Listener) => void;
};

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

type Props = {
  children: ReactNode;
  /** 기본: import.meta.env.VITE_WS_URL 또는 ws://localhost:8080/ws */
  url?: string;
  /** JWT 같은 인증 토큰 붙이고 싶을 때 */
  token?: string | null;
};

const DEFAULT_RETRY_LIMIT = 5;

export const WebSocketProvider = ({
  children,
  url,
  token,
}: Props) => {
  const [status, setStatus] = useState<WsStatus>("connecting");
  const socketRef = useRef<WebSocket | null>(null);

  // 재연결 관련
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);

  // 연결 전 메시지 큐
  const pendingQueueRef = useRef<WsMessage[]>([]);

  // type -> listener set
  const listenersRef = useRef<Map<string, Set<Listener>>>(new Map());

  const resolveUrl = () => {
    const base =
      url || (import.meta as any).env?.VITE_WS_DEPLOY_URL;

    if (!token) return base;

    const hasQuery = base.includes("?");
    return `${base}${hasQuery ? "&" : "?"}token=${encodeURIComponent(token)}`;
  };

  const clearRetryTimeout = () => {
    if (retryTimeoutRef.current != null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const connect = useCallback(() => {
    clearRetryTimeout();

    const wsUrl = resolveUrl();
    setStatus("connecting");

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("연결됨");
        setStatus("open");
        retryCountRef.current = 0;

        // 연결 전에 쌓인 메시지 전송
        if (pendingQueueRef.current.length > 0) {
          for (const msg of pendingQueueRef.current) {
            socket.send(JSON.stringify(msg));
          }
          pendingQueueRef.current = [];
        }
      };

      socket.onmessage = (event) => {
        let parsed: WsMessage | null = null;

        try {
          parsed = JSON.parse(event.data);
        } catch {
          // JSON 형식이 아니면 무시하거나 별도 타입으로 던지고 싶으면 여기 수정
          return;
        }

        if (!parsed || typeof parsed.type !== "string") return;

        const listeners = listenersRef.current.get(parsed.type);
        if (!listeners || listeners.size === 0) return;

        listeners.forEach((listener) => {
          try {
            listener(parsed!);
          } catch (e) {
            console.error("WebSocket listener error", e);
          }
        });
      };

      socket.onerror = () => {
        setStatus("error");
      };

      socket.onclose = () => {
        socketRef.current = null;
        console.log("닫음");
        setStatus("closed");

        // 의도적으로 닫은 게 아니라면 재시도
        if (retryCountRef.current < DEFAULT_RETRY_LIMIT && navigator.onLine) {
          const retryDelay = Math.min(30000, 1000 * 2 ** retryCountRef.current); // 1s,2s,4s,...최대30s
          retryCountRef.current += 1;

          retryTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, retryDelay) as unknown as number;
        }
      };
    } catch (err) {
      console.error("WebSocket connect error", err);
      setStatus("error");
    }
  }, [url, token]);

  // 최초 연결 + 토큰 변경 시 재연결
  useEffect(() => {
    connect();

    return () => {
      clearRetryTimeout();
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // 온라인/오프라인 감지
  useEffect(() => {
    const handleOnline = () => {
      if (status === "closed" || status === "error") {
        connect();
      }
    };
    const handleOffline = () => {
      // 오프라인이면 그냥 상태만 표시
      setStatus("closed");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [connect, status]);

  // 간단한 heartbeat (옵션)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({ type: "ping", ts: Date.now() }),
        );
      }
    }, 30000);

    return () => window.clearInterval(id);
  }, []);

  const send = useCallback((msg: WsMessage) => {
    const socket = socketRef.current;
    const data = JSON.stringify(msg);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(data);
      return;
    }
    // 아직 연결 안 되었으면 큐에 저장
    pendingQueueRef.current.push(msg);
  }, []);

  const sendRaw = useCallback(
    (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      } else {
        console.warn("WebSocket not open; raw send skipped");
      }
    },
    [],
  );

  const addListener = useCallback((type: string, listener: Listener) => {
    const map = listenersRef.current;
    if (!map.has(type)) {
      map.set(type, new Set());
    }
    map.get(type)!.add(listener);
  }, []);

  const removeListener = useCallback((type: string, listener: Listener) => {
    const map = listenersRef.current;
    const set = map.get(type);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) {
      map.delete(type);
    }
  }, []);

  const value: WebSocketContextValue = {
    status,
    socket: socketRef.current,
    send,
    sendRaw,
    addListener,
    removeListener,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

/* ----- hook ----- */

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return ctx;
};

/** 특정 type 메시지만 쉽게 구독하는 헬퍼 */
export const useWsChannel = (type: string, handler: Listener) => {
  const { addListener, removeListener } = useWebSocket();

  useEffect(() => {
    addListener(type, handler);
    return () => {
      removeListener(type, handler);
    };
  }, [type, handler, addListener, removeListener]);
};
