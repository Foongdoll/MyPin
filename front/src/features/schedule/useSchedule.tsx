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

const twoDigit = (value: number) => String(value).padStart(2, "0");
const toISODateLocal = (d: Date) =>
  `${d.getFullYear()}-${twoDigit(d.getMonth() + 1)}-${twoDigit(d.getDate())}`;
const toLocalDateTimeString = (d: Date) =>
  `${toISODateLocal(d)}T${twoDigit(d.getHours())}:${twoDigit(d.getMinutes())}:${twoDigit(d.getSeconds())}`;
const toDateOnly = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if ([year, month, day].some((segment) => Number.isNaN(segment))) {
    return new Date();
  }
  return new Date(year, month - 1, day);
};

const useSchedule = () => {
  const [date, setDate] = useState<Date | null>(new Date());
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [title, setTitle] = useState("");
  const [participant, setParticipant] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [place, setPlace] = useState("");
  const sessionUserName = useSessionStore((state) => state.user?.name ?? "?占쎈챸");

  const [isFormView, setIsFormView] = useState(false);

  const [tabs, setTabs] = useState<TabsType[]>([
    { label: "다가오는 일정", value: "list", isActive: true },
    { label: "일정 등록", value: "create", isActive: false },
  ]);

  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);

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
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
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

  const resetFormFields = useCallback(() => {
    setTitle("");
    setParticipant([]);
    setMemo("");
    setPlace("");
    setStartDate(date ?? new Date());
    setEndDate(date ?? new Date());
    setEditingScheduleId(null);
  }, [date]);

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
        setApiError(error instanceof Error ? error.message : "일정 조회중 에러가 발생했습니다.");
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
  }, [scheduleList, selectedSchedule]);

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
  }, [selectedSchedule?.no, selectedSchedule]);

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
      alert("좋아요 처리 중 에러가 발생하였습니다.");
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
        alert("댓글 추가 중 에러가 발생하였습니다.");
      } finally {
        setIsSubmittingComment(false);
      }
    },
    []
  );

  const beginEditingSchedule = useCallback(
    (schedule: Schedule | null) => {
      if (!schedule) return;
      setEditingScheduleId(schedule.no);
      setTitle(schedule.title);
      setParticipant([...(schedule.participant ?? [])]);
      setMemo(schedule.memo ?? "");
      setPlace(schedule.place ?? "");
      setStartDate(toDateOnly(schedule.startDate));
      setEndDate(toDateOnly(schedule.endDate));
      setTabs((prev) => prev.map((tab) => ({ ...tab, isActive: tab.value === "create" })));
      setIsFormView(true);
    },
    [setIsFormView, setTabs]
  );

  const cancelEditing = useCallback(() => {
    resetFormFields();
    setIsFormView(false);
  }, [resetFormFields, setIsFormView]);

  const createSchedule = useCallback(async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!startDate || !endDate) {
      alert("시작일과 종료일을 골라주세요.");
      return;
    }
    if (endDate.getTime() < startDate.getTime()) {
      alert("시작일보다 종료일이 더 빠를 수 없습니다.");
      return;
    }

    const sanitizedParticipants = participant.map((name) => name.trim()).filter(Boolean);

    setIsCreatingSchedule(true);
    try {            
      const payload = {
        title: title.trim(),
        startDate: toLocalDateTimeString(startDate),
        endDate: toLocalDateTimeString(endDate),
        participant: sanitizedParticipants,
        memo: memo.trim() || undefined,
        place: place.trim() || undefined,
      };

      const saved = editingScheduleId
        ? await ScheduleService.updateSchedule(editingScheduleId, payload)
        : await ScheduleService.createSchedule(payload);

      if (saved) {
        setScheduleList((prev) =>
          editingScheduleId ? prev.map((item) => (item.no === saved.no ? saved : item)) : prev
        );
        setSelectedSchedule(saved);
      }

      resetFormFields();
      setIsFormView(false);
      setTabs((prev) => prev.map((tab) => ({ ...tab, isActive: tab.value === "list" })));
      setPage(1);
      refreshSchedules();
    } catch (error) {
      console.error(error);
      alert(editingScheduleId ? "일정 수정에 실패하였습니다." : "일정 수정에 실패하였습니다.");
    } finally {
      setIsCreatingSchedule(false);
    }
  }, [
    title,
    startDate,
    endDate,
    participant,
    memo,
    place,
    editingScheduleId,
    resetFormFields,
    setIsFormView,
    setTabs,
    setPage,
    refreshSchedules,
  ]);

  const deleteSchedule = useCallback(
    async (scheduleNo: number | null | undefined) => {
      if (!scheduleNo) return;
      setIsDeletingSchedule(true);
      try {
        await ScheduleService.deleteSchedule(scheduleNo);
        setScheduleList((prev) => prev.filter((item) => item.no !== scheduleNo));
        if (selectedSchedule?.no === scheduleNo) {
          setSelectedSchedule(null);
        }
        resetFormFields();
        refreshSchedules();
      } catch (error) {
        console.error(error);
        alert("일정 삭제 중 오류가 발생했습니다.");
      } finally {
        setIsDeletingSchedule(false);
      }
    },
    [selectedSchedule?.no, refreshSchedules, resetFormFields]
  );

  const updateComment = useCallback(
    async (
      scheduleNo: number | null | undefined,
      commentId: string | number,
      content: string,
      author: string
    ) => {
      if (!scheduleNo || !commentId) return;
      const trimmedContent = content.trim();
      const trimmedAuthor = (author ?? "").trim();
      if (!trimmedContent || !trimmedAuthor) return;

      try {
        const updated = await ScheduleService.updateScheduleComment(scheduleNo, commentId, {
          author: trimmedAuthor,
          content: trimmedContent,
        });

        if (updated) {
          setScheduleComments((prev) => ({
            ...prev,
            [scheduleNo]: (prev[scheduleNo] ?? []).map((comment) =>
              comment.id === updated.id ? updated : comment
            ),
          }));
        }
      } catch (error) {
        console.error(error);
        alert("댓글 수정 중 오류가 발생했습니다.");
      }
    },
    []
  );

  const deleteComment = useCallback(
    async (scheduleNo: number | null | undefined, commentId: string | number, author: string) => {
      if (!scheduleNo || !commentId) return;
      const trimmedAuthor = (author ?? "").trim();
      if (!trimmedAuthor) return;

      try {
        await ScheduleService.deleteScheduleComment(scheduleNo, commentId, trimmedAuthor);
        setScheduleComments((prev) => ({
          ...prev,
          [scheduleNo]: (prev[scheduleNo] ?? []).filter((comment) => comment.id !== String(commentId)),
        }));
      } catch (error) {
        console.error(error);
        alert("댓글 삭제 중 오류가 발생했습니다.");
      }
    },
    []
  );
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
    editingScheduleId,
    beginEditingSchedule,
    cancelEditing,
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
    deleteSchedule,
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
    isDeletingSchedule,
    isLoadingComments,
    isSubmittingComment,
    isMutatingLike,
    apiError,
    refreshSchedules,
    updateComment,
    deleteComment,
  };
};

export default useSchedule;



