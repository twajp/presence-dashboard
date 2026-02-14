import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { DEFAULT_USER_VALUES } from '../config/defaults';
import type { User, Seat } from '../types/dashboard.types';
import type { PresenceStatus } from '../config/presence';

export const useUsers = (dashboardId: number | '', isSettingsMode: boolean) => {
    const [users, setUsers] = useState<User[]>([]);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async (showLoading: boolean = false) => {
        if (dashboardId === '') return;
        if (showLoading) {
            setLoading(true);
        }
        const data = await api.fetchUsers(dashboardId);
        setUsers(data);
        setSeats(data.map(u => ({
            id: u.id,
            x: u.x || 0,
            y: u.y || 0,
            status: u.presence,
            userId: u.id
        })));
        if (showLoading) {
            setLoading(false);
        }
    }, [dashboardId]);

    const updateUser = useCallback(async (id: number, data: Partial<User>) => {
        const user = users.find((u) => u.id === id);
        if (!user) return;

        const payload = { ...user, ...data };
        const result = await api.updateUser(id, payload);

        if (result.success && result.data) {
            setUsers(prev => {
                const updated = prev.map(u => u.id === id ? result.data! : u);
                return updated.sort((a, b) => a.order - b.order);
            });
            setSeats(prev => prev.map(s =>
                s.id === id && result.data
                    ? {
                        ...s,
                        status: result.data.presence || s.status,
                        x: result.data.x ?? s.x,
                        y: result.data.y ?? s.y
                    }
                    : s
            ));
        }
    }, [users]);

    const createUser = useCallback(async (userData: { name: string; team: string }) => {
        if (dashboardId === '') return;
        const maxOrder = users.length > 0 ? Math.max(...users.map(u => u.order)) : 0;
        const payload = {
            ...userData,
            presence: 'present' as PresenceStatus,
            ...DEFAULT_USER_VALUES,
            order: maxOrder + 1
        };
        await api.createUser(dashboardId, payload);
        await fetchUsers(false);
    }, [dashboardId, users, fetchUsers]);

    const deleteUser = useCallback(async (id: number) => {
        await api.deleteUser(id);
        await fetchUsers(false);
    }, [fetchUsers]);

    const bulkUpdatePresence = useCallback(async (status: PresenceStatus) => {
        await api.bulkUpdateUserPresence(users, status);
        await fetchUsers(false);
    }, [users, fetchUsers]);

    const moveUser = useCallback(async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= users.length) return;

        const currentItem = { ...users[index] };
        const targetItem = { ...users[targetIndex] };
        const tempOrder = currentItem.order;
        currentItem.order = targetItem.order;
        targetItem.order = tempOrder;

        await Promise.all([
            updateUser(currentItem.id, { order: currentItem.order }),
            updateUser(targetItem.id, { order: targetItem.order })
        ]);
        await fetchUsers(false);
    }, [users, updateUser, fetchUsers]);

    useEffect(() => {
        if (dashboardId !== '') {
            fetchUsers(true);
            if (!isSettingsMode) {
                const interval = setInterval(() => {
                    fetchUsers(false);
                }, 10000);
                return () => clearInterval(interval);
            }
        } else {
            setLoading(false);
        }
    }, [dashboardId, isSettingsMode, fetchUsers]);

    return {
        users,
        seats,
        loading,
        updateUser,
        createUser,
        deleteUser,
        bulkUpdatePresence,
        moveUser,
        refreshUsers: fetchUsers,
    };
};
