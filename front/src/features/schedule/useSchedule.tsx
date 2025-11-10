import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ScheduleService from "./ScheduleService";
import type {
  Schedule,
  TabsType,
  ScheduleComment,
  ScheduleReactionState,
} from "../../shared/types/ScheduleType";
import { useSessionStore } from "../../state/session.store";

const DEFAULT_PAGE_SIZE = 5;

const toISODateLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const useSchedule = () => {
  const [date, setDate] = useState<Date | null>(new Date());
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [title, setTitle] = useState("");
  const [participant, setParticipant] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [place, setPlace] = useState("");
  const sessionUserName = useSessionStore((state) => state.user?.name ?? "익명");

  const [isFormView, setIsFormView] = useState(false);

  const [tabs, setTabs] = useState<TabsType[]>([
    { label: "진행중인 일정", value: "list", isActive: true },
    { label: "일정 등록", value: "create", isActive: false },
  ]);

  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const [scheduleComments, setScheduleComments] = useState<Record<number, ScheduleComment[]>>({});
  const [scheduleReactions, setScheduleReactions] = useState<Record<number, ScheduleReactionState>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [commentAuthor, setCommentAuthor] = useState(sessionUserName);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isMutatingLike, setIsMutatingLike] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const derivedTotal = totalCount || scheduleList.length || 1;
  const totalPages = Math.max(1, Math.ceil(derivedTotal / pageSize));
  const startIdx = (page - 1) * pageSize;
  const paged = useMemo(() => scheduleList, [scheduleList]);

  const refreshSchedules = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const startDateKey = useMemo(() => toISODateLocal(startDate), [startDate]);
  const startDateKeyRef = useRef(startDateKey);

  useEffect(() => {
    setCommentAuthor(sessionUserName);
  }, [sessionUserName]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (startDateKey !== startDateKeyRef.current) {
      startDateKeyRef.current = startDateKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    let cancelled = false;
    const fetchSchedules = async () => {
      setIsLoadingSchedules(true);
      setApiError(null);

      try {
        const response = await ScheduleService.fetchSchedules({ page, pageSize, date: startDateKey });
        if (cancelled) return;

        const items = response.items ?? [];
        setScheduleList(items);
        setTotalCount(response.total ?? items.length ?? 0);

        if (typeof response.page === "number" && response.page !== page) {
          setPage(response.page);
        }
        if (typeof response.pageSize === "number" && response.pageSize !== pageSize) {
          setPageSize(response.pageSize);
        }
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setApiError(error instanceof Error ? error.message : "일정을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsLoadingSchedules(false);
        }
      }
    };

    fetchSchedules();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, reloadToken, startDateKey]);

  useEffect(() => {
    if (!scheduleList.length) {
      setSelectedSchedule(null);
      return;
    }

    if (selectedSchedule) {
      const matched = scheduleList.find((item) => item.no === selectedSchedule.no);
      if (matched) {
        if (matched !== selectedSchedule) {
          setSelectedSchedule(matched);
        }
        return;
      }
    }

    setSelectedSchedule(scheduleList[0]);
  }, [scheduleList, selectedSchedule?.no]);

  useEffect(() => {
    setCommentDraft("");
  }, [selectedSchedule?.no]);

  useEffect(() => {
    const targetNo = selectedSchedule?.no;
    if (!targetNo) {
      setIsLoadingComments(false);
      return;
    }

    let cancelled = false;
    setIsLoadingComments(true);

    Promise.all([
      ScheduleService.fetchScheduleComments(targetNo),
      ScheduleService.fetchScheduleReaction(targetNo),
    ])
      .then(([comments, reaction]) => {
        if (cancelled) return;

        setScheduleComments((prev) => ({
          ...prev,
          [targetNo]: comments ?? [],
        }));

        if (reaction) {
          setScheduleReactions((prev) => ({
            ...prev,
            [targetNo]: reaction,
          }));
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingComments(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSchedule?.no]);

  const handleTabs = useCallback((tab: TabsType) => {
    setTabs((prev) =>
      prev.map((item) => ({
        ...item,
        isActive: item.value === tab.value,
      }))
    );
    setIsFormView(tab.value === "create");
  }, []);

  const toggleLike = useCallback(async (scheduleNo?: number | null) => {
    if (!scheduleNo) return;

    setIsMutatingLike(true);
    try {
      const reaction = await ScheduleService.toggleScheduleLike(scheduleNo);
      if (reaction) {
        setScheduleReactions((prev) => ({
          ...prev,
          [scheduleNo]: reaction,
        }));
      }
    } catch (error) {
      console.error(error);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    } finally {
      setIsMutatingLike(false);
    }
  }, []);

  const addComment = useCallback(
    async (scheduleNo: number | null | undefined, author: string, content: string) => {
      if (!scheduleNo) return;
      const trimmedContent = content.trim();
      if (!trimmedContent) return;
      const trimmedAuthor = author.trim() || "익명";

      setIsSubmittingComment(true);
      try {
        const newComment = await ScheduleService.addScheduleComment(scheduleNo, {
          author: trimmedAuthor,
          content: trimmedContent,
        });

        if (newComment) {
          setScheduleComments((prev) => ({
            ...prev,
            [scheduleNo]: [newComment, ...(prev[scheduleNo] ?? [])],
          }));
        }
        setCommentDraft("");
      } catch (error) {
        console.error(error);
        alert("댓글 등록 중 오류가 발생했습니다.");
      } finally {
        setIsSubmittingComment(false);
      }
    },
    []
  );

  const createSchedule = useCallback(async () => {
    if (!title.trim()) {
      alert("제목을 입력해 주세요.");
      return;
    }
    if (!startDate || !endDate) {
      alert("시작일과 종료일을 선택해 주세요.");
      return;
    }
    if (endDate.getTime() < startDate.getTime()) {
      alert("종료일이 시작일보다 빠를 수 없습니다.");
      return;
    }

    const sanitizedParticipants = participant.map((name) => name.trim()).filter(Boolean);

    setIsCreatingSchedule(true);
    try {
      const created = await ScheduleService.createSchedule({
        title: title.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        participant: sanitizedParticipants,
        memo: memo.trim() || undefined,
        place: place.trim() || undefined,
      });

      if (created) {
        setSelectedSchedule(created);
      }

      setTitle("");
      setParticipant([]);
      setMemo("");
      setPlace("");
      setStartDate(date ?? new Date());
      setEndDate(date ?? new Date());

      setIsFormView(false);
      setTabs((prev) => prev.map((tab) => ({ ...tab, isActive: tab.value === "list" })));
      setPage(1);
      refreshSchedules();
    } catch (error) {
      console.error(error);
      alert("일정 등록 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingSchedule(false);
    }
  }, [title, startDate, endDate, participant, memo, place, date, refreshSchedules]);

  const selectedScheduleComments = useMemo(
    () => (selectedSchedule?.no ? scheduleComments[selectedSchedule.no] ?? [] : []),
    [scheduleComments, selectedSchedule]
  );

  const selectedScheduleReactions = useMemo(
    () =>
      selectedSchedule?.no
        ? scheduleReactions[selectedSchedule.no] ?? { likes: 0, isLiked: false }
        : { likes: 0, isLiked: false },
    [scheduleReactions, selectedSchedule]
  );

  return {
    date,
    setDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    title,
    setTitle,
    participant,
    setParticipant,
    memo,
    setMemo,
    place,
    setPlace,
    tabs,
    setTabs,
    selectedSchedule,
    setSelectedSchedule,
    selectedScheduleComments,
    selectedScheduleReactions,
    handleTabs,
    toggleLike,
    addComment,
    isFormView,
    setIsFormView,
    scheduleList,
    scheduleComments,
    scheduleReactions,
    commentDraft,
    setCommentDraft,
    commentAuthor,
    setCommentAuthor,
    createSchedule,
    paged,
    startIdx,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount,
    isLoadingSchedules,
    isCreatingSchedule,
    isLoadingComments,
    isSubmittingComment,
    isMutatingLike,
    apiError,
    refreshSchedules,
  };
};

export default useSchedule;
