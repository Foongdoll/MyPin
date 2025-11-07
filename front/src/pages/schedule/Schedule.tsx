import { useCallback, useEffect } from "react";
import useSchedule from "../../features/schedule/useSchedule";
import Calendar from "../../shared/lib/calendar/Calendar";
import "../../shared/styles/Schedule.css";
import type { TabsType } from "../../shared/types/ScheduleType";

const Schedule = () => {
  const { date, setDate, tabs, setTabs, selectedSchedule, setSelectedSchedule } = useSchedule();
  const handleTabs = useCallback((i: TabsType) => {
    setTabs((prev) =>
      prev.map((tab) => ({
        ...tab,
        isActive: tab.label === i.label
      }))
    )
  }, []);

  useEffect(() => {

  }, [selectedSchedule])


  

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-3">
      <div className="flex flex-1 w-full flex-col lg:flex-row gap-5">
        {/* 왼쪽 캘린더 */}
        <div className="flex-1 rounded-xl mb-5 lg:mb-0 h-[90%]">
          <Calendar
            value={date ?? undefined}
            onChange={setDate}
            weekStartsOn={0}
            className="h-full"
          />
        </div>

        {/* 오른쪽 탭 + 콘텐츠 */}
        <div className="bg-white shadow flex flex-col flex-2 rounded-xl p-3 gap-5 h-[90%]">
          {/* 탭 버튼 영역 */}
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

          {/* 탭 콘텐츠 */}
          {tabs.map((e) => {
            if (!e.isActive) return null;

            switch (e.label) {
              case "다가오는 일정":
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
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`flex flex-col h-full md:flex-row items-start md:items-center gap-1 md:gap-0 border-b border-slate-200 last:border-none px-3 py-2 md:py-3 cursor-pointer ${selectedSchedule && n === selectedSchedule.no ? "bg-blue-100" : ""}`}
                          onClick={e => setSelectedSchedule({ no: n, title: "테스트" + n, endDate: new Date(), participant: [""], startDate: new Date() })}
                        >
                          <span className="w-full md:w-[10%] font-semibold md:font-normal text-blue-700">{n}</span>
                          <span className="w-full md:w-[20%]">안녕</span>
                          <span className="w-full md:w-[30%] text-slate-600 truncate ">2025.11.08 ~ 2025.11.09</span>
                          <span className="w-full md:w-[20%] text-slate-700">우동, 희둥</span>
                          <span className="w-full md:w-[20%] text-slate-500">데이뚜</span>
                        </div>
                      ))}
                      <div className="py-3 text-slate-400">( 1 2 3 4 5 )</div>
                    </div>
                  </div>
                );

              case "일정 등록":
                return <div className="p-3 text-lg">일정 등록 폼</div>;

              default:
                return <div>활성화된 탭이 없음(에러)</div>;
            }
          })}
        </div>
      </div>

      {/* 하단 두 영역 */}
      <div className="flex flex-col lg:flex-row h-auto lg:h-[38%] gap-5 mt-0 w-full">
        <div className="flex-1 p-3 rounded-xl bg-white">
          장소
          { }
        </div>
        <div className="flex-1 p-3 rounded-xl">댓글, 좋아요 영역</div>
      </div>
    </div>
  );
};

export default Schedule;