import type { FormEvent } from "react";
import useSchedule from "../../features/schedule/useSchedule";
import Calendar from "../../shared/lib/calendar/Calendar";

import "react-datepicker/dist/react-datepicker.css";
import "../../shared/styles/Schedule.css";
import ScheduleCreateForm from "./ScheduleCreateForm";

const Schedule = () => {
  const {
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
    selectedSchedule,
    setSelectedSchedule,
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
    setCommentAuthor,
    createSchedule,
    paged,
    startIdx,
    page,
    setPage,
    totalPages,
    isLoadingSchedules,
    isCreatingSchedule,
    isLoadingComments,
    isSubmittingComment,
    isMutatingLike,
    apiError,
    refreshSchedules,
  } = useSchedule();

  const isCommentDisabled = !selectedSchedule || !commentDraft.trim() || isSubmittingComment;

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSchedule || isSubmittingComment) return;

    await addComment(selectedSchedule.no, commentAuthor, commentDraft);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-3">
      <div className="flex flex-1 w-full flex-col lg:flex-row gap-5">
        {/* 왼쪽 캘린더 */}
        <div className="flex-1 rounded-xl mb-5 lg:mb-0 h-[90%]">
          <Calendar value={startDate ?? undefined} onChange={setStartDate} weekStartsOn={0} className="h-full" />
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
                    className={`px-4 py-2 text-lg md:text-xl border-b-4 border-b-blue-700 rounded-2xl ${
                      i.isActive ? "schedule_tab_active_btn" : "schedule_tab_btn"
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
                  <div className="flex flex-col p-3 text-base md:text-lg lg:text-2xl">
                    {/* 헤더 */}
                    <div className="hidden md:flex bg-[#f0f6fa] font-semibold rounded-t-2xl">
                      <span className="w-[10%]">번호</span>
                      <span className="w-[20%]">제목</span>
                      <span className="w-[30%]">날짜</span>
                      <span className="w-[20%]">참여자</span>
                      <span className="w-[20%]">비고</span>
                    </div>

                    {/* 리스트 */}
                    <div className="flex flex-col h-120 bg-gradient-to-r from-[#faf6f6] via-[#f0fafc] to-[#e8f8fa] rounded-b-2xl">
                      <div className="h-full">
                        {isLoadingSchedules ? (
                          <div className="flex h-full items-center justify-center text-base text-slate-500">
                            일정을 불러오는 중입니다...
                          </div>
                        ) : paged.length > 0 ? (
                          paged.map((i, n) => {
                            const globalIndex = startIdx + n;
                            return (
                              <div
                                key={i.no ?? globalIndex}
                                className={`flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-0 border-b border-slate-200 last:border-none px-3 py-2 md:py-3 cursor-pointer ${
                                  selectedSchedule && i.no === selectedSchedule.no ? "bg-blue-100" : ""
                                }`}
                                onClick={() => setSelectedSchedule(i)}
                              >
                                <span className="w-full md:w-[10%] font-semibold md:font-normal text-blue-700">
                                  {globalIndex + 1}
                                </span>
                                <span className="w-full md:w-[20%] truncate">{i.title}</span>
                                <span className="w-full md:w-[30%] text-slate-600 truncate">
                                  {i.startDate + " ~ " + i.endDate}
                                </span>
                                <span className="w-full md:w-[20%] text-slate-700 truncate">
                                  {i.participant.join(", ")}
                                </span>
                                <span className="w-full md:w-[20%] text-slate-500 truncate">{i.memo}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-slate-400">
                            등록된 일정이 없습니다.
                          </div>
                        )}
                      </div>
                      </div>

                      {/* 간단 페이지 네비게이션 */}
                      <div className="flex items-center justify-center gap-3 py-3">
                        <button
                          className="px-3 py-1 rounded border"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                        >
                          이전
                        </button>
                        <span className="text-sm">
                          {page} / {totalPages}
                        </span>
                        <button
                          className="px-3 py-1 rounded border"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                        >
                          다음
                        </button>
                      </div>
                    </div>                  
                );

              case "create":
                return isFormView ? (
                  <ScheduleCreateForm
                    isFormView={isFormView}
                    setIsFormView={setIsFormView}
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
                </div>
                <div className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm">
                  좋아요 {selectedScheduleReactions.likes.toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm text-slate-600 md:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-400">장소</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {selectedSchedule.place ? selectedSchedule.place : "아직 등록되지 않았어요."}
                    {selectedSchedule.place && (<button type="button" className="float-right font-normal border-2 border-indigo-200 bg-indigo-300 hover:-translate-1 rounded-2xl p-2 text-sm">지도 열기</button>)}
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
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
                    : `총 ${selectedScheduleComments.length}개의 댓글`
                  : "일정을 먼저 선택해주세요."}
              </p>
            </div>
            <button
              type="button"
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                selectedScheduleReactions.isLiked
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

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {selectedSchedule ? (
              isLoadingComments ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                  댓글을 불러오는 중입니다...
                </div>
              ) : selectedScheduleComments.length > 0 ? (
                selectedScheduleComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-left shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800">{comment.author}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{comment.content}</p>
                  </div>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                  아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                </div>
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                우측 리스트에서 일정을 선택하면 댓글을 볼 수 있어요.
              </div>
            )}
          </div>

          <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1 text-sm text-slate-600">
              <label htmlFor="commentAuthor" className="text-xs font-semibold uppercase text-slate-500">
                작성자
              </label>
              <input
                id="commentAuthor"
                type="text"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                placeholder="이름 또는 닉네임"
                value={commentAuthor}
                onChange={(event) => setCommentAuthor(event.target.value)}
                disabled={!selectedSchedule || isSubmittingComment}
              />
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
              className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                isCommentDisabled ? "cursor-not-allowed bg-slate-300" : "bg-blue-500 hover:bg-blue-600"
              }`}
              disabled={isCommentDisabled}
            >
              {isSubmittingComment ? "등록 중..." : "댓글 남기기"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Schedule;
