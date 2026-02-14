import { type PresenceStatus } from '../config/presence';

export type Dashboard = {
    id: number;
    dashboard_name: string;
};

export type User = {
    id: number;
    name: string;
    presence: PresenceStatus;
    note1?: string;
    note2?: string;
    note3?: string;
    check1?: boolean;
    check2?: boolean;
    check3?: boolean;
    x: number;
    y: number;
    width?: number;
    height?: number;
    team?: string;
    dashboard_id?: number;
    order: number;
    updated_at?: string;
};

export type Seat = {
    id: number;
    x: number;
    y: number;
    status: PresenceStatus;
    userId?: number;
};

export type DashboardSettings = {
    team_label: string;
    name_label: string;
    presence_label: string;
    note1_label: string;
    note2_label: string;
    note3_label: string;
    check1_label: string;
    check2_label: string;
    check3_label: string;
    updated_at_label: string;
    hide_note1: boolean;
    hide_note2: boolean;
    hide_note3: boolean;
    hide_check1: boolean;
    hide_check2: boolean;
    hide_check3: boolean;
    hide_updated_at: boolean;
    team_width: number;
    name_width: number;
    presence_width: number;
    note1_width: number;
    note2_width: number;
    note3_width: number;
    check1_width: number;
    check2_width: number;
    check3_width: number;
    updated_at_width: number;
    grid_width: number;
    grid_height: number;
    notes: string;
};
