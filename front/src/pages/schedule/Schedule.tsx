import { useEffect, useMemo, useState, type FormEvent } from "react";
import useSchedule from "../../features/schedule/useSchedule";
import Calendar from "../../shared/lib/calendar/Calendar";
import ScheduleService from "../../features/schedule/ScheduleService";
import "react-datepicker/dist/react-datepicker.css";
import "../../shared/styles/Schedule.css";
import ScheduleCreateForm from "./ScheduleCreateForm";
import { motion } from "framer-motion"
import ExpandedCommentTooltip from "./CommentTooltip";
import { useSessionStore } from "../../state/session.store";
import { LucideShare2, Map, MessageSquareShare, ScreenShare, Share } from "lucide-react";
import ScheduleMaps from "../../shared/lib/naverMaps/Maps";

const PAGE_BLOCK_SIZE = 5;

const pad = (value: number) => String(value).padStart(2, "0");

const Schedule = () => {
  const {
    date,
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
    commentDraft,
    setCommentDraft,
    commentAuthor,
    createSchedule,
    deleteSchedule,
    paged,
    startIdx,
    page,
    setPage,
    totalPages,
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
    isMapVisible,
    setIsMapVisible
  } = useSchedule();

  const sessionUser = useSessionStore((state) => state.user);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(startDate ?? new Date());
  const [calendarMarkedDays, setCalendarMarkedDays] = useState<Set<string>>(new Set());
  const [isCommentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [commentFocusId, setCommentFocusId] = useState<string | null>(null);
  const [commentAction, setCommentAction] = useState<{ type: "edit" | "delete"; id: string | number | null } | null>(null);

  const openCommentDrawer = (commentId: string) => {
    if (commentId !== '') {
      setCommentFocusId(commentId);
    }
    setCommentDrawerOpen(true);
  };
  const closeCommentDrawer = () => {
    setCommentDrawerOpen(false);
    setCommentFocusId(null);
  };

  useEffect(() => {
    if (!startDate) return;
    setCalendarViewDate((prev) => {
      if (!prev) return startDate;
      const sameMonth =
        prev.getFullYear() === startDate.getFullYear() && prev.getMonth() === startDate.getMonth();
      return sameMonth ? prev : startDate;
    });
  }, [startDate]);

  useEffect(() => {
    setCommentDrawerOpen(false);
    setCommentFocusId(null);
  }, [selectedSchedule?.no]);

  const calendarMonthKey = useMemo(
    () => `${calendarViewDate.getFullYear()}-${pad(calendarViewDate.getMonth() + 1)}`,
    [calendarViewDate]
  );

  const isEditingSchedule = Boolean(editingScheduleId);
  const isScheduleOwner = !!selectedSchedule && sessionUser?.uuid === selectedSchedule.ownerId;

  useEffect(() => {
    let cancelled = false;

    const fetchCalendarMarkers = async () => {
      try {
        const summary = await ScheduleService.fetchCalendarSummary(calendarMonthKey);
        if (cancelled) return;
        setCalendarMarkedDays(new Set(summary.days.map((day) => day.date)));
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setCalendarMarkedDays(new Set());
      }
    };

    fetchCalendarMarkers();

    return () => {
      cancelled = true;
    };
  }, [calendarMonthKey]);

  const paginationNumbers = useMemo(() => {
    const safeTotalPages = Math.max(1, totalPages);
    const blockIndex = Math.floor((page - 1) / PAGE_BLOCK_SIZE);
    const blockStart = blockIndex * PAGE_BLOCK_SIZE + 1;
    const blockEnd = Math.min(blockStart + PAGE_BLOCK_SIZE - 1, safeTotalPages);

    return Array.from({ length: blockEnd - blockStart + 1 }, (_, idx) => blockStart + idx);
  }, [page, totalPages]);

  const normalizedCommentAuthor = commentAuthor?.trim() ?? "";
  const isCommentDisabled =
    !selectedSchedule || !commentDraft.trim() || !normalizedCommentAuthor || isSubmittingComment;

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSchedule || isSubmittingComment) return;

    await addComment(selectedSchedule.no, normalizedCommentAuthor, commentDraft);
  };

  const handleScheduleEdit = () => {
    if (!selectedSchedule) return;
    beginEditingSchedule(selectedSchedule);
  };

  const handleScheduleDelete = async () => {
    if (!selectedSchedule) return;
    if (!window.confirm("정말 일정을 삭제하시겠어요?")) return;
    await deleteSchedule(selectedSchedule.no);
    closeCommentDrawer();
  };

  const handleCommentEdit = async (commentId: string, content: string) => {
    if (!selectedSchedule) return;
    setCommentAction({ type: "edit", id: commentId });
    try {
      await updateComment(selectedSchedule.no, commentId, content, normalizedCommentAuthor);
    } finally {
      setCommentAction(null);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!selectedSchedule) return;
    if (!window.confirm("댓글을 삭제하시겠어요?")) return;
    setCommentAction({ type: "delete", id: commentId });
    try {
      await deleteComment(selectedSchedule.no, commentId, normalizedCommentAuthor);
    } finally {
      setCommentAction(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-3">
      <div className="flex flex-1 w-full flex-col lg:flex-row gap-5">
        {/* 왼쪽 캘린더 */}
        <div className="flex-1 rounded-xl mb-5 lg:mb-0 h-[90%]">
          <Calendar
            value={startDate ?? undefined}
            onChange={setStartDate}
            weekStartsOn={0}
            className="h-full"
            markedDays={calendarMarkedDays}
            viewDate={calendarViewDate}
            onViewDateChange={setCalendarViewDate}
          />
        </div>

        {/* 오른쪽 탭 + 콘텐츠 */}
        <div className="bg-white shadow flex flex-col flex-2 rounded-xl p-3 gap-5 h-[90%]">
          {/* 탭/컨트롤 영역 */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {tabs.map((i) => (
                  <button
                    key={i.label}
                    className={`px-4 py-2 text-lg md:text-xl border-b-4 border-b-blue-700 rounded-2xl ${i.isActive ? "schedule_tab_active_btn" : "schedule_tab_btn"
                      }`}
                    onClick={() => handleTabs(i)}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-200 disabled:opacity-60"
                onClick={refreshSchedules}
                disabled={isLoadingSchedules}
              >
                {isLoadingSchedules ? "불러오는 중..." : "새로고침"}
              </button>
            </div>
            {apiError && <p className="text-left text-sm text-rose-500">{apiError}</p>}
          </div>
          {/* 탭 콘텐츠 */}
          {tabs.map((e) => {
            if (!e.isActive) return null;

            switch (e.value) {
              case "list":
                return (
                  <div className="w-full min-w-0">
                    {/* 상단 영역(탭/버튼 등)은 유지한다고 가정 */}

                    {/* 카드 컨테이너 */}
                    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden max-w-full">
                      {/* 카드 리스트 영역 */}
                      <div className="p-4">
                        {isLoadingSchedules ? (
                          <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                            일정을 불러오는 중입니다...
                          </div>
                        ) : paged.length > 0 ? (
                          <ul
                            className="
                  grid gap-4
                  sm:grid-cols-2
                  lg:grid-cols-3
                  xl:grid-cols-4
                "
                          >
                            {paged.map((i, n) => {
                              const globalIndex = startIdx + n;
                              const isActive = selectedSchedule && i.no === selectedSchedule.no;

                              return (
                                <li key={i.no ?? globalIndex} className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSchedule(i)}
                                    className={[
                                      "group w-full text-left rounded-2xl border px-4 py-4 transition",
                                      "border-slate-200 bg-white hover:shadow-md hover:border-blue-200",
                                      isActive ? "ring-2 ring-blue-400/60" : "ring-0",
                                    ].join(" ")}
                                  >
                                    {/* 상단 메타: 번호 + 날짜 */}
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="flex shrink-0 items-center justify-center h-7 w-7 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold">
                                        {globalIndex + 1}
                                      </span>
                                      <span className="ml-auto truncate text-xs text-slate-500">
                                        {i.startDate} ~ {i.endDate}
                                      </span>
                                    </div>

                                    {/* 제목 */}
                                    <h3 className="mt-3 text-base font-semibold text-slate-900 line-clamp-2 min-w-0">
                                      {i.title}
                                    </h3>

                                    {/* 참여자 */}
                                    {i?.participant?.length > 0 && (
                                      <p className="mt-2 text-sm text-slate-700 line-clamp-1">
                                        {Array.isArray(i.participant)
                                          ? i.participant.join(", ")
                                          : i.participant}
                                      </p>
                                    )}

                                    {/* 메모(비고) */}
                                    {i?.memo && (
                                      <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                                        {i.memo}
                                      </p>
                                    )}

                                    {/* 하단 뱃지/액션 라인 */}
                                    <div className="mt-4 flex items-center justify-between">
                                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                                        일정
                                      </span>
                                      <span className="text-xs text-blue-600 opacity-0 transition group-hover:opacity-100">
                                        <LucideShare2 />
                                      </span>
                                    </div>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                            등록된 일정이 없습니다.
                          </div>
                        )}
                      </div>

                      {/* 하단 페이징 */}
                      <div className="border-t border-slate-100 bg-white/90 px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                          >
                            이전
                          </button>

                          {paginationNumbers.map((pageNumber) => (
                            <button
                              key={pageNumber}
                              className={[
                                "h-8 w-8 rounded-full border text-sm font-semibold transition",
                                pageNumber === page
                                  ? "border-blue-500 bg-blue-500 text-white shadow-inner"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-600",
                              ].join(" ")}
                              onClick={() => setPage(pageNumber)}
                              aria-current={pageNumber === page ? "page" : undefined}
                            >
                              {pageNumber}
                            </button>
                          ))}

                          <button
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                          >
                            다음
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              case "create":
                return isFormView ? (
                  <ScheduleCreateForm
                    isFormView={isFormView}
                    date={date}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    title={title}
                    setTitle={setTitle}
                    participant={participant}
                    setParticipant={setParticipant}
                    memo={memo}
                    setMemo={setMemo}
                    place={place}
                    setPlace={setPlace}
                    createSchedule={createSchedule}
                    handleTabs={handleTabs}
                    isCreatingSchedule={isCreatingSchedule}
                    isEditingSchedule={isEditingSchedule}
                    cancelEditing={cancelEditing}
                  />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <button
                      className="text-4xl bg-indigo-200 p-5 rounded-2xl border-t-0 border-l-0 border-r-0 hover:-translate-1 hover:bg-blue-200 border-4 border-b-indigo-500"
                      onClick={() => {
                        setIsFormView((prev) => !prev);
                      }}
                      disabled={isCreatingSchedule}
                    >
                      등록 폼 다시 열기
                    </button>
                  </div>
                );
              default:
                return <div>활성화된 탭이 없음(에러)</div>;
            }
          })}
        </div>
      </div>


      {/* 하단 피드백 영역 */}
      <div className="flex w-full flex-col gap-5 lg:h-[38%] lg:flex-row">
        <div className="flex-1 rounded-2xl border border-slate-100 bg-gradient-to-br from-sky-50 via-white to-white p-6 shadow-sm">
          {selectedSchedule ? (
            <div className="flex h-full flex-col gap-6 text-left text-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">선택한 일정</p>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedSchedule.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedSchedule.startDate} ~ {selectedSchedule.endDate}
                  </p>
                  {selectedSchedule.ownerName && (
                    <p className="text-xs text-slate-400">작성자: {selectedSchedule.ownerName}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm">
                    좋아요 {selectedScheduleReactions.likes.toLocaleString()}
                  </div>
                  {isScheduleOwner && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600 transition"
                        onClick={handleScheduleEdit}
                      >
                        일정 수정
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                        onClick={() => void handleScheduleDelete()}
                        disabled={isDeletingSchedule}
                      >
                        {isDeletingSchedule ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm text-slate-600 md:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-400">장소</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {selectedSchedule.place ? selectedSchedule.place : "아직 등록되지 않았어요."}
                    {selectedSchedule.place && (<button type="button"
                      onClick={() => setIsMapVisible((prev) => !prev)} className="float-right font-normal border-2 border-indigo-200 bg-indigo-300 hover:-translate-1 rounded-2xl p-2 text-sm"><Map /></button>)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-400">참여자</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSchedule.participant.length > 0 ? (
                      selectedSchedule.participant.map((name, idx) => (
                        <span
                          key={`${name}-${idx}`}
                          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">등록된 인원이 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-inner">
                <p className="text-xs font-semibold uppercase text-slate-400">메모</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap break-words">
                  {selectedSchedule.memo ? selectedSchedule.memo : "추가 메모가 없습니다."}
                </p>

              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-500">
              <span className="text-3xl">🗂️</span>
              <p className="text-base font-semibold text-slate-700">일정을 아직 선택하지 않았어요.</p>
              <p className="text-sm text-slate-400">위쪽 리스트에서 일정을 클릭하면 세부 정보가 나타납니다.</p>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-lg font-semibold text-slate-900">댓글 & 좋아요</p>
              <p className="text-sm text-slate-500">
                {selectedSchedule
                  ? isLoadingComments
                    ? "댓글을 불러오는 중입니다..."
                    : (<>
                      총 {selectedScheduleComments.length}개의 댓글
                      <motion.button
                        key={'k'}
                        type="button"
                        onClick={() => openCommentDrawer("")}
                        className="
                          ml-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-left shadow-sm
                          transition
                          hover:shadow-md active:scale-[0.995] focus:outline-none focus:ring-2 focus:ring-emerald-300/60
                        "
                      >
                        댓글보기
                      </motion.button>
                    </>)
                  : "일정을 먼저 선택해주세요."}


              </p>

            </div>
            <button
              type="button"
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${selectedScheduleReactions.isLiked
                ? "border-blue-200 bg-blue-50 text-blue-600"
                : "border-slate-200 bg-slate-50 text-slate-600"
                } ${selectedSchedule ? "hover:-translate-y-0.5 hover:shadow" : "cursor-not-allowed opacity-50"}`}
              onClick={() => toggleLike(selectedSchedule?.no)}
              disabled={!selectedSchedule || isMutatingLike}
            >
              <span className="text-lg">{selectedScheduleReactions.isLiked ? "💙" : "🤍"}</span>
              <span className="text-sm font-semibold">
                좋아요 {selectedScheduleReactions.likes.toLocaleString()}
                {isMutatingLike && selectedSchedule ? " · 처리 중" : ""}
              </span>
            </button>
          </div>

          <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1 text-sm text-slate-600">
              <span className="text-xs font-semibold uppercase text-slate-500">작성자</span>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                {normalizedCommentAuthor || "로그인이 필요합니다"}
              </div>
            </div>
            <div className="flex flex-col gap-1 text-sm text-slate-600">
              <label htmlFor="commentContent" className="text-xs font-semibold uppercase text-slate-500">
                댓글
              </label>
              <textarea
                id="commentContent"
                className="h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                placeholder={
                  selectedSchedule
                    ? "일정에 대한 의견을 자유롭게 남겨주세요."
                    : "일정을 선택하면 댓글을 남길 수 있어요."
                }
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                disabled={!selectedSchedule || isSubmittingComment}
              />
            </div>
            <button
              type="submit"
              className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${isCommentDisabled ? "cursor-not-allowed bg-slate-300" : "bg-blue-500 hover:bg-blue-600"
                }`}
              disabled={isCommentDisabled}
            >
              {isSubmittingComment ? "등록 중..." : "댓글 남기기"}
            </button>
          </form>
        </div>
      </div>
      <ExpandedCommentTooltip
        open={isCommentDrawerOpen && selectedScheduleComments.length > 0}
        comments={selectedScheduleComments}
        focusedCommentId={commentFocusId ?? undefined}
        currentUser={normalizedCommentAuthor}
        onClose={closeCommentDrawer}
        onEdit={handleCommentEdit}
        onDelete={handleCommentDelete}
        pendingAction={commentAction}
      />

      {isMapVisible && <ScheduleMaps setVisible={setIsMapVisible} addr={selectedSchedule?.place || ''} />}
    </div>
  );
};

export default Schedule;
