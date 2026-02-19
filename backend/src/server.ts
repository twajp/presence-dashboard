import express from 'express';
import { createConnection, Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DEFAULT_DASHBOARD_SETTINGS } from './config/defaults.js';
import { PRESENCE_STATUSES, type PresenceStatus } from './config/presence.js';

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
                team_width, name_width, presence_width,
                note1_width, note2_width, note3_width,
                check1_width, check2_width, check3_width,
                updated_at_width,
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

            // Build dynamic UPDATE query with only provided fields
            const updates: string[] = [];
            const values: any[] = [];

            if (team_label !== undefined) { updates.push('team_label=?'); values.push(team_label); }
            if (name_label !== undefined) { updates.push('name_label=?'); values.push(name_label); }
            if (presence_label !== undefined) { updates.push('presence_label=?'); values.push(presence_label); }
            if (note1_label !== undefined) { updates.push('note1_label=?'); values.push(note1_label); }
            if (note2_label !== undefined) { updates.push('note2_label=?'); values.push(note2_label); }
            if (note3_label !== undefined) { updates.push('note3_label=?'); values.push(note3_label); }
            if (check1_label !== undefined) { updates.push('check1_label=?'); values.push(check1_label); }
            if (check2_label !== undefined) { updates.push('check2_label=?'); values.push(check2_label); }
            if (check3_label !== undefined) { updates.push('check3_label=?'); values.push(check3_label); }
            if (updated_at_label !== undefined) { updates.push('updated_at_label=?'); values.push(updated_at_label); }
            if (hide_note1 !== undefined) { updates.push('hide_note1=?'); values.push(hide_note1); }
            if (hide_note2 !== undefined) { updates.push('hide_note2=?'); values.push(hide_note2); }
            if (hide_note3 !== undefined) { updates.push('hide_note3=?'); values.push(hide_note3); }
            if (hide_check1 !== undefined) { updates.push('hide_check1=?'); values.push(hide_check1); }
            if (hide_check2 !== undefined) { updates.push('hide_check2=?'); values.push(hide_check2); }
            if (hide_check3 !== undefined) { updates.push('hide_check3=?'); values.push(hide_check3); }
            if (hide_updated_at !== undefined) { updates.push('hide_updated_at=?'); values.push(hide_updated_at); }
            if (team_width !== undefined) { updates.push('team_width=?'); values.push(team_width); }
            if (name_width !== undefined) { updates.push('name_width=?'); values.push(name_width); }
            if (presence_width !== undefined) { updates.push('presence_width=?'); values.push(presence_width); }
            if (note1_width !== undefined) { updates.push('note1_width=?'); values.push(note1_width); }
            if (note2_width !== undefined) { updates.push('note2_width=?'); values.push(note2_width); }
            if (note3_width !== undefined) { updates.push('note3_width=?'); values.push(note3_width); }
            if (check1_width !== undefined) { updates.push('check1_width=?'); values.push(check1_width); }
            if (check2_width !== undefined) { updates.push('check2_width=?'); values.push(check2_width); }
            if (check3_width !== undefined) { updates.push('check3_width=?'); values.push(check3_width); }
            if (updated_at_width !== undefined) { updates.push('updated_at_width=?'); values.push(updated_at_width); }
            if (grid_width !== undefined) { updates.push('grid_width=?'); values.push(grid_width); }
            if (grid_height !== undefined) { updates.push('grid_height=?'); values.push(grid_height); }
            if (notes !== undefined) { updates.push('notes=?'); values.push(notes); }

            if (updates.length === 0) {
                return sendError(res, 400, 'No fields to update');
            }

            values.push(dashboardId);

            const [result] = await connection.execute<ResultSetHeader>(
                `UPDATE dashboard_settings SET ${updates.join(', ')} WHERE id=?`,
                values
            );

            if (result.affectedRows === 0) {
                return sendError(res, 404, 'Dashboard not found');
            }

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
            const { team, name, presence, note1, note2, note3, check1, check2, check3, x, y, width, height, order } = req.body;

            if (!dashboardId || isNaN(Number(dashboardId))) {
                return sendError(res, 400, 'Invalid dashboard ID');
            }

            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return sendError(res, 400, 'Name is required');
            }

            if (!presence || !PRESENCE_STATUSES.includes(presence as PresenceStatus)) {
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
                (team, name, presence, dashboard_id, note1, note2, note3, check1, check2, check3, x, y, width, height, \`order\`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [team, name.trim(), presence, dashboardId, note1, note2, note3, check1, check2, check3, x ?? 0, y ?? 0, width ?? 80, height ?? 40, order ?? 0]
            );

            sendSuccess(res, { id: result.insertId }, 201);
        }));

        // Update user
        app.put('/api/users/:userId', asyncHandler(async (req: express.Request, res: express.Response) => {
            const { userId } = req.params;
            const { team, name, presence, note1, note2, note3, check1, check2, check3, x, y, width, height, order } = req.body;

            if (!userId || isNaN(Number(userId))) {
                return sendError(res, 400, 'Invalid user ID');
            }

            if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
                return sendError(res, 400, 'Name cannot be empty');
            }

            if (presence !== undefined && !PRESENCE_STATUSES.includes(presence as PresenceStatus)) {
                return sendError(res, 400, 'Invalid presence status');
            }

            // Build dynamic UPDATE query with only provided fields
            const updates: string[] = [];
            const values: any[] = [];

            if (team !== undefined) { updates.push('team=?'); values.push(team); }
            if (name !== undefined) { updates.push('name=?'); values.push(name.trim()); }
            if (presence !== undefined) { updates.push('presence=?'); values.push(presence); }
            if (note1 !== undefined) { updates.push('note1=?'); values.push(note1); }
            if (note2 !== undefined) { updates.push('note2=?'); values.push(note2); }
            if (note3 !== undefined) { updates.push('note3=?'); values.push(note3); }
            if (check1 !== undefined) { updates.push('check1=?'); values.push(check1); }
            if (check2 !== undefined) { updates.push('check2=?'); values.push(check2); }
            if (check3 !== undefined) { updates.push('check3=?'); values.push(check3); }
            if (x !== undefined) { updates.push('x=?'); values.push(x); }
            if (y !== undefined) { updates.push('y=?'); values.push(y); }
            if (width !== undefined) { updates.push('width=?'); values.push(width); }
            if (height !== undefined) { updates.push('height=?'); values.push(height); }
            if (order !== undefined) { updates.push('`order`=?'); values.push(order); }

            if (updates.length === 0) {
                return sendError(res, 400, 'No fields to update');
            }

            values.push(userId);

            const [result] = await connection.execute<ResultSetHeader>(
                `UPDATE users SET ${updates.join(', ')} WHERE id=?`,
                values
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
