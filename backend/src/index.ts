import express, { Request, Response } from 'express';
import { createConnection } from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS handling
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Database connection
let connection: any;

(async () => {
    connection = await createConnection({
        host: process.env.DB_HOST || 'database',
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'database-dev',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    // Health check
    app.get('/api/health', (req: Request, res: Response) => {
        res.json({ status: 'ok' });
    });

    // Get dashboard settings
    app.get('/api/dashboards', async (req: Request, res: Response) => {
        try {
            const [rows] = await connection.execute('SELECT * FROM dashboard_settings');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching dashboards:', error);
            res.status(500).json({ error: 'Failed to fetch dashboards' });
        }
    });

    // Get all users
    app.get('/api/users', async (req: Request, res: Response) => {
        try {
            const [rows] = await connection.execute('SELECT * FROM user ORDER BY `order`');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    });

    // Get users by dashboard ID
    app.get('/api/users/:dashboardId', async (req: Request, res: Response) => {
        try {
            const { dashboardId } = req.params;
            const [rows] = await connection.execute(
                'SELECT * FROM user WHERE dashboard_id = ? ORDER BY `order`',
                [dashboardId]
            );
            res.json(rows);
        } catch (error) {
            console.error('Error fetching users by dashboard:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    });

    // Update user
    app.put('/api/users/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, presence, note1, note2, check1, check2, x, y } = req.body;

            await connection.execute(
                'UPDATE user SET name = ?, presence = ?, note1 = ?, note2 = ?, check1 = ?, check2 = ?, x = ?, y = ? WHERE id = ?',
                [name, presence, note1, note2, check1, check2, x, y, id]
            );

            res.json({ success: true, id });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    });

    // Create user
    app.post('/api/users', async (req: Request, res: Response) => {
        try {
            const { team, name, presence, note1, note2, check1, check2, order, dashboard_id, x, y } = req.body;

            const [result] = await connection.execute(
                'INSERT INTO user (team, name, presence, note1, note2, check1, check2, `order`, dashboard_id, x, y) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [team, name, presence, note1, note2, check1, check2, order, dashboard_id, x, y]
            );

            res.json({ success: true, id: (result as any).insertId });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    });

    // Delete user
    app.delete('/api/users/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await connection.execute('DELETE FROM user WHERE id = ?', [id]);
            res.json({ success: true, id });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    });

    // Start server
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log(`📊 GET /api/dashboards - Get dashboard list`);
        console.log(`👥 GET /api/users - Get user list`);
        console.log(`👤 GET /api/users/:dashboardId - Get users by dashboard`);
        console.log(`✏️  PUT /api/users/:id - Update user`);
        console.log(`➕ POST /api/users - Create user`);
        console.log(`🗑️  DELETE /api/users/:id - Delete user`);
    });
})();
