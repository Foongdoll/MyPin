import { type ReactNode, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSessionStore } from "../../state/session.store";

export const HttpProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const logoutSignal = useSessionStore((state) => state.logoutSignal);
  const lastHandledSignal = useRef<number | null>(null);

  useEffect(() => {
    if (!logoutSignal || logoutSignal === lastHandledSignal.current) {
      return;
    }
    lastHandledSignal.current = logoutSignal;

    if (location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [logoutSignal, location.pathname, navigate]);

  return <>{children}</>;
};
