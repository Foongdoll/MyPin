export type ScheduleCreateFormProp = {
    isFormView: boolean;
    setIsFormView: React.Dispatch<React.SetStateAction<boolean>>;
    date: Date | null;
    startDate: Date | null;
    setStartDate: React.Dispatch<React.SetStateAction<Date>>;
    endDate: Date | null;
    setEndDate: React.Dispatch<React.SetStateAction<Date | null>>;
    title: string;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
    participant: string[];
    setParticipant: React.Dispatch<React.SetStateAction<string[]>>;
    memo: string;
    setMemo: React.Dispatch<React.SetStateAction<string>>;
    place: string;
    setPlace: React.Dispatch<React.SetStateAction<string>>;
    createSchedule: () => void;
    handleTabs: (i: TabsType) => void;
    isCreatingSchedule: boolean;
};

export type TabsType = {
    label: string;
    value: "list" | "create";
    isActive: boolean;
}

export type Schedule = {
    no: number;
    title: string;
    startDate: string;
    endDate: string;
    participant: string[];
    memo?: string;
    place?: string;
    x?: number;
    y?: number;
}

export type ScheduleComment = {
    id: string;
    author: string;
    content: string;
    createdAt: string;
}

export type ScheduleReactionState = {
    likes: number;
    isLiked: boolean;
}

export type ScheduleListParams = {
    page?: number;
    pageSize?: number;
    date?: string;
};

export type ScheduleListResponse = {
    items: Schedule[];
    total: number;
    page: number;
    pageSize: number;
};

export type ScheduleCreatePayload = {
    title: string;
    startDate: string;
    endDate: string;
    participant: string[];
    memo?: string;
    place?: string;
};

export type ScheduleCommentPayload = {
    author: string;
    content: string;
};
