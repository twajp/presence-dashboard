export const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000');
