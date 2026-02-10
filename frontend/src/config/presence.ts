// Presence status definitions
export const PRESENCE_STATUSES = ['present', 'remote', 'trip', 'off'] as const;
export type PresenceStatus = typeof PRESENCE_STATUSES[number];

export const PRESENCE_STATUS_CONFIG: Record<PresenceStatus, { color: string; label: string }> = {
    present: { color: '#4caf50', label: 'Present' },
    remote: { color: '#2196f3', label: 'Remote' },
    trip: { color: '#ffc107', label: 'Trip' },
    off: { color: '#9e9e9e', label: 'Off' },
};
