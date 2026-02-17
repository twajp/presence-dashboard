import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import type { Dashboard } from '../types/dashboard.types';

export const useDashboards = () => {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [dashboardId, setDashboardId] = useState<number | ''>(() => {
        const saved = localStorage.getItem('selectedDashboardId');
        return saved ? Number(saved) : '';
    });

    const fetchDashboards = useCallback(async () => {
        const data = await api.fetchDashboards();
        setDashboards(data);
    }, []);

    const selectDashboard = useCallback((id: number) => {
        setDashboardId(id);
        localStorage.setItem('selectedDashboardId', id.toString());
    }, []);

    const createDashboard = useCallback(async (name: string) => {
        const result = await api.createDashboard(name);
        await fetchDashboards();
        if (result.success && result.data?.id) {
            selectDashboard(result.data.id);
        }
    }, [fetchDashboards, selectDashboard]);

    const updateDashboard = useCallback(async (id: number, name: string) => {
        await api.updateDashboard(id, name);
        await fetchDashboards();
    }, [fetchDashboards]);

    const deleteDashboard = useCallback(async (id: number) => {
        const res = await api.deleteDashboard(id);
        if (res.ok) {
            setDashboardId('');
            localStorage.removeItem('selectedDashboardId');
            await fetchDashboards();
            return true;
        }
        return false;
    }, [fetchDashboards]);

    useEffect(() => {
        fetchDashboards();
    }, [fetchDashboards]);

    return {
        dashboards,
        dashboardId,
        setDashboardId: selectDashboard,
        createDashboard,
        updateDashboard,
        deleteDashboard,
        refreshDashboards: fetchDashboards,
    };
};
