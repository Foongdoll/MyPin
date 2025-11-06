import useSchedule from "../../features/schedule/useSchedule";
import Calendar from "../../shared/lib/calendar/Calendar";

const Schedule = () => {
  const { date, setDate } = useSchedule();  
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-3">
      <div className="flex flex-1 w-full shadow-2xl bg-emerald-50">
        <div className="flex-1 flex-col p-5">
          <div className="flex h-[60%] gap-5">
            <div className="flex-3 rounded-xl">              
              <div className="h-full">
                <Calendar
                  value={date ?? undefined}
                  onChange={setDate}
                  weekStartsOn={0}
                  className="h-full" // 캘린더 래퍼를 부모 높이에 맞춤
                />
              </div>
            </div>

            <div className="bg-white shadow flex-1 rounded-xl p-3">
              
            </div>
          </div>
          <div className="flex h-[36%] gap-5 mt-5">
            <div className="border flex-1">
              최근에 조회한 일정
            </div>
            <div className="border flex-1">
              댓글,좋아요 영역
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;