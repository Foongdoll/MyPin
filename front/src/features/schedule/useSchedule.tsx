import { useState } from "react";

const useSchedule = () => {
    const [date, setDate] = useState<Date | null>(new Date());

    return {
        date, setDate
    }
}

export default useSchedule;