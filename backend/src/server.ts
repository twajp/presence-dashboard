import express from 'express';
import { createConnection, Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DEFAULT_DASHBOARD_SETTINGS } from './config/defaults';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    req.method === 'OPTIONS' ? res.sendStatus(200) : next();
});

let connection: Connection;

// ============================
// Helper Functions
// ============================

const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const sendError = (res: express.Response, statusCode: number, message: string) => {
    res.status(statusCode).json({ success: false, error: message });
};

const sendSuccess = (res: express.Response, data: any, statusCode: number = 200) => {
    res.status(statusCode).json({ success: true, data });
};

// ============================
// Health Check
// ============================

app.get('/health', async (req, res) => {
    if (!connection) {
        return res.status(503).send('Database not ready');
    }
    try {
        await connection.ping();
        res.send('OK');
    } catch (error) {
        res.status(503).send('Database connection failed');
    }
});

// ============================
// Database Connection
// ============================

(async () => {
    try {
        // Wait for database connection with retry logic
        let retries = 30;
        while (retries > 0) {
            try {
                connection = await createConnection({
                    host: process.env.DB_HOST || 'database',
                    user: process.env.DB_USER || 'user',
                    password: process.env.DB_PASSWORD || 'password',
                    database: process.env.DB_NAME || 'database-dev',
                });
                console.log('✅ Database connected');
                break;
            } catch (error) {
                retries--;
                console.log(`⏳ Waiting for database... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (retries === 0) throw error;
            }
        }

        // ============================
        // Dashboard Endpoints
        // ============================

        // Get all dashboards
        app.get('/api/dashboards', asyncHandler(async (req: express.Request, res: express.Response) => {
            const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM dashboard_settings ORDER BY id');
            sendSuccess(res, rows);
        }));

        // Get specific dashboard
        app.get('/api/dashboards/:dashboardId', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { dashboardId } = req.params;

            if (!dashboardId || isNaN(Number(dashboardId))) {
                return sendError(res, 400, 'Invalid dashboard ID');
            }

            const [rows] = await connection.execute<RowDataPacket[]>(
                'SELECT * FROM dashboard_settings WHERE id = ?',
                [dashboardId]
            );

            if (rows.length === 0) {
                return sendError(res, 404, 'Dashboard not found');
            }

            sendSuccess(res, rows[0]);
        }));

        // Create dashboard
        app.post('/api/dashboards', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { dashboard_name } = req.body;

            if (!dashboard_name || typeof dashboard_name !== 'string' || dashboard_name.trim().length === 0) {
                return sendError(res, 400, 'Dashboard name is required');
            }

            const [result] = await connection.execute<ResultSetHeader>(
                'INSERT INTO dashboard_settings (dashboard_name) VALUES (?)',
                [dashboard_name.trim()]
            );

            sendSuccess(res, { id: result.insertId, dashboard_name: dashboard_name.trim() }, 201);
        }));

        // Update dashboard name
        app.put('/api/dashboards/:dashboardId', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { dashboardId } = req.params;
            const { dashboard_name } = req.body;

            if (!dashboardId || isNaN(Number(dashboardId))) {
                return sendError(res, 400, 'Invalid dashboard ID');
            }

            if (!dashboard_name || typeof dashboard_name !== 'string' || dashboard_name.trim().length === 0) {
                return sendError(res, 400, 'Dashboard name is required');
            }

            const [result] = await connection.execute<ResultSetHeader>(
                'UPDATE dashboard_settings SET dashboard_name = ? WHERE id = ?',
                [dashboard_name.trim(), dashboardId]
            );

            if (result.affectedRows === 0) {
                return sendError(res, 404, 'Dashboard not found');
            }

            sendSuccess(res, { id: Number(dashboardId), dashboard_name: dashboard_name.trim() });
        }));

        // Delete dashboard
        app.delete('/api/dashboards/:dashboardId', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { dashboardId } = req.params;

            if (!dashboardId || isNaN(Number(dashboardId))) {
                return sendError(res, 400, 'Invalid dashboard ID');
            }

            // Delete associated users first
            await connection.execute('DELETE FROM users WHERE dashboard_id = ?', [dashboardId]);

            // Delete dashboard
            const [result] = await connection.execute<ResultSetHeader>(
                'DELETE FROM dashboard_settings WHERE id = ?',
                [dashboardId]
            );

            if (result.affectedRows === 0) {
                return sendError(res, 404, 'Dashboard not found');
            }

            sendSuccess(res, { id: Number(dashboardId) });
        }));

        // ============================
        // Dashboard Settings Endpoints
        // ============================

        // Get dashboard settings
        app.get('/api/dashboards/:dashboardId/settings', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { dashboardId } = req.params;

            if (!dashboardId || isNaN(Number(dashboardId))) {
                return sendError(res, 400, 'Invalid dashboard ID');
            }

            const [rows] = await connection.execute<RowDataPacket[]>(
                'SELECT * FROM dashboard_settings WHERE id = ?',
                [dashboardId]
            );

            if (rows.length === 0) {
                return sendError(res, 404, 'Dashboard not found');
            }

            const settings = rows[0] || DEFAULT_DASHBOARD_SETTINGS;

            sendSuccess(res, settings);
        }));

        // Update dashboard settings
        app.put('/api/dashboards/:dashboardId/settings', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { dashboardId } = req.params;
            const {
                team_label, name_label, presence_label,
                note1_label, note2_label, note3_label,
                check1_label, check2_label, check3_label,
                updated_at_label,
                hide_note1, hide_note2, hide_note3,
                hide_check1, hide_check2, hide_check3,
                hide_updated_at,
                grid_width, grid_height, notes
            } = req.body;

            if (!dashboardId || isNaN(Number(dashboardId))) {
                return sendError(res, 400, 'Invalid dashboard ID');
            }

            // Validate grid dimensions
            if (grid_width !== undefined && (isNaN(Number(grid_width)) || Number(grid_width) <= 0)) {
                return sendError(res, 400, 'Invalid grid_width');
            }
            if (grid_height !== undefined && (isNaN(Number(grid_height)) || Number(grid_height) <= 0)) {
                return sendError(res, 400, 'Invalid grid_height');
            }

            const values = [
                dashboardId,
                team_label ?? null,
                name_label ?? null,
                presence_label ?? null,
                note1_label ?? null,
                note2_label ?? null,
                note3_label ?? null,
                check1_label ?? null,
                check2_label ?? null,
                check3_label ?? null,
                updated_at_label ?? null,
                hide_note1 ?? false,
                hide_note2 ?? false,
                hide_note3 ?? false,
                hide_check1 ?? false,
                hide_check2 ?? false,
                hide_check3 ?? false,
                hide_updated_at ?? false,
                grid_width ?? null,
                grid_height ?? null,
                notes ?? null
            ];

            await connection.execute(
                `INSERT INTO dashboard_settings 
                (id, team_label, name_label, presence_label, note1_label, note2_label, note3_label, 
                check1_label, check2_label, check3_label, updated_at_label, 
                hide_note1, hide_note2, hide_note3, hide_check1, hide_check2, hide_check3, hide_updated_at, 
                grid_width, grid_height, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                team_label=?, name_label=?, presence_label=?, 
                note1_label=?, note2_label=?, note3_label=?, 
                check1_label=?, check2_label=?, check3_label=?, 
                updated_at_label=?, 
                hide_note1=?, hide_note2=?, hide_note3=?, 
                hide_check1=?, hide_check2=?, hide_check3=?, hide_updated_at=?, 
                grid_width=?, grid_height=?, notes=?`,
                [...values, ...values.slice(1)]
            );

            sendSuccess(res, { id: Number(dashboardId) });
        }));

        // ============================
        // User Endpoints
        // ============================

        // Get users by dashboard
        app.get('/api/dashboards/:dashboardId/users', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { dashboardId } = req.params;

            if (!dashboardId || isNaN(Number(dashboardId))) {
                return sendError(res, 400, 'Invalid dashboard ID');
            }

            const [rows] = await connection.execute<RowDataPacket[]>(
                'SELECT * FROM users WHERE dashboard_id = ? ORDER BY `order` ASC',
                [dashboardId]
            );

            sendSuccess(res, rows);
        }));

        // Get specific user
        app.get('/api/users/:userId', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { userId } = req.params;

            if (!userId || isNaN(Number(userId))) {
                return sendError(res, 400, 'Invalid user ID');
            }

            const [rows] = await connection.execute<RowDataPacket[]>(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );

            if (rows.length === 0) {
                return sendError(res, 404, 'User not found');
            }

            sendSuccess(res, rows[0]);
        }));

        // Create user
        app.post('/api/dashboards/:dashboardId/users', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { dashboardId } = req.params;
            const { team, name, presence, note1, note2, note3, check1, check2, check3, x, y, order } = req.body;

            if (!dashboardId || isNaN(Number(dashboardId))) {
                return sendError(res, 400, 'Invalid dashboard ID');
            }

            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return sendError(res, 400, 'Name is required');
            }

            if (!presence || !['present', 'remote', 'trip', 'off'].includes(presence)) {
                return sendError(res, 400, 'Valid presence status is required');
            }

            if (x !== undefined && isNaN(Number(x))) {
                return sendError(res, 400, 'Invalid x coordinate');
            }

            if (y !== undefined && isNaN(Number(y))) {
                return sendError(res, 400, 'Invalid y coordinate');
            }

            const [result] = await connection.execute<ResultSetHeader>(
                `INSERT INTO users 
                (team, name, presence, dashboard_id, note1, note2, note3, check1, check2, check3, x, y, \`order\`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [team, name.trim(), presence, dashboardId, note1, note2, note3, check1, check2, check3, x ?? 0, y ?? 0, order ?? 0]
            );

            sendSuccess(res, { id: result.insertId }, 201);
        }));

        // Update user
        app.put('/api/users/:userId', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { userId } = req.params;
            const { team, name, presence, note1, note2, note3, check1, check2, check3, x, y, order } = req.body;

            if (!userId || isNaN(Number(userId))) {
                return sendError(res, 400, 'Invalid user ID');
            }

            if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
                return sendError(res, 400, 'Name cannot be empty');
            }

            if (presence !== undefined && !['present', 'remote', 'trip', 'off'].includes(presence)) {
                return sendError(res, 400, 'Invalid presence status');
            }

            const [result] = await connection.execute<ResultSetHeader>(
                `UPDATE users SET 
                team=?, name=?, presence=?, note1=?, note2=?, note3=?, 
                check1=?, check2=?, check3=?, x=?, y=?, \`order\`=? 
                WHERE id=?`,
                [team, name?.trim(), presence, note1, note2, note3, check1, check2, check3, x, y, order, userId]
            );

            if (result.affectedRows === 0) {
                return sendError(res, 404, 'User not found');
            }

            const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [userId]);
            sendSuccess(res, rows[0]);
        }));

        // Delete user
        app.delete('/api/users/:userId', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { userId } = req.params;

            if (!userId || isNaN(Number(userId))) {
                return sendError(res, 400, 'Invalid user ID');
            }

            const [result] = await connection.execute<ResultSetHeader>(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );

            if (result.affectedRows === 0) {
                return sendError(res, 404, 'User not found');
            }

            sendSuccess(res, { id: Number(userId) });
        }));

        // ============================
        // Error Handler
        // ============================

        app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('Error:', err);
            sendError(res, err.statusCode || 500, err.message || 'Internal server error');
        });

        // ============================
        // Start Server
        // ============================

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log('\n📚 API Endpoints:');
            console.log('\n  Health:');
            console.log('    GET    /health');
            console.log('\n  Dashboards:');
            console.log('    GET    /api/dashboards');
            console.log('    GET    /api/dashboards/:dashboardId');
            console.log('    POST   /api/dashboards');
            console.log('    PUT    /api/dashboards/:dashboardId');
            console.log('    DELETE /api/dashboards/:dashboardId');
            console.log('\n  Dashboard Settings:');
            console.log('    GET    /api/dashboards/:dashboardId/settings');
            console.log('    PUT    /api/dashboards/:dashboardId/settings');
            console.log('\n  Users:');
            console.log('    GET    /api/dashboards/:dashboardId/users');
            console.log('    GET    /api/users/:userId');
            console.log('    POST   /api/dashboards/:dashboardId/users');
            console.log('    PUT    /api/users/:userId');
            console.log('    DELETE /api/users/:userId');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
})();
