import { createPortal } from "react-dom";
import type { ScheduleCreateFormProp } from "../../shared/types/ScheduleType";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import { useState } from "react";
import DaumPostcode from "../../shared/lib/daumPostCode/DaumPostCode";
import DaumPostcodeModal from "../../shared/lib/daumPostCode/DaumPostCode";
import { geocodeAddress } from "../../shared/lib/naverMaps/geocodeApi";

const ScheduleCreateForm = ({
  isFormView,
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
  createSchedule,
  isCreatingSchedule,
  handleTabs,
  isEditingSchedule,
  cancelEditing
}: ScheduleCreateFormProp) => {
  const [isPostVisible, setIsPostVisible] = useState<boolean>(false);
  const [u, setU] = useState<string>("");
  const handleClose = () => {
    cancelEditing();
    handleTabs({ label: "진행중인 일정", value: "list", isActive: true });
  };

  const [isFocus, setIsFocus] = useState<boolean>(false);
  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (u.trim()) setParticipant((prev) => [...prev, u.trim()]);
      setU("");
    }
  };

  return createPortal(
    <AnimatePresence>
      {isFormView && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          {/* 모달 카드 */}
          <motion.div
            className="relative w-[min(1200px,92vw)] max-h-[86vh] overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 p-6"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 아이콘 */}
            <button
              onClick={handleClose}
              aria-label="닫기"
              className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>

            {/* 폼 본문 */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">제목</label>
                <input
                  className="w-full rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="일정 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 flex flex-col">
                  <label className="text-sm font-medium text-slate-700">시작일</label>
                  <DatePicker
                    selected={startDate ?? undefined}
                    onChange={(d) => setStartDate(d as Date)}
                    className="w-full rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholderText="시작일을 선택하세요"
                    dateFormat="yyyy.MM.dd"
                    openToDate={date ?? undefined}
                    selectsStart
                    startDate={startDate ?? undefined}
                    endDate={endDate ?? undefined}
                  />
                </div>
                <div className="space-y-2 flex flex-col">
                  <label className="text-sm font-medium text-slate-700">종료일</label>
                  <DatePicker
                    selected={endDate ?? undefined}
                    onChange={(d) => setEndDate(d as Date | null)}
                    className="w-full rounded-lg border border-slate-200 p-3"
                    placeholderText="종료일을 선택하세요"
                    dateFormat="yyyy.MM.dd"
                    openToDate={endDate ?? startDate ?? date ?? undefined}
                    selectsEnd
                    startDate={startDate ?? undefined}
                    endDate={endDate ?? undefined}
                    minDate={startDate ?? undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">장소</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="장소를 입력하세요"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setIsPostVisible(true)}
                  >
                    장소등록
                  </button>
                </div>
                {/* ✅ 모달 포털 */}
                {isPostVisible && (
                  <DaumPostcodeModal
                    onSelect={(data) => {
                      setPlace(data.address);
                      console.log("위도:", data.lat, "경도:", data.lng);
                      setIsPostVisible(false);
                    }}
                    onClose={() => setIsPostVisible(false)}
                  />
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">참여자</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="참여자 이름 또는 이메일 입력"
                      onChange={(e) => setU(e.target.value)}
                      onFocus={() => { setIsFocus(true) }}
                      onBlur={() => { setIsFocus(false) }}
                      onKeyDown={(e) => {
                        isFocus && handleEnter(e)
                      }}
                      value={u}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-lg px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => {
                        if (u.trim()) setParticipant((prev) => [...prev, u.trim()]);
                        setU("");
                      }}
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {participant.map((i, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-sm"
                      >
                        {i}
                        <button
                          type="button"
                          onClick={() =>
                            setParticipant((prev) => prev.filter((_, index) => index !== idx))
                          }
                          className="text-indigo-500 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">메모</label>
                  <textarea
                    rows={5}
                    className="w-full rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y max-h-[40vh] overflow-auto"
                    placeholder="추가 메모를 입력하세요"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  {isEditingSchedule && (
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      onClick={cancelEditing}
                      disabled={isCreatingSchedule}
                    >
                      수정 취소
                    </button>
                  )}
                  <button
                    type="button"
                    className={`rounded-xl px-6 py-3 font-semibold text-white shadow bg-gradient-to-r from-indigo-500 to-violet-600 ${isCreatingSchedule ? "opacity-70 cursor-not-allowed" : "hover:opacity-95"
                      }`}
                    onClick={createSchedule}
                    disabled={isCreatingSchedule}
                  >
                    {isCreatingSchedule ? (isEditingSchedule ? "수정 중..." : "등록 중...") : isEditingSchedule ? "일정 수정" : "일정 등록"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ScheduleCreateForm;
