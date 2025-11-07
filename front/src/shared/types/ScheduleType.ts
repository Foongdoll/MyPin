export interface ScheduleListConponentProp {
    title: string;
    width: number;
    height: number;
    layout: 'hor' | 'ver';
    range: string;
}

export type TabsType = {
    label: string;
    isActive: boolean;
}

export type Schedule = {
    no: number;
    title: string;
    startDate: Date;
    endDate: Date;
    participant: string[];
    memo?: string;
    place?: string;
}