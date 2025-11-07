import { useMemo, useState } from "react";
import type { Schedule, TabsType } from "../../shared/types/ScheduleType";

const useSchedule = () => {
    const [date, setDate] = useState<Date | null>(new Date());
    const [tabs, setTabs] = useState<TabsType[]>([{ label: "다가오는 일정", isActive: true }, { label: "일정 등록", isActive: false }]);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    return {
        date, setDate,
        tabs, setTabs,
        selectedSchedule, setSelectedSchedule
    }
}

export default useSchedule;