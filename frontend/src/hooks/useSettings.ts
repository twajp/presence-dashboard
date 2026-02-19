import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import type { DashboardSettings } from '../types/dashboard.types';
import { DEFAULT_DASHBOARD_SETTINGS } from '../config/defaults';

export const useSettings = (dashboardId: number | '', isSettingsMode: boolean) => {
    const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_DASHBOARD_SETTINGS);
    const [gridWidth, setGridWidth] = useState(DEFAULT_DASHBOARD_SETTINGS.grid_width);
    const [gridHeight, setGridHeight] = useState(DEFAULT_DASHBOARD_SETTINGS.grid_height);
    const [notes, setNotes] = useState('');

    const fetchSettings = useCallback(async () => {
        if (dashboardId === '') return;
        const data = await api.fetchDashboardSettings(dashboardId);
        const newSettings: DashboardSettings = {
            team_label: data.team_label || DEFAULT_DASHBOARD_SETTINGS.team_label,
            name_label: data.name_label || DEFAULT_DASHBOARD_SETTINGS.name_label,
            presence_label: data.presence_label || DEFAULT_DASHBOARD_SETTINGS.presence_label,
            note1_label: data.note1_label || DEFAULT_DASHBOARD_SETTINGS.note1_label,
            note2_label: data.note2_label || DEFAULT_DASHBOARD_SETTINGS.note2_label,
            note3_label: data.note3_label || DEFAULT_DASHBOARD_SETTINGS.note3_label,
            check1_label: data.check1_label || DEFAULT_DASHBOARD_SETTINGS.check1_label,
            check2_label: data.check2_label || DEFAULT_DASHBOARD_SETTINGS.check2_label,
            check3_label: data.check3_label || DEFAULT_DASHBOARD_SETTINGS.check3_label,
            updated_at_label: data.updated_at_label || DEFAULT_DASHBOARD_SETTINGS.updated_at_label,
            hide_note1: data.hide_note1 ?? DEFAULT_DASHBOARD_SETTINGS.hide_note1,
            hide_note2: data.hide_note2 ?? DEFAULT_DASHBOARD_SETTINGS.hide_note2,
            hide_note3: data.hide_note3 ?? DEFAULT_DASHBOARD_SETTINGS.hide_note3,
            hide_check1: data.hide_check1 ?? DEFAULT_DASHBOARD_SETTINGS.hide_check1,
            hide_check2: data.hide_check2 ?? DEFAULT_DASHBOARD_SETTINGS.hide_check2,
            hide_check3: data.hide_check3 ?? DEFAULT_DASHBOARD_SETTINGS.hide_check3,
            hide_updated_at: data.hide_updated_at ?? DEFAULT_DASHBOARD_SETTINGS.hide_updated_at,
            team_width: data.team_width ?? DEFAULT_DASHBOARD_SETTINGS.team_width,
            name_width: data.name_width ?? DEFAULT_DASHBOARD_SETTINGS.name_width,
            presence_width: data.presence_width ?? DEFAULT_DASHBOARD_SETTINGS.presence_width,
            note1_width: data.note1_width ?? DEFAULT_DASHBOARD_SETTINGS.note1_width,
            note2_width: data.note2_width ?? DEFAULT_DASHBOARD_SETTINGS.note2_width,
            note3_width: data.note3_width ?? DEFAULT_DASHBOARD_SETTINGS.note3_width,
            check1_width: data.check1_width ?? DEFAULT_DASHBOARD_SETTINGS.check1_width,
            check2_width: data.check2_width ?? DEFAULT_DASHBOARD_SETTINGS.check2_width,
            check3_width: data.check3_width ?? DEFAULT_DASHBOARD_SETTINGS.check3_width,
            updated_at_width: data.updated_at_width ?? DEFAULT_DASHBOARD_SETTINGS.updated_at_width,
            grid_width: data.grid_width ?? DEFAULT_DASHBOARD_SETTINGS.grid_width,
            grid_height: data.grid_height ?? DEFAULT_DASHBOARD_SETTINGS.grid_height,
            notes: data.notes || DEFAULT_DASHBOARD_SETTINGS.notes
        };
        setSettings(newSettings);
        setGridWidth(newSettings.grid_width);
        setGridHeight(newSettings.grid_height);
        setNotes(newSettings.notes);
    }, [dashboardId]);

    const updateSettings = useCallback(async (newSettings: Partial<DashboardSettings>) => {
        if (dashboardId === '') return;
        setSettings(prev => ({ ...prev, ...newSettings }));
        await api.updateDashboardSettings(dashboardId, newSettings);
    }, [dashboardId]);

    const updateGridWidth = useCallback(async (width: number) => {
        setGridWidth(width);
        await updateSettings({ grid_width: width });
    }, [updateSettings]);

    const updateGridHeight = useCallback(async (height: number) => {
        setGridHeight(height);
        await updateSettings({ grid_height: height });
    }, [updateSettings]);

    const updateNotes = useCallback(async (newNotes: string) => {
        setNotes(newNotes);
        await updateSettings({ notes: newNotes });
    }, [updateSettings]);

    useEffect(() => {
        if (dashboardId !== '') {
            fetchSettings();
            if (!isSettingsMode) {
                const interval = setInterval(() => {
                    fetchSettings();
                }, 10000);
                return () => clearInterval(interval);
            }
        }
    }, [dashboardId, isSettingsMode, fetchSettings]);

    return {
        settings,
        gridWidth,
        gridHeight,
        notes,
        setSettings,
        setNotes,
        updateSettings,
        updateGridWidth,
        updateGridHeight,
        updateNotes,
    };
};
