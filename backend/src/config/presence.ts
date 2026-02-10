// Presence status definitions
export const PRESENCE_STATUSES = ['present', 'remote', 'trip', 'off'] as const;
export type PresenceStatus = typeof PRESENCE_STATUSES[number];
