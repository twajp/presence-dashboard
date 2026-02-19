import { API_BASE_URL } from '../config/api';
import type { Dashboard, User, DashboardSettings } from '../types/dashboard.types';
import type { PresenceStatus } from '../config/presence';

// Dashboards
export const fetchDashboards = async (): Promise<Dashboard[]> => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/dashboards`);
        const result = await res.json();
        return result.success ? result.data : [];
    } catch (err) {
        console.error('Failed to fetch dashboards', err);
        return [];
    }
};

export const createDashboard = async (dashboardName: string): Promise<{ success: boolean; data?: Dashboard }> => {
    const res = await fetch(`${API_BASE_URL}/api/dashboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboard_name: dashboardName }),
    });
    return await res.json();
};

export const updateDashboard = async (dashboardId: number, dashboardName: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboard_name: dashboardName }),
    });
};

export const deleteDashboard = async (dashboardId: number): Promise<Response> => {
    return await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}`, {
        method: 'DELETE'
    });
};

// Users
export const fetchUsers = async (dashboardId: number): Promise<User[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/users`);
        const result = await response.json();
        const data: User[] = result.success ? result.data : [];
        return [...data].sort((a, b) => a.order - b.order);
    } catch (err) {
        console.error(err);
        return [];
    }
};

export const createUser = async (dashboardId: number, userData: Partial<User>): Promise<void> => {
    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
};

export const updateUser = async (userId: number, userData: Partial<User>): Promise<{ success: boolean; data?: User }> => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return await response.json();
};

export const deleteUser = async (userId: number): Promise<void> => {
    await fetch(`${API_BASE_URL}/api/users/${userId}`, { method: 'DELETE' });
};

export const bulkUpdateUserPresence = async (users: User[], status: PresenceStatus): Promise<void> => {
    const updatePromises = users.map(user =>
        fetch(`${API_BASE_URL}/api/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ presence: status }),
        })
    );
    await Promise.all(updatePromises);
};

// Settings
export const fetchDashboardSettings = async (dashboardId: number): Promise<Partial<DashboardSettings>> => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/settings`);
        const result = await res.json();
        return result.success ? result.data : {};
    } catch (err) {
        console.error(err);
        return {};
    }
};

export const updateDashboardSettings = async (dashboardId: number, settings: Partial<DashboardSettings>): Promise<void> => {
    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
};
